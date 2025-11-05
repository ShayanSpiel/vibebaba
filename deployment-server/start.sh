#!/bin/bash

echo "🚀 Starting Vibebaba Deployment Infrastructure..."
echo ""

# Check if PocketBase exists
if [ ! -f "./pocketbase" ]; then
    echo "📥 Downloading PocketBase..."

    # Detect OS
    OS=$(uname -s)
    ARCH=$(uname -m)

    if [ "$OS" = "Darwin" ]; then
        if [ "$ARCH" = "arm64" ]; then
            URL="https://github.com/pocketbase/pocketbase/releases/download/v0.20.0/pocketbase_0.20.0_darwin_arm64.zip"
        else
            URL="https://github.com/pocketbase/pocketbase/releases/download/v0.20.0/pocketbase_0.20.0_darwin_amd64.zip"
        fi
    elif [ "$OS" = "Linux" ]; then
        URL="https://github.com/pocketbase/pocketbase/releases/download/v0.20.0/pocketbase_0.20.0_linux_amd64.zip"
    else
        echo "❌ Unsupported OS: $OS"
        exit 1
    fi

    curl -L $URL -o pocketbase.zip
    unzip pocketbase.zip
    rm pocketbase.zip
    chmod +x pocketbase
    echo "✅ PocketBase downloaded"
    echo ""
fi

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start PocketBase in background
echo "🗄️  Starting PocketBase on http://localhost:8090..."
./pocketbase serve --http="localhost:8090" > pocketbase.log 2>&1 &
POCKETBASE_PID=$!

# Wait for PocketBase to start
sleep 2

# Start deployment server
echo "🚀 Starting Deployment Server on http://localhost:4000..."
npm run dev &
SERVER_PID=$!

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ All services running!"
echo "═══════════════════════════════════════════════════════"
echo "🗄️  PocketBase Admin: http://localhost:8090/_/"
echo "    Default credentials: admin@vibebaba.com / admin1234567890"
echo ""
echo "🚀 Deployment Server: http://localhost:4000"
echo ""
echo "📝 Logs:"
echo "    PocketBase: tail -f pocketbase.log"
echo "    Server: Check terminal output above"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo "═══════════════════════════════════════════════════════"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $POCKETBASE_PID 2>/dev/null
    kill $SERVER_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for processes
wait
