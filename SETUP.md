# ArkAngel - Local Setup Guide

## Overview
ArkAngel is a Chrome extension that works with a local Node.js backend. Here's how to set it up on your local machine for testing across different browsers and environments.

## Prerequisites
- Node.js 18+ installed on your machine
- Chrome/Chromium browser for extension testing
- Git (optional, for cloning)

## Setup Instructions

### 1. Download the Project

**Option A: Download from Replit**
1. In Replit, click the "Download as ZIP" button
2. Extract the ZIP file to your desired directory
3. Open terminal/command prompt in that directory

**Option B: Clone via Git (if available)**
```bash
git clone <repository-url>
cd arkangel-extension
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
# Create .env file
touch .env  # On Windows: type nul > .env
```

Add your OpenAI API key to the `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Start the Backend Server
```bash
npm run dev
```

The server will start on `http://localhost:5000` (as configured in the project).

### 5. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `/extension` folder from your project directory
5. The ArkAngel extension should now appear in your extensions list

### 6. Test the Extension

1. Navigate to any website
2. Click the ArkAngel extension icon in the toolbar
3. The side panel should open showing page context
4. Try asking a question about the page content

## Cross-Browser Testing

### Chrome/Chromium
- Follow the setup instructions above
- Works with all Chromium-based browsers (Edge, Brave, etc.)

### Firefox
Note: This extension uses Manifest V3 which is Chrome-specific. For Firefox:
1. You'd need to convert to Manifest V2 format
2. Modify the extension APIs to use Firefox's WebExtensions format
3. Load as temporary add-on in `about:debugging`

### Safari
- Safari uses a different extension format
- Would require significant adaptation using Xcode and Safari's extension framework

## Development Workflow

### Making Changes
1. **Backend changes**: Server auto-restarts with `npm run dev`
2. **Extension changes**: Click "Reload" button in `chrome://extensions/`
3. **Web interface changes**: Automatically reloads in browser

### File Structure
```
arkangel-extension/
├── extension/              # Chrome extension files
│   ├── manifest.json      # Extension configuration
│   ├── background.js      # Service worker
│   ├── content.js         # Page context extraction
│   ├── sidepanel.html     # Extension UI
│   ├── sidepanel.js       # Extension logic
│   └── styles.css         # Extension styling
├── server/                # Backend server
│   ├── index.ts          # Server entry point
│   └── routes.ts         # API endpoints
├── client/               # Web demo interface
└── package.json          # Dependencies
```

## Troubleshooting

### Extension Not Loading
- Ensure you selected the `/extension` folder, not the root folder
- Check for errors in `chrome://extensions/` 
- Verify manifest.json is valid

### Backend Connection Issues
- Ensure the server is running on `http://localhost:5000`
- Check firewall settings
- Verify OPENAI_API_KEY is set in `.env`

### API Issues
- Verify your OpenAI API key is valid and has credits
- Check console logs for error details
- Extension falls back to mock responses if OpenAI fails

## Production Deployment

### For Personal Use
1. Keep the extension loaded as "unpacked" for development
2. Run the backend server when needed: `npm run dev`

### For Distribution
1. Package the extension into a `.crx` file
2. Deploy backend to a hosting service (Heroku, Railway, etc.)
3. Update extension URLs to point to production backend
4. Submit to Chrome Web Store for public distribution

## Security Notes
- The extension only has access to visible page content
- No data is sent to external servers except OpenAI API calls
- All processing happens locally on your machine
- Extension requires explicit permission for localhost communication

## Additional Features

### Customization
- Modify context extraction rules in `content.js`
- Adjust AI prompts in `server/routes.ts`
- Customize UI styling in `extension/styles.css`

### Extending Functionality
- Add new API endpoints in `server/routes.ts`
- Enhance context extraction in `content.js`
- Add new UI features in `sidepanel.js`