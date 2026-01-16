# CodersLab - AI Minecraft Code Generator

**Made with ❤️ by Seazon | Proudly built in 🇳🇵 Nepal**

A professional web-based platform that generates Minecraft development resources (plugins, configs, scripts, datapacks, and command blocks) using cutting-edge AI technology.

## ✨ Features

- 🎮 Generate Minecraft plugins, configs, Skript scripts, datapacks, and command blocks
- 🤖 Powered by free AI APIs (Groq and Hugging Face)
- ✨ **AI-powered code modification** - Modify generated code with natural language prompts
- ✏️ **Edit generated code** directly in the browser
- 🔐 **Discord authentication** for extended usage (50 generations/day vs 3 free)
- 🛡️ **VPN/Proxy detection** for security
- 📊 **Usage tracking** with daily limits per IP
- 💾 Local history storage for previous generations
- 📱 Responsive dark theme design for desktop and mobile
- ⚡ Live code typing animation
- 📥 Download generated code with proper file extensions
- 🎨 Professional dark theme with emerald/cyan accents

## 🎯 About

**CodersLab** is a professional AI-powered code generation platform specifically designed for Minecraft developers. Whether you're building plugins, creating configurations, writing Skript scripts, or developing datapacks, CodersLab makes it easy with natural language prompts.

**Created by:** Seazon  
**Location:** 🇳🇵 Nepal  
**Mission:** Empowering Minecraft developers worldwide with AI technology

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Monaco Editor for code display

**Backend:**
- Node.js with Express
- Rate limiting for API protection
- AI provider fallback system

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Groq API key (free at https://console.groq.com)
- Hugging Face API key (free at https://huggingface.co)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env and add your API keys
```

4. Start development servers:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000
The backend API will be available at http://localhost:3001

## Development

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
minecraft-code-generator/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── backend/           # Express backend API
│   ├── src/
│   │   ├── providers/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
└── package.json       # Root workspace configuration
```

## License

MIT
