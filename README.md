# 🤖 Jarvis: The AI-Powered Portfolio Terminal

![image](https://github.com/user-attachments/assets/882eb12a-b040-4d26-8f33-817b9c121607)


**Live Demo:** [shoron.dev](https://shohanurrahman.pythonanywhere.com)

## 🚀 Introduction

Jarvis is not just a portfolio; it's an interactive experience. This project transforms a standard developer portfolio into a dynamic, terminal-based interface powered by a Retrieval-Augmented Generation (RAG) chat assistant. Users can navigate the portfolio using classic terminal commands and have natural conversations with an AI to learn about my skills, projects, and experience.

The goal of this project is to showcase my technical abilities in a creative and engaging way, demonstrating my expertise in full-stack development, AI integration, and user experience design.

## ✨ Features

*   **Interactive Terminal Interface:** A fully functional terminal window, complete with a command prompt, command history, and autocomplete.
*   **RAG-Powered Chat Assistant:** A conversational AI assistant (named Jarvis) that can answer questions about my portfolio in a natural and helpful way.
*   **Dynamic Content:** The portfolio's content is served dynamically through a Django backend, making it easy to update and manage.
*   **Theme Customization:** Users can choose from a variety of color themes to personalize their terminal experience.
*   **Responsive Design:** The terminal is designed to be fully responsive and works seamlessly on both desktop and mobile devices.
*   **Streaming Responses:** Both the standard command responses and the AI chat responses are streamed to the terminal, creating a smooth and interactive user experience.

## 🛠️ Technologies Used

### Backend

*   **Python:** The primary programming language for the backend.
*   **Django:** A high-level Python web framework for rapid development.
*   **LangChain:** A framework for developing applications powered by language models.
*   **Google Generative AI:** The AI model used for the RAG chat assistant.
*   **FAISS:** A library for efficient similarity search and clustering of dense vectors.
*   **SQLite:** A lightweight, serverless SQL database engine.

### Frontend

*   **HTML5, CSS3, JavaScript:** The core technologies for building the user interface.
*   **Vanilla JavaScript:** No frontend frameworks were used, demonstrating strong fundamentals in the language.
*   **EventSource API:** Used for streaming server-sent events from the backend.
*   **Marked.js:** A fast, lightweight Markdown parser for rendering the AI's responses.

## 🏛️ Architecture

The project follows a client-server architecture, with a clear separation between the frontend and backend.

```
+-----------------+      +----------------------+      +------------------------+
|                 |      |                      |      |                        |
|  Frontend       |----->|  Django Backend      |----->|  Google Generative AI  |
| (Vanilla JS)    |      | (Python)             |      |                        |
|                 |<-----|                      |<-----|                        |
+-----------------+      +----------------------+      +------------------------+
                         |                      |
                         |  +----------------+  |
                         |  |                |  |
                         |  |  FAISS Vector  |  |
                         |  |  Store         |  |
                         |  |                |  |
                         |  +----------------+  |
                         |                      |
                         +----------------------+
```

1.  **Frontend:** The user interacts with the terminal interface in their browser. All commands and chat messages are sent to the Django backend via API requests.
2.  **Django Backend:** The backend processes the incoming requests, handling both standard commands and RAG chat messages.
3.  **RAG Chat:** When a user sends a chat message, the backend uses LangChain to:
    *   Retrieve relevant information from the FAISS vector store.
    *   Construct a prompt with the retrieved context and the user's question.
    *   Send the prompt to the Google Generative AI model.
    *   Stream the AI's response back to the frontend.
4.  **FAISS Vector Store:** The vector store contains embeddings of the portfolio's content, allowing for efficient similarity searches.

## ⚙️ Setup and Installation

To run the project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
2.  **Create a virtual environment:**
    ```bash
    python -m venv env
    source env/bin/activate  # On Windows, use `env\Scripts\activate`
    ```
3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up the environment variables:**
    *   Create a `.env` file in the root directory.
    *   Add your Google Generative AI API key to the `.env` file:
        ```
        API_KEY=your-api-key
        ```
5.  **Create the FAISS index:**
    ```bash
    python manage.py create_index
    ```
6.  **Run the development server:**
    ```bash
    python manage.py runserver
    ```
7.  Open your browser and navigate to `http://127.0.0.1:8000/`.

## 👨‍💻 Usage

The terminal has two modes: **command mode** and **chat mode**.

### Command Mode

In command mode, you can use the following commands:

*   `help`: Displays a list of available commands.
*   `chat`: Enters chat mode.
*   `theme <theme-name>`: Changes the terminal's color theme.
*   `clear` or `cls`: Clears the terminal screen.
*   and many more command

### Chat Mode

In chat mode, you can have a natural conversation with the AI assistant. Ask it anything about my portfolio, such as:

*   "What are your skills?"
*   "Tell me about your projects."
*   "What is your experience with Python?"
*   and whatever you want to ask

To exit chat mode, type `quit`.

## 📸 Screenshots

![image](https://github.com/user-attachments/assets/ca18c222-6356-4144-bb14-5e846e079149)
![image](https://github.com/user-attachments/assets/f37fca26-e679-4bf8-a20f-bbcb7ad681b8)


## 🚀 Future Improvements

*   **"Show Me" Command:** Allow the AI to display project images and demos directly in the terminal.
*   **File System Simulation:** Create a virtual file system that users can explore with commands like `ls`, `cd`, and `cat`.
*   **AI Voice Responses:** Use the Web Speech API to give the AI assistant a voice.
*   **Dockerization:** Containerize the application for easier deployment.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📬 Contact

*   **Email:** [shorons38@email.com](mailto:shorons38@email.com)
*   **LinkedIn:** [linkedin.com/in/shohanur-rahman](https://www.linkedin.com/in/shohanur-rahman-4a935232a/)
*   **GitHub:** [github.com/shohanur-shoron](https://github.com/shohanur-shoron)
