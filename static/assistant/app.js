
const chatForm = document.getElementById("chatForm");
const promptInput = document.getElementById("promptInput");
const chatMessages = document.getElementById("chatMessages");
const clearButton = document.getElementById("clearButton");
const sendButton = document.getElementById("sendButton");
const characterCount = document.getElementById("characterCount");
const connectionStatus = document.getElementById("connectionStatus");
const verityDisplay = document.getElementById("verityDisplay");

const initialMessage = chatMessages.innerHTML;
let requestInProgress = false;

function updateConnectionStatus() {
    if (!connectionStatus) return;

    if (!navigator.onLine) {
        connectionStatus.textContent = "Offline · Check your internet";
    } else if (requestInProgress) {
        connectionStatus.textContent = "Thinking · Verity is listening";
    } else {
        connectionStatus.textContent = "Online · Verity is here";
    }
}

function updateCharacterCount() {
    if (characterCount) {
        characterCount.textContent = `${promptInput.value.length} / 4000`;
    }
}

function scrollToLatest() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(text, sender) {
    const article = document.createElement("article");
    article.className = `message ${sender}-message`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = sender === "user" ? "Y" : ":)";

    const content = document.createElement("div");
    content.className = "message-content";

    const label = document.createElement("div");
    label.className = "message-label";

    const name = document.createElement("span");
    name.textContent = sender === "user" ? "YOU" : "VERITY";

    const time = document.createElement("span");
    time.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    label.append(name, time);

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    bubble.appendChild(paragraph);

    content.append(label, bubble);
    article.append(avatar, content);
    chatMessages.appendChild(article);

    scrollToLatest();

    return { article, bubble, paragraph };
}

function addTypingIndicator() {
    const message = addMessage("", "assistant");
    message.article.classList.add("typing-message");

    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    indicator.setAttribute("role", "status");
    indicator.setAttribute("aria-label", "Verity is typing");

    for (let i = 0; i < 3; i++) {
        indicator.appendChild(document.createElement("span"));
    }

    message.paragraph.replaceWith(indicator);
    scrollToLatest();

    return message.article;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeResponse(element, text) {
    if (verityDisplay) verityDisplay.classList.add("talking");

    element.textContent = "";

    try {
        for (let i = 0; i < text.length; i += 3) {
            element.textContent += text.slice(i, i + 3);
            scrollToLatest();
            await wait(18);
        }
    } finally {
        if (verityDisplay) verityDisplay.classList.remove("talking");
    }
}

async function sendMessage() {
    const message = promptInput.value.trim();

    if (!message || requestInProgress) return;

    if (!navigator.onLine) {
        addMessage("You're offline. Reconnect and try again. ♡", "assistant");
        return;
    }

    const csrfInput = chatForm.querySelector('[name="csrfmiddlewaretoken"]');

    if (!csrfInput) {
        addMessage("Please refresh the page and try again.", "assistant");
        return;
    }

    requestInProgress = true;
    updateConnectionStatus();

    addMessage(message, "user");
    promptInput.value = "";
    updateCharacterCount();

    sendButton.disabled = true;
    sendButton.textContent = "Thinking...";

    const typingMessage = addTypingIndicator();

    try {
        const response = await fetch("/api/chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfInput.value
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Request failed (${response.status}).`);
        }

        if (!data.response || typeof data.response !== "string") {
            throw new Error("Verity returned an empty response. Please try again.");
        }

        typingMessage.remove();

        const reply = addMessage("", "assistant");
        await typeResponse(reply.paragraph, data.response.trim());
    } catch (error) {
        const indicator = typingMessage.querySelector(".typing-indicator");

        if (indicator) {
            indicator.remove();
            const paragraph = document.createElement("p");
            paragraph.textContent = error.message || "Something went wrong. Please try again.";
            typingMessage.querySelector(".bubble").appendChild(paragraph);
        }
    } finally {
        requestInProgress = false;
        sendButton.disabled = false;
        sendButton.innerHTML = "➤ Send";
        updateConnectionStatus();
        scrollToLatest();
        promptInput.focus();
    }
}

chatForm.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage();
});

promptInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        if (!requestInProgress) sendMessage();
    }
});

promptInput.addEventListener("input", updateCharacterCount);

document.querySelectorAll(".suggestion").forEach(button => {
    button.addEventListener("click", () => {
        if (requestInProgress) return;
        promptInput.value = button.dataset.prompt || button.textContent.trim();
        updateCharacterCount();
        promptInput.focus();
    });
});

clearButton.addEventListener("click", () => {
    if (requestInProgress) return;
    chatMessages.innerHTML = initialMessage;
    promptInput.value = "";
    updateCharacterCount();
    scrollToLatest();
    promptInput.focus();
});

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

updateCharacterCount();
updateConnectionStatus();
