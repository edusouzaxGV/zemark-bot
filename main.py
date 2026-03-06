import os, requests
from flask import Flask, request

app = Flask(__name__)

# Busca as chaves do ambiente (Configuradas no painel do Render)
# Nenhuma chave fica exposta aqui no código
TOKENS = {
    "zemark": os.environ.get("TOKEN_ZEMARK"),
    "dudu": os.environ.get("TOKEN_DUDU"),
    "cassio": os.environ.get("TOKEN_CASSIO")
}
API_KEY = os.environ.get("NVIDIA_API_KEY")

def chat_com_nvidia(text):
    try:
        response = requests.post(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "meta/llama-3.3-70b-instruct",
                "messages": [{"role": "user", "content": text}],
                "max_tokens": 1024
            }, timeout=30
        )
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            return f"Erro NVIDIA ({response.status_code}): {response.text[:50]}"
    except Exception as e:
        return f"Erro conexão: {str(e)}"

# Rota única que trata o bot baseado na URL
@app.route("/<bot_name>", methods=["POST"])
def webhook(bot_name):
    if bot_name not in TOKENS:
        return "Bot não encontrado", 404
        
    data = request.get_json()
    if "message" in data:
        chat_id = data["message"]["chat"]["id"]
        text = data["message"].get("text", "")
        
        # Indica que está processando
        requests.get(f"https://api.telegram.org/bot{TOKENS[bot_name]}/sendChatAction?chat_id={chat_id}&action=typing")
        
        # Processa com IA
        resposta = f"[{bot_name.upper()}]: " + chat_com_nvidia(text)
        
        # Envia resposta
        requests.post(f"https://api.telegram.org/bot{TOKENS[bot_name]}/sendMessage", 
                      json={"chat_id": chat_id, "text": resposta, "parse_mode": "Markdown"})
    return "ok", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
