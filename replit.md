# ArkAngel - Chrome Extension

## Overview

ArkAngel is a Chrome Manifest V3 extension that provides a side panel AI assistant for asking questions about web page content. The system consists of a Chrome extension with content scripts for page data extraction, a React-based side panel interface, and a local Node.js/Express backend server for processing queries. All data processing happens locally with no cloud dependencies, prioritizing user privacy.

## Recent Changes (August 18, 2025)
- Rebranded from "AI Page Assistant" to "ArkAngel"
- Integrated user's OpenAI API key for real GPT-4o responses (3-4 second response times)
- Fixed all CORS and port configuration issues (3000 → 5000, relative fetch paths)
- Updated logo to user's professional black wings design on transparent background
- Resolved connection errors between frontend and backend
- Tested and verified full system functionality with real AI responses

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Extension Interface**: Chrome Manifest V3 extension with side panel UI built using vanilla JavaScript and CSS
- **React Web Interface**: Separate React application built with TypeScript and Vite for development and testing
- **UI Components**: shadcn/ui component library with Radix UI primitives and Tailwind CSS for styling
- **State Management**: React hooks and context for local state management
- **Data Fetching**: TanStack Query for API state management and caching

### Backend Architecture
- **Server Framework**: Express.js with TypeScript for the REST API
- **Development Setup**: Vite development server for hot reloading and fast builds
- **API Structure**: Single `/api/ask` endpoint that processes questions with page context
- **Response Format**: JSON responses with structured answer data
- **Error Handling**: Comprehensive error states and retry mechanisms

### Chrome Extension Components
- **Manifest V3**: Modern extension architecture with service worker background script
- **Content Scripts**: Lightweight page context extraction including titles, headings, forms, and actionable elements
- **Side Panel**: Native Chrome side panel integration for seamless user experience
- **Message Passing**: Chrome extension APIs for communication between content scripts and background worker
- **Permissions**: Minimal required permissions (activeTab, tabs, scripting, storage, sidePanel)

### Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL with schema definitions
- **Local Storage**: Chrome storage.local for extension settings and preferences
- **In-Memory Storage**: Temporary conversation history and page context caching
- **Session Management**: Basic session storage without authentication requirements

### Context Extraction Strategy
- **Page Metadata**: Title, URL, and meta descriptions
- **Content Structure**: First few headings (H1-H6) for page hierarchy
- **Interactive Elements**: Buttons, links, and form inputs with meaningful labels
- **Form Analysis**: Form structure and input field identification
- **Selected Text**: User-selected content for targeted questions
- **Performance Optimization**: Limited extraction scope to maintain responsiveness

### Privacy and Security Design
- **Local Processing**: All data remains on user's machine
- **No Cloud Services**: Zero external API dependencies
- **CORS Configuration**: Restricted to localhost and chrome-extension origins
- **Minimal Data Collection**: Only visible page content, no hidden or cross-origin data
- **Host Permissions**: Development-only localhost access

## External Dependencies

### Core Framework Dependencies
- **React**: Frontend UI framework with TypeScript support
- **Express.js**: Backend web server framework
- **Vite**: Build tool and development server
- **Node.js**: Runtime environment for backend services

### Database and ORM
- **Drizzle ORM**: Database toolkit and query builder
- **@neondatabase/serverless**: PostgreSQL client for serverless environments
- **drizzle-zod**: Schema validation integration

### UI and Styling Libraries
- **shadcn/ui**: Pre-built component library
- **Radix UI**: Primitive UI components (@radix-ui/*)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **class-variance-authority**: Utility for creating component variants

### Development Tools
- **TypeScript**: Type-safe JavaScript development
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing and autoprefixer
- **TanStack Query**: Server state management for React

### Chrome Extension APIs
- **Chrome Extension APIs**: Native browser integration
- **Chrome Storage API**: Local data persistence
- **Chrome Scripting API**: Content script injection
- **Chrome Side Panel API**: Native panel integration

### Backend Utilities
- **CORS**: Cross-origin resource sharing middleware
- **date-fns**: Date manipulation utilities
- **connect-pg-simple**: PostgreSQL session store (if needed)
- **tsx**: TypeScript execution for development