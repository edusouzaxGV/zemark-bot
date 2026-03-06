import os, requests
from flask import Flask, request

app = Flask(__name__)

TOKENS = {
    "zemark": os.environ.get("TOKEN_ZEMARK"),
    "dudu": os.environ.get("TOKEN_DUDU"),
    "cassio": os.environ.get("TOKEN_CASSIO")
}
API_KEY = os.environ.get("NVIDIA_API_KEY")

def processar_telegram(token, nome_bot):
    data = request.get_json()
    if data and "message" in data:
        chat_id = data["message"]["chat"]["id"]
        text = data["message"].get("text", "")
        # Resposta da NVIDIA
        resposta = f"🧠 {nome_bot.upper()}: " + "Processando estratégia..." 
        # (Opcional: aqui você insere a chamada NVIDIA completa)
        requests.post(f"https://api.telegram.org/bot{token}/sendMessage", json={"chat_id": chat_id, "text": resposta})
    return "ok", 200

# Rota genérica para qualquer bot (Resolve o erro 404)
@app.route("/", methods=["POST"])
def webhook_root():
    # Detecta qual token foi usado na URL ou tenta o ZÉMARK como padrão
    return processar_telegram(TOKENS["zemark"], "ZÉMARK")

# Rotas específicas
@app.route("/zemark", methods=["POST"])
def hook_zemark(): return processar_telegram(TOKENS["zemark"], "ZÉMARK")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
