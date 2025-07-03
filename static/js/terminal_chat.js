// --- START OF FILE terminal_chat.js (Correctly Edited) ---

// --- DOM Element Selection (runs on all devices) ---
const terminal = document.getElementById("terminal");
const header = terminal.querySelector(".terminal-header");
const resizer = document.getElementById("resizer");
const terminalBody = document.getElementById("terminal-body");
const commandInput = document.getElementById("commands");
const contentBox = document.querySelector('.contentbox');
const dirText = document.getElementById('dirtext');

// --- STATE MANAGEMENT (runs on all devices) ---
let isChatMode = false;


// =======================================================================
// --- MODIFIED: Draggable and Resizable Logic ONLY for DESKTOP ---
// =======================================================================
// This entire block only runs on screens wider than 768px.
// On mobile, these event listeners will not be attached, disabling the feature.
if (window.matchMedia("(min-width: 769px)").matches) {

    // --- DRAGGING LOGIC ---
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - terminal.offsetLeft;
        offsetY = e.clientY - terminal.offsetTop;
        terminal.classList.add("dragging");
        e.preventDefault();
    });

    // --- RESIZING LOGIC ---
    let isResizing = false;
    let originalWidth, originalHeight, originalMouseX, originalMouseY;

    resizer.addEventListener("mousedown", (e) => {
        isResizing = true;
        originalWidth = terminal.offsetWidth;
        originalHeight = terminal.offsetHeight;
        originalMouseX = e.clientX;
        originalMouseY = e.clientY;
        e.preventDefault();
    });

    // --- MOUSE MOVE/UP LISTENERS (for both drag & resize) ---
    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            terminal.style.left = `${newLeft}px`;
            terminal.style.top = `${newTop}px`;
        }
        if (isResizing) {
            const width = originalWidth + (e.clientX - originalMouseX);
            const height = originalHeight + (e.clientY - originalMouseY);
            terminal.style.width = `${width}px`;
            terminal.style.height = `${height}px`;
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        isResizing = false;
        terminal.classList.remove("dragging");
    });

} // --- End of desktop-only logic ---


// =======================================================================
// --- CORE LOGIC (runs on ALL devices: Desktop and Mobile) ---
// =======================================================================

// --- FOCUS LOGIC ---
terminalBody.addEventListener("click", () => {
    commandInput.focus();
});
commandInput.focus();


// --- HELPER FUNCTIONS ---
function scrollToBottom() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function updatePrompt() {
    if (isChatMode) {
        dirText.innerHTML = '(<span style="color: white;">chat</span>)shoron@portfolio: ~';
    } else {
        dirText.innerHTML = 'shoron@portfolio: ~';
    }
}

// --- MAIN COMMAND INPUT HANDLER ---
commandInput.addEventListener('keydown', function(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const commandText = commandInput.value.trim();
    if (commandText === '') return;

    // Echo the user's command to the terminal with the correct prompt
    const oldCommand = document.createElement('div');
    oldCommand.classList.add('oldcommands');
    oldCommand.innerHTML = `<span class="dir">${dirText.innerHTML}</span> ${commandText}`;
    contentBox.appendChild(oldCommand);

    commandInput.value = '';
    scrollToBottom();

    // --- MODE SWITCHING AND COMMAND ROUTING ---
    if (commandText.toLowerCase() === 'cls' || commandText.toLowerCase() === 'clear') {
        contentBox.innerHTML = '';
        return;
    }

    if (isChatMode) {
        if (commandText.toLowerCase() === 'quit') {
            isChatMode = false;
            updatePrompt();
            const exitMessage = document.createElement('div');
            exitMessage.classList.add('contenttext');
            exitMessage.innerHTML = "Exited chat mode.";
            contentBox.appendChild(exitMessage);
            scrollToBottom();
        } else {
            handleChat(commandText);
        }
    } else {
        if (commandText.toLowerCase() === 'chat') {
            isChatMode = true;
            updatePrompt();
            handleBackendCommand(commandText);
        } else {
            handleBackendCommand(commandText);
        }
    }
});


// =======================================================================
// --- API HANDLERS (Unchanged - works on all devices) ---
// =======================================================================

function handleBackendCommand(command) {
    commandInput.disabled = true;

    const responseContainer = document.createElement('div');
    responseContainer.classList.add('contenttext');
    contentBox.appendChild(responseContainer);
    scrollToBottom();

    const apiUrl = `/api/terminal/?command=${encodeURIComponent(command)}`;
    const eventSource = new EventSource(apiUrl);

    eventSource.onmessage = function(event) {
        if (event.data === '[DONE]') {
            eventSource.close();
            commandInput.disabled = false;
            commandInput.focus();
            return;
        }

        const data = JSON.parse(event.data);

        if (data.type === 'html') {
            responseContainer.innerHTML = data.content;
        } else {
            responseContainer.innerText = data.content;
        }
        scrollToBottom();
    };

    eventSource.onerror = function(err) {
        console.error("Terminal EventSource failed:", err);
        responseContainer.innerHTML = `<span class="redtext">Error: Could not connect to the server.</span>`;
        scrollToBottom();
        eventSource.close();
        commandInput.disabled = false;
        commandInput.focus();
    };
}


function handleChat(message) {
    commandInput.disabled = true;

    const responseContainer = document.createElement('div');
    responseContainer.classList.add('contenttext', 'ai-response');
    contentBox.appendChild(responseContainer);

    // --- CHANGE #1: INSTANTLY SHOW "THINKING" MESSAGE ---
    // Add this line to immediately display feedback to the user.
    responseContainer.innerHTML = '<i>AI is thinking...</i>';

    scrollToBottom(); // Scroll down to show the new "thinking" message

    const chatApiUrl = `/api/chat/?message=${encodeURIComponent(message)}`;
    const eventSource = new EventSource(chatApiUrl);

    let fullResponse = '';
    let isFirstChunk = true; // Helper to know when to replace the "thinking" message

    eventSource.onmessage = function(event) {
        if (event.data === '[DONE]') {
            // The final markdown parsing is now handled on each chunk, so we just need to clean up.
            scrollToBottom();
            eventSource.close();
            commandInput.disabled = false;
            commandInput.focus();
            return;
        }


        const data = JSON.parse(event.data);

        // --- CHANGE #2: SIMPLIFY THE SWITCH STATEMENT ---
        switch (data.type) {
            // The 'loading' case is no longer needed from the backend.
            case 'chunk':
                if (data.content) {
                    if (isFirstChunk) {
                        fullResponse = ''; // Clear any previous content (like the thinking message)
                        isFirstChunk = false;
                    }
                    fullResponse += data.content;
                    // For a better live experience, parse markdown on every chunk.
                    responseContainer.innerHTML = typeof marked !== 'undefined'
                        ? marked.parse(fullResponse)
                        : fullResponse.replace(/\n/g, '<br>');

                    scrollToBottom();
                }
                break;

            case 'error':
                if (data.content) {
                    responseContainer.innerHTML = fullResponse + data.content; // Show error
                    eventSource.close();
                    commandInput.disabled = false;
                    commandInput.focus();
                }
                break;
        }
    };

    eventSource.onerror = function(err) {
        console.error("Chat EventSource failed:", err);
        // If the server fails to connect, replace the "thinking" message with an error.
        responseContainer.innerHTML = `<span class="redtext">Error: Lost connection to the chat server.</span>`;
        scrollToBottom();
        eventSource.close();
        commandInput.disabled = false;
        commandInput.focus();
    };
}