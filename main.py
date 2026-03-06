import os, requests
from flask import Flask, request

app = Flask(__name__)

# Tokens puxados do Render (Configuração de Ambiente)
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
                "model": "meta/llama-3.3-70b-instruct", # Testando com Llama (mais estável na NVIDIA)
                "messages": [{"role": "user", "content": text}],
                "max_tokens": 1024
            }, timeout=30
        )
        return response.json()['choices'][0]['message']['content'] if response.status_code == 200 else f"Erro NVIDIA: {response.status_code}"
    except Exception as e:
        return f"Erro conexão: {str(e)}"

# Rota para cada Bot
@app.route("/zemark", methods=["POST"])
def hook_zemark():
    data = request.get_json()
    chat_id = data["message"]["chat"]["id"]
    text = data["message"].get("text", "")
    resposta = "ZÉMARK (IA): " + chat_com_nvidia(text)
    requests.post(f"https://api.telegram.org/bot{TOKENS['zemark']}/sendMessage", json={"chat_id": chat_id, "text": resposta})
    return "ok", 200

@app.route("/dudu", methods=["POST"])
def hook_dudu():
    data = request.get_json()
    chat_id = data["message"]["chat"]["id"]
    text = data["message"].get("text", "")
    resposta = "DUDU (IA): " + chat_com_nvidia(text)
    requests.post(f"https://api.telegram.org/bot{TOKENS['dudu']}/sendMessage", json={"chat_id": chat_id, "text": resposta})
    return "ok", 200

@app.route("/cassio", methods=["POST"])
def hook_cassio():
    data = request.get_json()
    chat_id = data["message"]["chat"]["id"]
    text = data["message"].get("text", "")
    resposta = "CASSIO (IA): " + chat_com_nvidia(text)
    requests.post(f"https://api.telegram.org/bot{TOKENS['cassio']}/sendMessage", json={"chat_id": chat_id, "text": resposta})
    return "ok", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
