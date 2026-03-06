/**
 * script.js — Zevoir TaskBot Frontend Logic
 * ==========================================
 * Handles:
 *   • Sending user messages to Flask /chat endpoint
 *   • Rendering user + bot chat bubbles
 *   • "Bot is typing…" indicator
 *   • Timestamps on every message
 *   • Enter key support
 *   • Character counter with colour warnings
 *   • Dark / Light mode toggle
 *   • Clear chat button
 *   • Welcome message on first load
 */

"use strict";

/* ── DOM References ──────────────────────────────────────────────────────── */
const chatMessages = document.getElementById("chatMessages");
const userInput    = document.getElementById("userInput");
const sendBtn      = document.getElementById("sendBtn");
const clearBtn     = document.getElementById("clearBtn");
const typingWrap   = document.getElementById("typingWrap");
const charCountEl  = document.getElementById("charCount");
const charBar      = document.querySelector(".char-bar");
const themeToggle  = document.getElementById("themeToggle");
const htmlEl       = document.documentElement;   // <html> element


/* ════════════════════════════════════════════════════════════════════════════
   THEME (dark / light) TOGGLE
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Read saved theme from localStorage, default to "dark".
 * Apply it immediately so there's no flash on reload.
 */
function initTheme() {
  const saved = localStorage.getItem("zevt-theme") || "dark";
  htmlEl.setAttribute("data-theme", saved);
}

/** Switch between dark and light and save the preference. */
themeToggle.addEventListener("click", () => {
  const current = htmlEl.getAttribute("data-theme");
  const next    = current === "dark" ? "light" : "dark";
  htmlEl.setAttribute("data-theme", next);
  localStorage.setItem("zevt-theme", next);
});


/* ════════════════════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════════════════════ */

/** Returns current time as "HH:MM" */
function now() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Smooth-scroll the messages area to the very bottom. */
function scrollBottom() {
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 60);
}

/** Enable or disable the input + send button together. */
function setInputEnabled(enabled) {
  userInput.disabled = !enabled;
  sendBtn.disabled   = !enabled;
  if (enabled) userInput.focus();
}


/* ════════════════════════════════════════════════════════════════════════════
   RENDER A MESSAGE BUBBLE
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Creates and appends a chat bubble to the messages area.
 * Includes a small avatar icon beside every bubble.
 * @param {string}        text   - The message content
 * @param {"user"|"bot"}  sender - Which side the bubble sits on
 */
function appendMessage(text, sender) {
  // Outer row (controls alignment: left for bot, right for user)
  const row = document.createElement("div");
  row.classList.add("message-row", sender);

  // ── Avatar icon ──────────────────────────────────────────────────────
  const avatar = document.createElement("div");
  avatar.classList.add("msg-avatar");
  if (sender === "bot") {
    // Robot emoji for bot
    avatar.textContent = "🤖";
    avatar.setAttribute("title", "Zevoir TaskBot");
  } else {
    // Person emoji for user
    avatar.textContent = "👤";
    avatar.setAttribute("title", "You");
  }

  // ── Bubble + timestamp wrapper ───────────────────────────────────────
  const bubbleWrap = document.createElement("div");
  bubbleWrap.classList.add("bubble-wrap");

  // Bubble
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  // textContent + CSS white-space:pre-wrap → preserves \n line breaks safely
  bubble.textContent = text;

  // Timestamp
  const time = document.createElement("span");
  time.classList.add("msg-time");
  time.textContent = now();

  bubbleWrap.appendChild(bubble);
  bubbleWrap.appendChild(time);

  // For user: avatar goes AFTER the bubble (right side)
  // For bot:  avatar goes BEFORE the bubble (left side)
  if (sender === "bot") {
    row.appendChild(avatar);
    row.appendChild(bubbleWrap);
  } else {
    row.appendChild(bubbleWrap);
    row.appendChild(avatar);
  }

  chatMessages.appendChild(row);
  scrollBottom();
}


/* ════════════════════════════════════════════════════════════════════════════
   TYPING INDICATOR
   ════════════════════════════════════════════════════════════════════════════ */

function showTyping() {
  typingWrap.classList.add("visible");
  typingWrap.setAttribute("aria-hidden", "false");
  scrollBottom();
}

function hideTyping() {
  typingWrap.classList.remove("visible");
  typingWrap.setAttribute("aria-hidden", "true");
}


/* ════════════════════════════════════════════════════════════════════════════
   SEND MESSAGE  →  FETCH  →  DISPLAY REPLY
   ════════════════════════════════════════════════════════════════════════════ */

async function sendMessage() {
  const text = userInput.value.trim();

  // Nothing typed → do nothing
  if (!text) return;

  // Show user bubble immediately
  appendMessage(text, "user");

  // Clear the input + reset char counter
  userInput.value         = "";
  charCountEl.textContent = "0";
  charBar.classList.remove("warn", "limit");

  // ── ALWAYS disable input and show "Bot is typing…" for EVERY message ──
  // This includes invalid inputs, general questions, out-of-range numbers.
  // The backend handles all validation and returns the right reply.
  setInputEnabled(false);
  showTyping();

  try {
    const response = await fetch("/chat", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ message: text }),
    });

    const data = await response.json();

    /* keep typing indicator visible */
    await new Promise(resolve => setTimeout(resolve, 800));

    hideTyping();

    appendMessage(data.reply, "bot");

  } catch (_err) {
    // Network error (offline, CORS, etc.)
    await new Promise(resolve => setTimeout(resolve, 800));

    hideTyping();

    appendMessage(
      "Sorry, I couldn't reach the task service right now. Please try again later.",
      "bot"
    );
  } finally {
    // Always re-enable input, no matter what happened
    setInputEnabled(true);
  }
}


/* ════════════════════════════════════════════════════════════════════════════
   CLEAR CHAT
   ════════════════════════════════════════════════════════════════════════════ */

async function clearChat() {
  // Tell Flask to clear server-side session history
  await fetch("/clear", { method: "POST" });

  // Wipe all bubbles from the DOM
  chatMessages.innerHTML = "";

  // Show the welcome message again
  showWelcome();
}


/* ════════════════════════════════════════════════════════════════════════════
   WELCOME MESSAGE (shown on load and after clear)
   ════════════════════════════════════════════════════════════════════════════ */

function showWelcome() {
  // "Today" divider
  const divider = document.createElement("div");
  divider.classList.add("date-divider");
  divider.textContent = "Today";
  chatMessages.appendChild(divider);

  // Bot welcome bubble (no API call needed)
  appendMessage(
    "Hello! I am Zevoir TaskBot. Ask me about user IDs between 1 and 10.",
    "bot"
  );
}


/* ════════════════════════════════════════════════════════════════════════════
   CHARACTER COUNTER
   ════════════════════════════════════════════════════════════════════════════ */

userInput.addEventListener("input", () => {
  const len = userInput.value.length;
  charCountEl.textContent = len;

  // Colour feedback
  charBar.classList.remove("warn", "limit");
  if (len >= 250)      charBar.classList.add("limit");
  else if (len >= 200) charBar.classList.add("warn");
});


/* ════════════════════════════════════════════════════════════════════════════
   KEYBOARD  + BUTTON EVENTS
   ════════════════════════════════════════════════════════════════════════════ */

// Enter key → send (Shift+Enter does nothing special here)
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", sendMessage);
clearBtn.addEventListener("click", clearChat);


/* ════════════════════════════════════════════════════════════════════════════
   INITIALISE ON PAGE LOAD
   ════════════════════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();    // apply saved dark/light preference
  showWelcome();  // greet the user
  userInput.focus();
});