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
let commandHistory = [];
let historyIndex = -1;
let availableCommands = [];
let currentSuggestion = '';

// --- DOM Element Selection ---
const suggestionText = document.getElementById("suggestion-text");


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

// --- FETCH AVAILABLE COMMANDS FOR AUTOCOMPLETE ---
async function fetchCommands() {
    try {
        const response = await fetch('/api/commands/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        availableCommands = await response.json();
        console.log("Available commands loaded:", availableCommands);
    } catch (error) {
        console.error("Could not fetch commands for autocomplete:", error);
        // Fallback commands
        availableCommands = ['help', 'chat', 'clear', 'quit', 'projects', 'skills', 'contact', 'summary'];
    }
}

function updateSuggestion() {
    const inputText = commandInput.value;
    if (isChatMode || inputText === '') {
        currentSuggestion = '';
    } else {
        const matchingCommands = availableCommands.filter(cmd => cmd.startsWith(inputText.toLowerCase()));
        if (matchingCommands.length === 1 && matchingCommands[0] !== inputText) {
            currentSuggestion = matchingCommands[0];
        } else {
            currentSuggestion = '';
        }
    }
    suggestionText.textContent = currentSuggestion;
}

// --- MAIN COMMAND INPUT HANDLER ---
commandInput.addEventListener('input', updateSuggestion);

commandInput.addEventListener('keydown', function(event) {
    // --- AUTOCOMPLETION LOGIC ---
    if ((event.key === 'Tab' || event.key === 'ArrowRight') && currentSuggestion) {
        event.preventDefault();
        commandInput.value = currentSuggestion;
        updateSuggestion();
        return; // Stop further processing
    }

    // --- COMMAND HISTORY LOGIC ---
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            commandInput.value = commandHistory[historyIndex];
            updateSuggestion();
        }
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            commandInput.value = commandHistory[historyIndex];
        } else {
            historyIndex = -1;
            commandInput.value = '';
        }
        updateSuggestion();
    }

    // --- SUBMIT COMMAND ---
    if (event.key === 'Enter') {
        event.preventDefault();
        const commandText = commandInput.value.trim();
        if (commandText === '') return;

        // Add to history
        if (commandText !== commandHistory[0]) {
            commandHistory.unshift(commandText);
        }
        historyIndex = -1;
        currentSuggestion = '';
        suggestionText.textContent = '';

        // Echo command and process
        const oldCommand = document.createElement('div');
        oldCommand.classList.add('oldcommands');
        oldCommand.innerHTML = `<span class="dir">${dirText.innerHTML}</span> ${commandText}`;
        contentBox.appendChild(oldCommand);

        commandInput.value = '';
        scrollToBottom();

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
            }
            handleBackendCommand(commandText);
        }
    }
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    fetchCommands();
    commandInput.focus();
});


// =======================================================================
// --- API HANDLERS ---
// =======================================================================

function handleBackendCommand(command) {
    commandInput.disabled = true;

    const responseContainer = document.createElement('div');
    responseContainer.classList.add('contenttext');
    contentBox.appendChild(responseContainer);

    // Add a temporary placeholder while waiting for the server
    responseContainer.innerHTML = '...';
    scrollToBottom();

    const apiUrl = `/api/terminal/?command=${encodeURIComponent(command)}`;
    const eventSource = new EventSource(apiUrl);

    let fullResponseContent = '';
    let responseType = 'text';

    eventSource.onmessage = function(event) {
        if (event.data === '[DONE]') {
            eventSource.close();

            const onComplete = () => {
                commandInput.disabled = false;
                commandInput.focus();
            };

            // Now that we have the full response, decide how to type it out
            if (responseType === 'html') {
                // For HTML, type out the plain text version, then swap in the real HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = fullResponseContent;
                const textToType = tempDiv.textContent || tempDiv.innerText || '';

                const onHtmlTypingComplete = () => {
                    responseContainer.innerHTML = fullResponseContent; // Set final HTML
                    scrollToBottom();
                    onComplete(); // Re-enable input
                };

                // Use a slightly slower speed for readability
                typewriterEffect(responseContainer, textToType, 5, onHtmlTypingComplete);

            } else {
                // For plain text, just type it out directly
                typewriterEffect(responseContainer, fullResponseContent, 5, onComplete);
            }
            return;
        }

        // Backend commands send their payload in one go. We just need to store it.
        try {
            const data = JSON.parse(event.data);
            fullResponseContent = data.content;
            responseType = data.type;
        } catch (e) {
            console.error("Failed to parse backend command response:", e);
            fullResponseContent = "Error: Malformed response from server.";
            responseType = 'text';
        }
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


// =======================================================================
// --- TYPEWRITER EFFECT (WORD-BY-WORD) ---
// =======================================================================

/**
 * Simulates a typewriter effect by displaying text word-by-word.
 * @param {HTMLElement} element - The DOM element to type into.
 * @param {string} text - The full text to be typed out.
 * @param {number} speed - The delay in milliseconds between each WORD.
 * @param {function} onComplete - A callback function to run when typing is finished.
 * @param {object} [options={}] - Optional settings.
 * @param {boolean} [options.useMarkdown=false] - If true, parses text with marked.js.
 */
function typewriterEffect(element, text, speed, onComplete, options = {}) {
    const { useMarkdown = false } = options;
    const words = text.split(' ');
    let i = 0;
    element.innerHTML = ""; // Clear the element to remove any placeholder.

    function type() {
        if (i < words.length) {
            const currentText = words.slice(0, i + 1).join(' ');

            try {
                if (useMarkdown) {
                     element.innerHTML = typeof marked !== 'undefined'
                        ? marked.parse(currentText)
                        : currentText.replace(/\n/g, '<br>');
                } else {
                    // For plain text or stripped HTML, just render line breaks
                    element.innerHTML = currentText.replace(/\n/g, '<br>');
                }
            } catch (e) {
                console.error("Typing effect failed:", e);
                element.innerText = currentText; // Fallback to plain text
            }

            i++;
            scrollToBottom(); // Keep the content in view as it types
            setTimeout(type, speed);
        } else {
            if (onComplete) {
                onComplete();
            }
        }
    }
    type();
}


// =======================================================================
// --- CHAT HANDLER ---
// =======================================================================
function handleChat(message) {
    commandInput.disabled = true;

    const responseContainer = document.createElement('div');
    responseContainer.classList.add('contenttext', 'ai-response');
    contentBox.appendChild(responseContainer);

    responseContainer.innerHTML = '<i>AI is thinking...</i>';
    scrollToBottom();

    const chatApiUrl = `/api/chat/?message=${encodeURIComponent(message)}`;
    const eventSource = new EventSource(chatApiUrl);

    let fullResponse = '';

    eventSource.onmessage = function(event) {
        if (event.data === '[DONE]') {
            eventSource.close();

            const onTypingComplete = () => {
                commandInput.disabled = false;
                commandInput.focus();
            };

            // MODIFIED: Call the typewriter with the useMarkdown option
            typewriterEffect(responseContainer, fullResponse, 7, onTypingComplete, { useMarkdown: true });

            return;
        }

        const data = JSON.parse(event.data);
        if (data.type === 'chunk' && data.content) {
            fullResponse += data.content;
        } else if (data.type === 'error' && data.content) {
            fullResponse += data.content;
            eventSource.close();
        }
    };

    eventSource.onerror = function(err) {
        console.error("Chat EventSource failed:", err);
        responseContainer.innerHTML = `<span class="redtext">Error: Lost connection to the chat server.</span>`;
        scrollToBottom();
        eventSource.close();
        commandInput.disabled = false;
        commandInput.focus();
    };
}
