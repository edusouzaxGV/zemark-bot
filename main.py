import os, requests
from flask import Flask, request

app = Flask(__name__)
TOKEN = "8562677208:AAG_3xAQaOMz7c6haWkarYcHiLzooV_o00M"
NVIDIA_API_KEY = "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" # Ajuste se necessário

@app.route("/", methods=["POST"])
def webhook():
    data = request.get_json()
    if "message" in data:
        chat_id = data["message"]["chat"]["id"]
        text = data["message"].get("text", "")
        
        # 1. Enviar typing no Telegram
        requests.get(f"https://api.telegram.org/bot{TOKEN}/sendChatAction?chat_id={chat_id}&action=typing")
        
        # 2. Chamar a API da NVIDIA (DeepSeek V3.2)
        response = requests.post(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {NVIDIA_API_KEY}"},
            json={
                "model": "deepseek-ai/deepseek-v3", # NVIDIA usa o ID do modelo
                "messages": [{"role": "user", "content": text}],
                "max_tokens": 1024,
                "stream": False
            }
        )
        
        # 3. Processar resposta da NVIDIA
        try:
            resposta = response.json()['choices'][0]['message']['content']
        except:
            resposta = "🧠 ZÉMARK: Tive um erro técnico na conexão com a NVIDIA."
        
        # 4. Responder no Telegram
        requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", 
                      json={"chat_id": chat_id, "text": resposta, "parse_mode": "Markdown"})
    return "ok", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
