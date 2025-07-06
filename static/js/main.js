// static/js/main.js

import { applyTheme, loadSavedTheme, getThemeListHtml, getAvailableThemes } from './theme_manager.js';
import { fetchAvailableCommands, handleBackendCommand, handleChat } from './api_service.js';

// --- DOM Element Selection (runs on all devices) ---
const terminal = document.getElementById("terminal");
const header = terminal.querySelector(".terminal-header");
const resizer = document.getElementById("resizer");
const terminalBody = document.getElementById("terminal-body");
const commandInput = document.getElementById("commands");
const contentBox = document.querySelector('.contentbox');
const dirText = document.getElementById('dirtext');
const suggestionText = document.getElementById("suggestion-text");

// --- STATE MANAGEMENT (runs on all devices) ---
let isChatMode = false;
let commandHistory = [];
let historyIndex = -1;
let availableCommands = [];
let currentSuggestion = '';

// =======================================================================
// --- MODIFIED: Draggable and Resizable Logic ONLY for DESKTOP ---
// =======================================================================
if (window.matchMedia("(min-width: 769px)").matches) {
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - terminal.offsetLeft;
        offsetY = e.clientY - terminal.offsetTop;
        terminal.classList.add("dragging");
        e.preventDefault();
    });

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
}

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

function updateSuggestion() {
    const inputText = commandInput.value;
    if (isChatMode || inputText === '') {
        currentSuggestion = '';
    } else {
        const lowerInput = inputText.toLowerCase();
        const availableThemes = getAvailableThemes(); // Get themes from theme_manager

        if (lowerInput.startsWith('theme ')) {
            const themePartial = lowerInput.substring(6); // Get text after "theme "
            const matchingThemes = availableThemes.filter(theme => theme.startsWith(themePartial));

            if (matchingThemes.length === 1) {
                currentSuggestion = `theme ${matchingThemes[0]}`;
            } else {
                currentSuggestion = '';
            }
        } else {
            const matchingCommands = availableCommands.filter(cmd => cmd.startsWith(lowerInput));
            if (matchingCommands.length === 1 && matchingCommands[0] !== lowerInput) {
                currentSuggestion = matchingCommands[0];
            } else {
                currentSuggestion = '';
            }
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
        return;
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

        // --- THEME COMMAND LOGIC ---
        if (commandText.toLowerCase().startsWith('theme')) {
            const parts = commandText.split(' ');
            const themeAction = parts[1]; // Could be a theme name or '--list'

            if (themeAction && getAvailableThemes().includes(themeAction)) {
                applyTheme(themeAction); // Use applyTheme from theme_manager
                const successMsg = document.createElement('div');
                successMsg.classList.add('contenttext');
                successMsg.innerHTML = `Theme changed to ${themeAction}.`;
                contentBox.appendChild(successMsg);
            } else {
                const infoMsg = document.createElement('div');
                infoMsg.classList.add('contenttext');
                infoMsg.innerHTML = `Usage: <span class="redtext">theme &lt;themename&gt;</span><br>${getThemeListHtml()}`;
                contentBox.appendChild(infoMsg);
            }
            scrollToBottom();
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
                // Call handleChat from api_service
                handleChat(commandText, document.createElement('div'), (fullResponse) => {
                    const responseContainer = document.createElement('div');
                    responseContainer.classList.add('contenttext', 'ai-response');
                    contentBox.appendChild(responseContainer);
                    typewriterEffect(responseContainer, fullResponse, 7, () => {
                        commandInput.disabled = false;
                        commandInput.focus();
                    }, { useMarkdown: true });
                    scrollToBottom();
                }, (chunk) => {
                    // This chunk handling is now done inside typewriterEffect for streaming
                });
            }
        } else {
            if (commandText.toLowerCase() === 'chat') {
                isChatMode = true;
                updatePrompt();
            }
            // Call handleBackendCommand from api_service
            handleBackendCommand(commandText, document.createElement('div'), (fullResponseContent, responseType) => {
                const responseContainer = document.createElement('div');
                responseContainer.classList.add('contenttext');
                contentBox.appendChild(responseContainer);

                if (responseType === 'html') {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = fullResponseContent;
                    const textToType = tempDiv.textContent || tempDiv.innerText || '';
                    typewriterEffect(responseContainer, textToType, 5, () => {
                        responseContainer.innerHTML = fullResponseContent;
                        scrollToBottom();
                        commandInput.disabled = false;
                        commandInput.focus();
                    });
                } else {
                    typewriterEffect(responseContainer, fullResponseContent, 5, () => {
                        commandInput.disabled = false;
                        commandInput.focus();
                    });
                }
                scrollToBottom();
            });
        }
    }
});

// --- TYPEWRITER EFFECT (WORD-BY-WORD) ---
function typewriterEffect(element, text, speed, onComplete, options = {}) {
    const { useMarkdown = false } = options;
    const words = text.split(' ');
    let i = 0;
    element.innerHTML = "";

    function type() {
        if (i < words.length) {
            const currentText = words.slice(0, i + 1).join(' ');

            try {
                if (useMarkdown) {
                     element.innerHTML = typeof marked !== 'undefined'
                        ? marked.parse(currentText)
                        : currentText.replace(/\n/g, '<br>');
                } else {
                    element.innerHTML = currentText.replace(/\n/g, '<br>');
                }
            } catch (e) {
                console.error("Typing effect failed:", e);
                element.innerText = currentText;
            }

            i++;
            scrollToBottom();
            setTimeout(type, speed);
        } else {
            if (onComplete) {
                onComplete();
            }
        }
    }
    type();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    loadSavedTheme(); // Load theme from theme_manager
    availableCommands = await fetchAvailableCommands(); // Fetch commands from api_service
    commandInput.focus();
});