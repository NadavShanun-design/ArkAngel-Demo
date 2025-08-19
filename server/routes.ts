import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import OpenAI from "openai";

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface PageContext {
  title: string;
  url: string;
  meta_description: string;
  headings: Array<{ level: number; text: string }>;
  actions: Array<{ text: string; type: string; href?: string }>;
  forms: Array<{ action: string; method: string; inputs: any[] }>;
  selected_text: string;
  extracted_at: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for chrome-extension origins in development
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      /^chrome-extension:\/\/.+$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'ArkAngel Backend'
    });
  });

  // Main /ask endpoint for processing questions with page context
  app.post('/api/ask', async (req, res) => {
    try {
      const { question, context } = req.body;

      if (!question || !question.trim()) {
        return res.status(400).json({ 
          error: 'Question is required',
          message: 'Please provide a question to ask about the page.'
        });
      }

      if (!context) {
        return res.status(400).json({ 
          error: 'Context is required',
          message: 'Page context is required to answer questions.'
        });
      }

      // Log the request for development
      console.log('Question received:', question.slice(0, 100));
      console.log('Context from:', context.url || 'unknown URL');

      // Generate AI response using OpenAI
      const answer = await generateAIResponse(question, context);

      res.json({
        answer,
        contextUsed: {
          title: context.title,
          url: context.url,
          headingsCount: context.headings?.length || 0,
          actionsCount: context.actions?.length || 0,
          hasSelectedText: !!context.selected_text
        }
      });

    } catch (error) {
      console.error('Error processing /ask request:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to process your question. Please try again.'
      });
    }
  });

  // Context analysis endpoint
  app.post('/api/analyze-context', async (req, res) => {
    try {
      const { context } = req.body;

      if (!context) {
        return res.status(400).json({ 
          error: 'Context is required',
          message: 'Page context is required for analysis.'
        });
      }

      const analysis = analyzePageContext(context);

      res.json({
        analysis,
        suggestions: generateContextSuggestions(context)
      });

    } catch (error) {
      console.error('Error analyzing context:', error);
      res.status(500).json({ 
        error: 'Analysis failed',
        message: 'Failed to analyze page context.'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function generateAIResponse(question: string, context: PageContext): Promise<string> {
  try {
    const contextSummary = buildContextSummary(context);
    
    const prompt = `You are ArkAngel, a helpful AI assistant that answers questions about web pages. Based on the page context provided below, please answer the user's question in a clear, helpful way.

Page Context:
- Title: ${context.title}
- URL: ${context.url}
- Meta Description: ${context.meta_description || 'None provided'}
- Main Headings: ${context.headings.map(h => `H${h.level}: ${h.text}`).join(', ') || 'None'}
- Interactive Elements: ${context.actions.map(a => `${a.type}: "${a.text}"`).join(', ') || 'None'}
- Forms: ${context.forms.length} form(s) detected
${context.selected_text ? `- Selected Text: "${context.selected_text}"` : ''}

User Question: ${question}

Please provide a helpful, accurate answer based on this page context. If the question can't be answered from the available context, explain what information is available and suggest what the user might want to know about this page.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are ArkAngel, a helpful AI assistant for analyzing web pages. Provide clear, concise answers based on the page context provided."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    return response.choices[0].message.content || "I couldn't generate a response. Please try again.";
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to context-based response if OpenAI fails
    return generateContextualAnswer(question, context);
  }
}

function buildContextSummary(context: PageContext): string {
  const parts = [];
  if (context.title) parts.push(`Title: ${context.title}`);
  if (context.url) parts.push(`URL: ${context.url}`);
  if (context.headings.length > 0) {
    parts.push(`Headings: ${context.headings.map(h => h.text).join(', ')}`);
  }
  if (context.actions.length > 0) {
    parts.push(`Interactive elements: ${context.actions.map(a => a.text).join(', ')}`);
  }
  if (context.selected_text) {
    parts.push(`Selected text: "${context.selected_text}"`);
  }
  return parts.join(' | ');
}

function generateContextualAnswer(question: string, context: PageContext): string {
  const questionLower = question.toLowerCase();
  const title = context.title || '';
  const url = context.url || '';
  const headings = context.headings || [];
  const actions = context.actions || [];
  const selectedText = context.selected_text || '';
  const metaDescription = context.meta_description || '';

  // Generate different types of responses based on question content
  if (questionLower.includes('what') && questionLower.includes('page')) {
    return `This page is titled "${title}" and appears to be ${getPageType(context)}. ${metaDescription ? `The page description states: "${metaDescription}". ` : ''}It contains ${headings.length} main headings and ${actions.length} interactive elements like buttons and links.`;
  }

  if (questionLower.includes('title')) {
    return `The page title is "${title}". This gives us insight into the main topic or purpose of the page.`;
  }

  if (questionLower.includes('url') || questionLower.includes('link')) {
    return `The current page URL is: ${url}. ${actions.length > 0 ? `The page also contains ${actions.length} clickable elements including buttons and links.` : ''}`;
  }

  if (questionLower.includes('heading') || questionLower.includes('section')) {
    if (headings.length > 0) {
      const headingText = headings.slice(0, 5).map(h => `"${h.text}"`).join(', ');
      return `The page has ${headings.length} main headings. The first few are: ${headingText}. These headings help organize the content into different sections.`;
    } else {
      return `This page doesn't appear to have clear section headings, which might indicate it's a simple page or uses a different content structure.`;
    }
  }

  if (questionLower.includes('button') || questionLower.includes('click') || questionLower.includes('action')) {
    if (actions.length > 0) {
      const buttonActions = actions.filter(a => a.type === 'button').slice(0, 3);
      const linkActions = actions.filter(a => a.type === 'link').slice(0, 3);
      
      let response = `The page has ${actions.length} interactive elements. `;
      if (buttonActions.length > 0) {
        response += `Buttons include: ${buttonActions.map(a => `"${a.text}"`).join(', ')}. `;
      }
      if (linkActions.length > 0) {
        response += `Links include: ${linkActions.map(a => `"${a.text}"`).join(', ')}.`;
      }
      return response;
    } else {
      return `This page doesn't appear to have many interactive buttons or clickable elements. It might be primarily informational content.`;
    }
  }

  if (selectedText && (questionLower.includes('selected') || questionLower.includes('highlight'))) {
    return `You have selected the text: "${selectedText}". This appears to be ${analyzeSelectedText(selectedText, context)}. Would you like me to explain this content in more detail?`;
  }

  if (questionLower.includes('summary') || questionLower.includes('about')) {
    return `Based on the page context, this appears to be ${getPageType(context)} titled "${title}". ${metaDescription || 'The page contains organized content with multiple sections and interactive elements.'} ${headings.length > 0 ? `The main topics covered include sections on ${headings.slice(0, 3).map(h => h.text.toLowerCase()).join(', ')}.` : ''}`;
  }

  if (questionLower.includes('help') || questionLower.includes('how')) {
    if (actions.length > 0) {
      const helpfulActions = actions.filter(a => 
        a.text.toLowerCase().includes('help') || 
        a.text.toLowerCase().includes('support') ||
        a.text.toLowerCase().includes('guide') ||
        a.text.toLowerCase().includes('tutorial')
      );
      
      if (helpfulActions.length > 0) {
        return `For help with this page, you can try clicking on: ${helpfulActions.map(a => `"${a.text}"`).join(', ')}. The page also has ${actions.length} total interactive elements that might provide additional assistance.`;
      }
    }
    
    return `To get help with this page content, look for sections titled ${headings.filter(h => h.text.toLowerCase().includes('help') || h.text.toLowerCase().includes('guide')).map(h => `"${h.text}"`).join(', ') || 'help or support'}. ${actions.length > 0 ? `You can also try the ${actions.length} interactive elements on the page.` : ''}`;
  }

  // Default response with context
  return `Based on the page "${title}", I can see ${headings.length} main sections and ${actions.length} interactive elements. ${selectedText ? `You've selected: "${selectedText}". ` : ''}Could you be more specific about what you'd like to know about this page? I can help explain the content, navigation options, or specific sections.`;
}

function getPageType(context: PageContext): string {
  const title = (context.title || '').toLowerCase();
  const url = (context.url || '').toLowerCase();
  const headings = context.headings || [];
  
  if (url.includes('docs') || url.includes('documentation')) return 'a documentation page';
  if (url.includes('api')) return 'an API reference page';
  if (url.includes('blog') || url.includes('article')) return 'a blog post or article';
  if (url.includes('shop') || url.includes('store') || url.includes('buy')) return 'an e-commerce page';
  if (url.includes('login') || url.includes('signup')) return 'a login or registration page';
  if (title.includes('home') || url === '/' || url.includes('index')) return 'a homepage';
  
  const headingText = headings.map(h => h.text.toLowerCase()).join(' ');
  if (headingText.includes('tutorial') || headingText.includes('guide')) return 'a tutorial or guide';
  if (headingText.includes('about')) return 'an about page';
  if (headingText.includes('contact')) return 'a contact page';
  
  return 'a web page';
}

function analyzeSelectedText(text: string, context: PageContext): string {
  if (text.length < 10) return 'a short phrase or keyword';
  if (text.length > 200) return 'a longer passage of text';
  
  if (text.includes('API') || text.includes('function') || text.includes('code')) {
    return 'technical content related to programming or APIs';
  }
  
  if (text.includes('$') || text.includes('price') || text.includes('cost')) {
    return 'pricing or cost information';
  }
  
  return 'important content you highlighted';
}

function analyzePageContext(context: PageContext) {
  return {
    pageType: getPageType(context),
    complexity: context.headings?.length > 5 ? 'high' : context.headings?.length > 2 ? 'medium' : 'low',
    interactivity: context.actions?.length > 10 ? 'high' : context.actions?.length > 3 ? 'medium' : 'low',
    hasSelectedContent: !!context.selected_text,
    contentStructure: {
      headings: context.headings?.length || 0,
      actions: context.actions?.length || 0,
      forms: context.forms?.length || 0
    }
  };
}

function generateContextSuggestions(context: PageContext): string[] {
  const suggestions = [];
  
  if (context.headings?.length > 0) {
    suggestions.push(`What does the "${context.headings[0].text}" section cover?`);
  }
  
  if (context.actions?.length > 0) {
    const firstAction = context.actions[0];
    suggestions.push(`What happens when I click "${firstAction.text}"?`);
  }
  
  if (context.selected_text) {
    suggestions.push(`Explain the selected text: "${context.selected_text.slice(0, 50)}..."`);
  }
  
  suggestions.push('What is this page about?');
  suggestions.push('How do I navigate this page?');
  
  return suggestions.slice(0, 5);
}
