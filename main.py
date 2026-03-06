import os
import requests
from flask import Flask, request

app = Flask(__name__)
TOKEN = "8562677208:AAG_3xAQaOMz7c6haWkarYcHiLzooV_o00M"

@app.route("/", methods=["POST"])
def webhook():
    data = request.get_json()
    if "message" in data:
        chat_id = data["message"]["chat"]["id"]
        text = data["message"].get("text", "")
        # Envia animação de typing
        requests.get(f"https://api.telegram.org/bot{TOKEN}/sendChatAction?chat_id={chat_id}&action=typing")
        # Resposta automática
        resposta = f"🧠 **ZÉMARK:** Recebi sua mensagem: {text}. Processando..."
        requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": chat_id, "text": resposta, "parse_mode": "Markdown"})
    return "ok", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
