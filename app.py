"""
app.py — Zevoir TaskBot | Flask Backend
========================================
This file is the "brain" of the app.
It receives messages from the browser, calls the external API,
computes statistics, and sends back a formatted reply.
"""

from flask import Flask, render_template, request, jsonify, session
import requests  # used to call the external todos API

# ── Create the Flask application ─────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = "zevoir-secret-key-2024"   # required to use Flask sessions

# ── The public API we read todos from ────────────────────────────────────────
TODOS_API = "https://jsonplaceholder.typicode.com/todos"


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: detect general / off-topic questions
# ─────────────────────────────────────────────────────────────────────────────
def is_general_question(text: str) -> bool:
    """
    Returns True only if the message looks like a real question.

    Example:
    What is AI?
    What is chatbot?
    Who are you?
    """

    text = text.lower()

    question_keywords = [
        "what", "who", "why", "how", "when", "where",
        "explain", "tell", "define", "about"
    ]

    return any(text.startswith(word) for word in question_keywords)


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: fetch todos and build the summary string
# ─────────────────────────────────────────────────────────────────────────────
def build_summary(user_id: int) -> tuple:
    """
    Calls the JSONPlaceholder API, filters todos by user_id,
    computes stats, and returns a formatted string.

    Returns:
        (summary_text, error_text)
        One of the two will always be None.
    """
    try:
        # ── Call the API (5-second timeout to avoid hanging forever) ──────
        response = requests.get(TODOS_API, timeout=5)

        # ── Check HTTP status ─────────────────────────────────────────────
        if response.status_code != 200:
            return None, (
                "Sorry, I couldn't reach the task service right now. "
                "Please try again later."
            )

        # ── Parse JSON ────────────────────────────────────────────────────
        all_todos = response.json()   # list of dicts

        # ── Filter only the todos for this specific user ──────────────────
        user_todos = [t for t in all_todos if t["userId"] == user_id]

        # ── Compute statistics ────────────────────────────────────────────
        total     = len(user_todos)
        completed = sum(1 for t in user_todos if t["completed"] is True)
        pending   = total - completed

        # Safe division — avoid dividing by zero
        percentage = (completed / total * 100) if total > 0 else 0.0

        # ── First 5 titles in their original order ────────────────────────
        first_five = user_todos[:5]
        titles_text = "\n".join(f"- {t['title']}" for t in first_five)

        # ── Build the final reply string ──────────────────────────────────
        summary = (
            f"""📊 Todo Summary for User {user_id}

✅ Completed: {completed}
🕒 Pending: {pending}
📌 Total: {total}
📈 Completion: {percentage:.2f}%

📝 First 5 Tasks:
- """ + "\n- ".join(t["title"] for t in first_five)
        )
        return summary, None   # success

    except requests.exceptions.Timeout:
        # API took too long
        return None, (
            "Sorry, I couldn't reach the task service right now. "
            "Please try again later."
        )
    except requests.exceptions.ConnectionError:
        # No internet or API is down
        return None, (
            "Sorry, I couldn't reach the task service right now. "
            "Please try again later."
        )
    except (ValueError, KeyError, TypeError):
        # JSON was malformed or missing expected fields
        return None, (
            "Sorry, I received unexpected data from the service. "
            "Please try again later."
        )
    except Exception:
        # Catch-all safety net
        return None, (
            "Sorry, something unexpected went wrong. "
            "Please try again later."
        )


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE: Serve the main page
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    """Render the chat page. Initialize session history if it doesn't exist."""
    if "history" not in session:
        session["history"] = []
    return render_template("index.html")


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE: Handle incoming chat messages
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/chat", methods=["POST"])
def chat():
    """
    Receives a JSON POST from the browser:
        { "message": "5" }

    Returns a JSON response:
        { "reply": "Total: 20\nCompleted: ..." }
    """
    data        = request.get_json()
    user_msg    = data.get("message", "").strip()

    # ── Guard: empty message ──────────────────────────────────────────────
    if not user_msg:
        return jsonify({"reply": "Please type something!"})

    # ── Guard: too long ───────────────────────────────────────────────────
    if len(user_msg) > 250:
        return jsonify({"reply": "Message too long — please keep it under 250 characters."})

    # ── Guard: general / off-topic question (contains any letter) ────────
    if is_general_question(user_msg):
        return jsonify({
            "reply": (
                "🤖 Sorry, I'm not able to answer that!\n\n"
                "I am Zevoir TaskBot — a specialised task assistant.\n"
                "I can only look up todo statistics for user IDs 1 to 10.\n\n"
                "💡 Try typing a number like: 1, 3, 7, or 10."
            )
        })

    # ── Guard: must be an integer ─────────────────────────────────────────
    try:
        user_id = int(user_msg)
    except ValueError:
        return jsonify({
            "reply": (
                "⚠️ Invalid input!\n\n"
                "Please enter a valid user ID — a whole number between 1 and 10.\n"
                "Example: type  3  and press Send."
            )
        })

    # ── Guard: must be 1–10 ───────────────────────────────────────────────
    if user_id < 1 or user_id > 10:
        return jsonify({
            "reply": (
                "⚠️ That number is outside my range!\n\n"
                "Please enter a valid user ID between 1 and 10.\n"
                f"You entered: {user_id}\n\n"
                "💡 Valid options: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10"
            )
        })

    # ── All checks passed — call the API ─────────────────────────────────
    summary, error = build_summary(user_id)

    if error:
        return jsonify({"reply": error})

    return jsonify({"reply": summary})


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE: Clear chat history
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/clear", methods=["POST"])
def clear():
    """Wipe the session chat history."""
    session["history"] = []
    return jsonify({"status": "ok"})


# ─────────────────────────────────────────────────────────────────────────────
# START THE SERVER
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # debug=True → auto-reload on file changes + shows errors in browser
    app.run(debug=True)