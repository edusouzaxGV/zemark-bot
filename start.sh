#!/bin/bash
# Start AMP Platform (Backend + Frontend)

echo "🚀 Starting AMP — AI Agents Management Platform"

# Start backend
cd backend
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend started on http://localhost:8000 (PID $BACKEND_PID)"

# Start frontend
cd ../frontend
npm install -q
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started on http://localhost:5173 (PID $FRONTEND_PID)"

echo ""
echo "📡 API docs: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
