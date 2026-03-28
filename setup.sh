#!/bin/bash
# AIBlogger Setup Script
# Run this from the AIBlogger directory: bash setup.sh

set -e

echo "🤖 AIBlogger Setup"
echo "=================="

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git repository..."
    git init
    git checkout -b main
    git add .
    git commit -m "Initial commit: AI-powered blog application

- Next.js 14 with TypeScript and Tailwind CSS
- SQLite database for persistent storage
- JWT auth (username: austin, password: admin123)
- Admin panel with manual post creation
- AI URL Review powered by Claude API

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
    echo "✅ Git repository initialized and committed"
else
    echo "✅ Git already initialized"
fi
echo ""

echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env.local and add your ANTHROPIC_API_KEY"
echo "     Get one at: https://console.anthropic.com/"
echo ""
echo "  2. (Optional) Push to GitHub:"
echo "     git remote add origin https://github.com/YOUR_USERNAME/AIBlogger.git"
echo "     git push -u origin main"
echo ""
echo "  3. Start the dev server:"
echo "     npm run dev"
echo ""
echo "  4. Open http://localhost:3000"
echo "     Admin login: austin / admin123"
