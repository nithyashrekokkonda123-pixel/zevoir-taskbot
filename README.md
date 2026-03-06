# 🤖 Zevoir TaskBot

A beginner-friendly chatbot web app built with **Python Flask** (backend) and **HTML + CSS + JavaScript** (frontend).  
Users type a number (1–10) and the bot returns a live todo summary fetched from a public API.

---

## 📁 Project Structure

```
zevoir-taskbot/
├── app.py                ← Flask backend — routing, API calls, validation
├── templates/
│   └── index.html        ← Chat page markup
├── static/
│   ├── style.css         ← Full dark + light theme styling
│   └── script.js         ← Frontend chat logic
└── README.md             ← This file
```

---

## 🐍 Python Version

| Requirement | Version     |
|-------------|-------------|
| Python      | **3.8+**    |
| Flask       | latest      |
| Requests    | latest      |

Check your Python version:
```bash
python --version
```

---

## ⚙️ Installation

### Step 1 — (Recommended) Create a virtual environment

```bash
# Create it
python -m venv venv

# Activate — Windows:
venv\Scripts\activate

# Activate — Mac / Linux:
source venv/bin/activate
```

You'll see `(venv)` in your terminal prompt when it's active.

### Step 2 — Install packages

```bash
pip install flask requests
```

That's all you need!

---

## ▶️ Running the App

```bash
# Make sure you're inside the zevoir-taskbot/ folder
cd zevoir-taskbot

# Start the Flask development server
python app.py
```

Expected output:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

Open your browser and go to:
```
http://127.0.0.1:5000
```

---

## 💻 Step-by-Step: Running in VS Code

1. Open **VS Code**
2. Click **File → Open Folder…** and choose the `zevoir-taskbot/` folder
3. Open the built-in terminal: **Terminal → New Terminal** (or press `` Ctrl+` ``)
4. Install dependencies:
   ```bash
   pip install flask requests
   ```
5. Run the server:
   ```bash
   python app.py
   ```
6. Open **http://127.0.0.1:5000** in your browser
7. Type `5` in the input and press **Enter** — you'll see the bot reply!

---

## 🧪 Simulating an API Error (for testing)

You have three easy options:

### Option A — Change the API URL to a fake/broken one
In `app.py`, change:
```python
TODOS_API = "https://jsonplaceholder.typicode.com/todos"
```
to:
```python
TODOS_API = "https://this-url-does-not-exist-at-all.xyz/todos"
```
Save the file. Flask will auto-reload. Type a valid number — the bot will show the friendly error message.

### Option B — Set the timeout to 0 seconds (instant timeout)
In `app.py`, find:
```python
response = requests.get(TODOS_API, timeout=5)
```
Change to:
```python
response = requests.get(TODOS_API, timeout=0.001)
```
This forces a Timeout error immediately.

### Option C — Turn off your internet
Disconnect from Wi-Fi/Ethernet while the Flask server is running, then send a message. A `ConnectionError` will trigger the friendly error response.

---

## ✅ Feature Checklist

| Feature                          | Status |
|----------------------------------|--------|
| Fetch todos from API             | ✅     |
| Filter by userId                 | ✅     |
| Total / Completed / Pending      | ✅     |
| Completion % to 2 decimals       | ✅     |
| First 5 titles                   | ✅     |
| WhatsApp-style chat bubbles      | ✅     |
| Timestamps on messages           | ✅     |
| "Bot is typing…" indicator       | ✅     |
| Dark / Light mode toggle         | ✅     |
| Online status indicator          | ✅     |
| Clear chat button                | ✅     |
| Character limit (250)            | ✅     |
| Enter key support                | ✅     |
| Responsive (mobile + desktop)    | ✅     |
| Friendly validation messages     | ✅     |
| API error handling               | ✅     |
| Welcome message on load          | ✅     |

---

## 💬 Example Bot Responses

**Input:** `5`
```
Total: 20
Completed: 12
Pending: 8
Completion: 60.00%
First 5 titles:
- vero rerum temporibus dolor
- in enim a facere
- dolorem eum magni eos aperiam quia
- accusamus eos facilis sint et aut voluptatem
- accusantium eos facilis sint et aut voluptatem
```

**Input:** `abc`
```
Please enter a valid number (example: 1).
```

**Input:** `99`
```
This is out of my ability please ask something between numbers 1 & 10.
```

**Input:** `who are you`
```
I am a simple task bot and can only answer questions about user IDs between 1 and 10.
```
