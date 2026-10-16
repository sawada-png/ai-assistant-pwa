
const chatForm = document.getElementById("chatForm");
const promptInput = document.getElementById("promptInput");
const chatMessages = document.getElementById("chatMessages");
const clearButton = document.getElementById("clearButton");
const sendButton = document.getElementById("sendButton");
const characterCount = document.getElementById("characterCount");
const connectionStatus = document.getElementById("connectionStatus");
const infoButton = document.getElementById("infoButton");
const infoDialog = document.getElementById("infoDialog");
const closeInfo = document.getElementById("closeInfo");

const initialMessage = chatMessages.innerHTML;

function updateConnectionStatus() {
    connectionStatus.textContent = navigator.onLine
        ? "Online · AI connection not configured"
        : "Offline · Check your internet";
}

function addMessage(text, sender) {
    const article = document.createElement("article");
    article.className = `message ${sender}-message`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = sender === "user" ? "Y" : "✦";

    const content = document.createElement("div");
    content.className = "message-content";

    const label = document.createElement("div");
    label.className = "message-label";

    const name = document.createElement("span");
    name.textContent = sender === "user" ? "YOU (STUDENT)" : "CLASS ASSISTANT";

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
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

promptInput.addEventListener("input", () => {
    characterCount.textContent = `${promptInput.value.length} / 4000`;
});

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const prompt = promptInput.value.trim();

    if (!prompt) {
        return;
    }

    if (!navigator.onLine) {
        addMessage(
            "You're currently offline. Reconnect to the internet before sending a question.",
            "assistant"
        );
        return;
    }

    addMessage(prompt, "user");

    addMessage(
        "Your chat interface is working! The Gemini API connection is the next step, so I cannot generate AI answers yet.",
        "assistant"
    );

    promptInput.value = "";
    characterCount.textContent = "0 / 4000";
    promptInput.focus();
});

document.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => {
        promptInput.value = button.dataset.prompt;
        characterCount.textContent = `${promptInput.value.length} / 4000`;
        promptInput.focus();
    });
});

clearButton.addEventListener("click", () => {
    chatMessages.innerHTML = initialMessage;
    promptInput.value = "";
    characterCount.textContent = "0 / 4000";
    promptInput.focus();
});

infoButton.addEventListener("click", () => {
    infoDialog.showModal();
});

closeInfo.addEventListener("click", () => {
    infoDialog.close();
});

infoDialog.addEventListener("click", (event) => {
    if (event.target === infoDialog) {
        infoDialog.close();
    }
});

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

updateConnectionStatus();
