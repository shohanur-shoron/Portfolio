import json
import os
import time
from django.http import StreamingHttpResponse, JsonResponse
from django.conf import settings
from .models import Commands

# LangChain Imports for RAG
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# --- Path for the pre-built FAISS index ---
FAISS_INDEX_PATH = os.path.join(settings.BASE_DIR, 'faiss_index')


# --- Standard Command Functions ---

def send_help():
    html_output = '<h3>Available commands:</h3><ul>'
    # You can add commands to your database via the Django admin panel later
    # For now, we'll create some default text.
    all_commands = Commands.objects.exclude(name='help').order_by('serial')
    if not all_commands:
        html_output += "<li>No commands found in the database.</li>"
    for command in all_commands:
        list_item = f'<li>[<span class="redtext">{command.serial}</span>] <span class="redtext">{command.name}</span> – {command.forwhat}</li>'
        html_output += list_item
    html_output += '</ul>'
    html_output += "<p>You can also type '<span class=\"redtext\">chat</span>' to talk to an AI assistant about Shoron's portfolio.</p>"
    html_output += '<p>NB: Enter Number or Write Command.</p>'
    return html_output


def process_command(command):
    command_name = command.strip().lower()
    response_payload = {}
    try:
        if command_name == 'help' or command_name == 'dir':
            html_output = send_help()
            response_payload = {"type": 'html', "content": html_output}
        elif command_name == 'chat':
            response_payload = {"type": 'html',
                                "content": "Entered chat mode. Ask me anything about Shoron's projects or skills. Type '<span class=\"redtext\">quit</span>' to exit."}
        else:
            try:
                command_obj = Commands.objects.get(name=command_name)
            except Commands.DoesNotExist:
                if command_name.isdigit():
                    command_obj = Commands.objects.get(serial=int(command_name))
                else:
                    raise Commands.DoesNotExist
            response_payload = {"type": command_obj.response_type, "content": command_obj.response}
    except Commands.DoesNotExist:
        response_payload = {"type": "text",
                            "content": f"'{command}' is not recognized as an internal or external command"}
    except Exception as e:
        response_payload = {"type": "text", "content": f"An error occurred on the server: {str(e)}"}

    yield f"data: {json.dumps(response_payload)}\n\n"
    yield "data: [DONE]\n\n"


def terminal_api(request):
    command = request.GET.get('command', '')
    response = StreamingHttpResponse(process_command(command), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response


# --- RAG-Powered Chat Streaming Function ---

def get_all_commands(request):
    
    command_names = list(Commands.objects.values_list('name', flat=True).distinct())
    
    predefined_commands = ['help', 'dir', 'chat', 'quit', 'clear', 'cls', 'theme']
    command_names.extend(predefined_commands)
    
    command_names = sorted(list(set(command_names)))
    
    return JsonResponse(command_names, safe=False)


def stream_rag_chat_response(message):
    # start_loading_payload = {"type": "loading", "content": True}
    # yield f"data: {json.dumps(start_loading_payload)}\n\n"

    try:
        # 1. Initialize Models and Load Index 1. gemma-3-27b-it    2.   gemini-2.5-flash-lite-preview-06-17
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite-preview-06-17", google_api_key=settings.API_KEY,
                                     convert_system_message_to_human=True)
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.API_KEY)

        vector_store = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = vector_store.as_retriever(search_kwargs={'k': 4})

        # 2. Define RAG Prompt Template
        template = """
                You are Jarvis, a friendly and enthusiastic AI assistant for Md. Shohanur Rahman's or nickname shoron portfolio website.
                Your goal is to answer questions about Shoron in a conversational and helpful manner about everything.
                Use the context provided below to form your answers. Format your responses using Markdown for clarity (lists, bold text, etc.).
                and also dont start the chat with Based on or according to etc just have a casual conversion.

                - Your primary source of information is the context and you can add when it feels like a good idea.
                - If the context does not contain the answer, politely state that your knowledge is limited to Shoron's portfolio and suggest other topics the user could ask about, like "his AI projects," "his work experience," or "how to contact him."
                - When asked a general question like "what can you do?" or "how can you help?", summarize the key areas of information you have, such as Shoron's skills, projects, education, contact, experience and all the other questions.

                Context:
                {context}

                Question:
                {question}

                Helpful Answer:
                """
        prompt = ChatPromptTemplate.from_template(template)

        # 3. Create LangChain RAG Chain
        rag_chain = (
                {"context": retriever, "question": RunnablePassthrough()}
                | prompt
                | llm
                | StrOutputParser()
        )

        # 4. Stream the Response
        for chunk in rag_chain.stream(message):
            payload_obj = {"type": "chunk", "content": chunk}
            yield f"data: {json.dumps(payload_obj)}\n\n"


    except FileNotFoundError:
        error_payload = {"type": "error",
                         "content": f"\n<span class='redtext'>Error: Knowledge base index not found. The admin needs to run 'python manage.py create_index'.</span>"}
        yield f"data: {json.dumps(error_payload)}\n\n"
    except Exception as e:
        error_payload = {"type": "error",
                         "content": f"\n<span class='redtext'>An error occurred with the AI service: {str(e)}</span>"}
        yield f"data: {json.dumps(error_payload)}\n\n"
    finally:
        yield "data: [DONE]\n\n"



def chat_api(request):
    message = request.GET.get('message', '').strip().lower()
    if not message:
        return StreamingHttpResponse((b"data: [DONE]\n\n",), content_type='text/event-stream')

    if message == 'help' or message == 'dir':
        def help_in_chat_stream():
            """A generator to stream a specific help message for chat mode."""
            help_content = f"To use system commands '{message}', please type '<span class=\"redtext\">quit</span>' to exit the chat session first."

            payload_obj = {"type": "chunk", "content": help_content}
            yield f"data: {json.dumps(payload_obj)}\n\n"

            yield "data: [DONE]\n\n"

        response = StreamingHttpResponse(help_in_chat_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        return response

    response = StreamingHttpResponse(stream_rag_chat_response(message), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response
