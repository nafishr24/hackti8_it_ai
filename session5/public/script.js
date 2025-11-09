const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

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
