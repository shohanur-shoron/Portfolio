// static/js/api_service.js

/**
 * Fetches the list of available commands from the backend API.
 * @returns {Promise<string[]>} A promise that resolves to an array of command names.
 */
export async function fetchAvailableCommands() {
    try {
        const response = await fetch('/api/commands/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Could not fetch commands for autocomplete:", error);
        // Fallback commands if API fails
        return ['help', 'chat', 'clear', 'quit', 'theme', 'projects', 'skills', 'contact', 'summary'];
    }
}

/**
 * Handles sending a terminal command to the backend and streaming its response.
 * @param {string} command - The command to send.
 * @param {HTMLElement} responseContainer - The DOM element to append response chunks to.
 * @param {function} onComplete - Callback function when the stream is complete.
 */
export function handleBackendCommand(command, responseContainer, onComplete) {
    responseContainer.innerHTML = '...'; // Placeholder

    const apiUrl = `/api/terminal/?command=${encodeURIComponent(command)}`;
    const eventSource = new EventSource(apiUrl);

    let fullResponseContent = '';
    let responseType = 'text';

    eventSource.onmessage = function(event) {
        if (event.data === '[DONE]') {
            eventSource.close();
            if (onComplete) onComplete(fullResponseContent, responseType);
            return;
        }

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
        eventSource.close();
        if (onComplete) onComplete("", "error");
    };
}

/**
 * Handles sending a chat message to the backend and streaming its response.
 * @param {string} message - The chat message to send.
 * @param {HTMLElement} responseContainer - The DOM element to append response chunks to.
 * @param {function} onComplete - Callback function when the stream is complete.
 * @param {function} onChunk - Callback function for each incoming chunk of text.
 */
export function handleChat(message, responseContainer, onComplete, onChunk) {
    responseContainer.innerHTML = '<i>AI is thinking...</i>'; // Placeholder

    const chatApiUrl = `/api/chat/?message=${encodeURIComponent(message)}`;
    const eventSource = new EventSource(chatApiUrl);

    let fullResponse = '';

    eventSource.onmessage = function(event) {
        if (event.data === '[DONE]') {
            eventSource.close();
            if (onComplete) onComplete(fullResponse);
            return;
        }

        try {
            const data = JSON.parse(event.data);
            if (data.type === 'chunk' && data.content) {
                fullResponse += data.content;
                if (onChunk) onChunk(data.content);
            } else if (data.type === 'error' && data.content) {
                fullResponse += data.content;
                eventSource.close();
            }
        } catch (e) {
            console.error("Failed to parse chat response chunk:", e);
            fullResponse += "Error: Malformed response from server.";
            eventSource.close();
        }
    };

    eventSource.onerror = function(err) {
        console.error("Chat EventSource failed:", err);
        responseContainer.innerHTML = `<span class="redtext">Error: Lost connection to the chat server.</span>`;
        eventSource.close();
        if (onComplete) onComplete("");
    };
}
