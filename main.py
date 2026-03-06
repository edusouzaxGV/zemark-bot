import os, requests
from flask import Flask, request

app = Flask(__name__)
TOKEN = "8562677208:AAG_3xAQaOMz7c6haWkarYcHiLzooV_o00M"
# Agora buscamos a chave diretamente das variáveis de ambiente
API_KEY = os.environ.get("NVIDIA_API_KEY")

@app.route("/", methods=["POST"])
def webhook():
    data = request.get_json()
    if "message" in data:
        chat_id = data["message"]["chat"]["id"]
        text = data["message"].get("text", "")
        
        # Indica que está processando
        requests.get(f"https://api.telegram.org/bot{TOKEN}/sendChatAction?chat_id={chat_id}&action=typing")
        
        try:
            # Chamada para NVIDIA
            response = requests.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-ai/deepseek-v3",
                    "messages": [{"role": "user", "content": text}],
                    "max_tokens": 1024
                },
                timeout=30
            )
            
            if response.status_code == 200:
                resposta = response.json()['choices'][0]['message']['content']
            else:
                resposta = f"🧠 ZÉMARK: Erro NVIDIA ({response.status_code}): {response.text[:50]}"
        except Exception as e:
            resposta = f"🧠 ZÉMARK: Erro de conexão: {str(e)}"
        
        # Envia resposta
        requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", 
                      json={"chat_id": chat_id, "text": resposta, "parse_mode": "Markdown"})
    return "ok", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
