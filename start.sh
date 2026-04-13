#!/bin/bash
# Start TMCMS development servers

echo "Starting TMCMS..."

# Start backend
cd "$(dirname "$0")/backend"
python run.py &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Start frontend
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "TMCMS is running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Initial login: admin@example.com / admin1234"
echo ""
echo "Press Ctrl+C to stop..."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
