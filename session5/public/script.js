const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const newChatBtn = document.getElementById("new-chat-btn");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// Variabel untuk session management
let currentSessionId = generateSessionId();
let conversationHistory = [];

// Generate session ID unik
function generateSessionId() {
  return (
    "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  );
}

// Event listener untuk tombol New Chat
newChatBtn.addEventListener("click", async function () {
  // Clear chat box
  chatBox.innerHTML = "";

  // Generate session baru
  currentSessionId = generateSessionId();
  conversationHistory = [];

  // Clear history di server
  try {
    await fetch("/api/chat/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
      }),
    });
    console.log("New chat session started:", currentSessionId);
  } catch (error) {
    console.error("Error starting new chat:", error);
  }

  // Focus ke input
  input.focus();
});

// Event listener untuk tombol Clear History
clearHistoryBtn.addEventListener("click", async function () {
  // Clear chat box
  chatBox.innerHTML = "";
  conversationHistory = [];

  // Clear history di server untuk session ini
  try {
    await fetch("/api/chat/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
      }),
    });
    console.log("History cleared for session:", currentSessionId);
  } catch (error) {
    console.error("Error clearing history:", error);
  }

  // Focus ke input
  input.focus();
});

// Modifikasi form submit untuk include sessionId
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message to chat
  appendMessage("user", userMessage);
  input.value = "";

  // Disable form while processing
  setFormDisabled(true);

  // Add temporary thinking message
  const thinkingElement = appendMessage("bot", "Thinking...", true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conv: [{ role: "user", text: userMessage }],
        sessionId: currentSessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.result) {
      // Replace thinking message with actual response
      replaceMessage(thinkingElement, data.result);
    } else {
      throw new Error("No result in response");
    }
  } catch (error) {
    console.error("Error:", error);

    // Replace thinking message with error
    let errorMessage = "Sorry, no response received.";
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network")
    ) {
      errorMessage =
        "Failed to get response from server. Please check your connection.";
    }
    replaceMessage(thinkingElement, errorMessage);
  } finally {
    // Re-enable form
    setFormDisabled(false);
    input.focus();
  }
});

// Fungsi-fungsi helper yang sudah ada
function appendMessage(sender, text, returnElement = false) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  return returnElement ? msg : null;
}

function replaceMessage(element, newText) {
  element.textContent = newText;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function setFormDisabled(disabled) {
  input.disabled = disabled;
  form.querySelector("button").disabled = disabled;

  if (disabled) {
    form.querySelector("button").textContent = "Sending...";
  } else {
    form.querySelector("button").textContent = "Send";
  }
}
