# ArkAngel - Chrome Extension AI Assistant

<div align="center">
  <img src="SkillSyncer/extension/arkangel-wings-logo.png" alt="ArkAngel Logo" width="120" height="120">
  <h3>Your AI-powered Chrome extension for intelligent web page analysis</h3>
</div>

## 🚀 Overview

ArkAngel is a Chrome Manifest V3 extension that provides an intelligent AI assistant in a side panel, helping you understand and interact with any web page. It extracts page context, analyzes content structure, and answers your questions using OpenAI's GPT-4, all while maintaining your privacy.

## ✨ Features

- **🤖 AI-Powered Analysis**: Get intelligent answers about any web page content
- **🔍 Smart Context Extraction**: Automatically analyzes page structure, headings, and interactive elements
- **📱 Chrome Side Panel**: Native Chrome integration with a clean, intuitive interface
- **🔒 Privacy-First**: All processing happens locally - no data leaves your machine
- **⚡ Real-time Updates**: Context refreshes automatically as you navigate and select text
- **💬 Conversation Memory**: Track your questions and AI responses
- **🎯 Intelligent Suggestions**: Context-aware question recommendations
- **📊 Page Insights**: Understand page structure, navigation, and content organization

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Page      │    │  Chrome Extension│    │  Node.js Backend│
│                 │    │                  │    │                 │
│ • Content       │◄──►│ • Content Script │◄──►│ • Express API   │
│ • Structure     │    │ • Background     │    │ • OpenAI        │
│ • Interactions  │    │ • Side Panel     │    │ • Context       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Extension**: Chrome Manifest V3 + Vanilla JavaScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **AI**: OpenAI GPT-4 API
- **Build Tools**: Vite + ESBuild
- **UI Components**: Radix UI + Lucide Icons

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- Chrome/Chromium browser
- OpenAI API key

### 1. Clone the Repository

```bash
git clone https://github.com/NadavShanun-design/ArkAngel-Demo.git
cd ArkAngel-Demo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
# Create .env file
touch .env  # On Windows: type nul > .env
```

Add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_neon_database_url_here
```

### 4. Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`.

### 5. Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `/extension` folder from your project directory
5. The ArkAngel extension should now appear in your extensions list

## 🎯 Usage

### Basic Operation

1. **Navigate to any website**
2. **Click the ArkAngel extension icon** in your toolbar
3. **The side panel opens** showing page context
4. **Ask questions** about the page content
5. **Get AI-powered answers** based on the page context

### Context Extraction

ArkAngel automatically extracts:
- Page title and URL
- Meta descriptions
- Headings (H1-H6)
- Interactive elements (buttons, links)
- Form structures
- Selected text
- Content organization

### Example Questions

- "What is this page about?"
- "How do I navigate this page?"
- "What does the [section name] cover?"
- "Explain the selected text"
- "What actions can I take on this page?"

## 🔧 Development

### Project Structure

```
ArkAngel-Demo/
├── extension/              # Chrome extension files
│   ├── manifest.json      # Extension configuration
│   ├── background.js      # Service worker
│   ├── content.js         # Page context extraction
│   ├── sidepanel.html     # Extension UI
│   ├── sidepanel.js       # Extension logic
│   └── styles.css         # Extension styling
├── server/                # Backend server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API endpoints
│   └── vite.ts           # Vite integration
├── client/               # Web demo interface
│   ├── src/              # React components
│   ├── components/       # UI components
│   └── pages/            # Page components
├── shared/               # Shared schemas
└── package.json          # Dependencies
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run check            # TypeScript type checking

# Database
npm run db:push          # Push database schema changes
```

### API Endpoints

- `GET /health` - Health check
- `POST /api/ask` - Submit questions with page context
- `POST /api/analyze-context` - Analyze page context

## 🎨 Customization

### Styling

- Modify `extension/styles.css` for extension appearance
- Update `client/src/index.css` for web interface
- Customize Tailwind classes in React components

### Context Extraction

- Edit `extension/content.js` to modify what data is extracted
- Adjust extraction limits and selectors
- Add new context extraction rules

### AI Prompts

- Modify prompts in `server/routes.ts`
- Adjust AI model parameters
- Customize fallback responses

## 🚀 Deployment

### Local Development

```bash
npm run dev              # Start development server
# Extension auto-reloads when you click "Reload" in chrome://extensions/
```

### Production

```bash
npm run build            # Build the project
npm run start            # Start production server
```

### Chrome Web Store

1. Package the extension: `npm run build`
2. Create a `.crx` file from the `/extension` folder
3. Submit to Chrome Web Store for distribution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the GPT-4 API
- Chrome Extensions team for Manifest V3
- The open-source community for amazing tools and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/NadavShanun-design/ArkAngel-Demo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/NadavShanun-design/ArkAngel-Demo/discussions)
- **Documentation**: [Wiki](https://github.com/NadavShanun-design/ArkAngel-Demo/wiki)

---

<div align="center">
  <p>Made with ❤️ by the ArkAngel team</p>
  <p>Transform how you interact with the web</p>
</div>
