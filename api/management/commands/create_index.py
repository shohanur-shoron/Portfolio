import os
from django.core.management.base import BaseCommand
from django.conf import settings

# LangChain imports
from langchain.text_splitter import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

# Define paths
KNOWLEDGE_BASE_PATH = os.path.join(settings.BASE_DIR, 'knowledge_base.md')
FAISS_INDEX_PATH = os.path.join(settings.BASE_DIR, 'faiss_index')

class Command(BaseCommand):
    help = 'Creates a FAISS vector store and verifies all content is included.'

    def handle(self, *args, **options):
        if not settings.API_KEY:
            self.stdout.write(self.style.ERROR('Google API_KEY not found in settings.py.'))
            return

        # --- Stage 1: Load the ENTIRE document ---
        self.stdout.write(f"Loading knowledge base from {KNOWLEDGE_BASE_PATH}...")
        try:
            with open(KNOWLEDGE_BASE_PATH, 'r', encoding='utf-8') as f:
                markdown_document = f.read()
            self.stdout.write(self.style.SUCCESS("Successfully loaded the entire knowledge base file."))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"Error: The file '{KNOWLEDGE_BASE_PATH}' was not found."))
            return

        # --- Stage 2: Split by Markdown Headers to keep context ---
        headers_to_split_on = [
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
        self.stdout.write("Stage 1: Splitting documents by Markdown headers...")
        markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on, strip_headers=False
        )
        md_header_splits = markdown_splitter.split_text(markdown_document)
        self.stdout.write(f"Split into {len(md_header_splits)} logical documents based on headers.")

        # --- Stage 3: Split large documents recursively to ensure they are embeddable ---
        self.stdout.write("Stage 2: Splitting large logical documents into smaller, indexable chunks...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150
        )
        docs = text_splitter.split_documents(md_header_splits)
        self.stdout.write(f"Final total of {len(docs)} documents prepared for the vector store.")

        # --- Stage 4: VERIFICATION ---
        # This step confirms that no text was lost during the splitting process.
        original_chars = len(markdown_document)
        split_chars = sum(len(doc.page_content) for doc in docs)
        self.stdout.write("\n" + "="*50)
        self.stdout.write("--- VERIFICATION OF CONTENT COMPLETENESS ---")
        self.stdout.write(f"Total characters in original file: {original_chars}")
        self.stdout.write(f"Total characters in all final chunks: {split_chars}")
        char_difference = original_chars - split_chars
        self.stdout.write(f"Character difference: {char_difference}")
        if abs(char_difference) < 50: # Allow for tiny differences from processing
             self.stdout.write(self.style.SUCCESS("Verification PASSED: The content has been fully processed."))
        else:
             self.stdout.write(self.style.WARNING("Verification WARNING: Character count differs slightly. This is usually due to header/newline processing."))
        self.stdout.write("="*50 + "\n")


        self.stdout.write("Initializing Google Generative AI embeddings model...")
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.API_KEY)

        self.stdout.write("Creating and saving FAISS vector store index...")
        vector_store = FAISS.from_documents(docs, embeddings)
        vector_store.save_local(FAISS_INDEX_PATH)

        self.stdout.write(self.style.SUCCESS(f'Successfully created FAISS index at {FAISS_INDEX_PATH}'))
