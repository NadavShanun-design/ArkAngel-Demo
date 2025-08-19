import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  Send, 
  Copy, 
  ChevronDown, 
  Bot, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  HelpCircle,
  Quote
} from "lucide-react";

interface PageContext {
  title: string;
  url: string;
  meta_description: string;
  headings: Array<{ level: number; text: string }>;
  actions: Array<{ text: string; type: string; href?: string }>;
  forms: Array<{ action: string; method: string; inputs: any[] }>;
  selected_text: string;
  extracted_at: string;
  extraction_time?: number;
}

interface ConversationItem {
  question: string;
  answer: string;
  timestamp: string;
}

export default function ExtensionPanel() {
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isJsonExpanded, setIsJsonExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([]);
  
  const { toast } = useToast();

  // Check backend connection (use relative path for Vite dev server)
  const checkBackendConnection = async () => {
    try {
      setConnectionStatus('loading');
      const response = await fetch('/health');
      if (response.ok) {
        setConnectionStatus('connected');
        setError(null);
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      setError('Cannot connect to local backend server. Make sure the server is running.');
    }
  };

  // Mock context extraction for demo (in real extension this would come from content script)
  const refreshContext = async () => {
    try {
      // Simulate context extraction
      const mockContext: PageContext = {
        title: "OpenAI API Documentation",
        url: "https://docs.openai.com/api",
        meta_description: "Comprehensive guide to OpenAI API endpoints and usage",
        headings: [
          { level: 1, text: "Getting Started" },
          { level: 2, text: "Authentication" },
          { level: 2, text: "Making Requests" },
          { level: 2, text: "Rate Limits" }
        ],
        actions: [
          { text: "Sign Up", type: "button" },
          { text: "View Examples", type: "link", href: "/examples" },
          { text: "API Reference", type: "link", href: "/reference" },
          { text: "Download SDK", type: "button" }
        ],
        forms: [
          {
            action: "/login",
            method: "POST", 
            inputs: [
              { type: "email", name: "email", placeholder: "Email", required: true },
              { type: "password", name: "password", placeholder: "Password", required: true }
            ]
          }
        ],
        selected_text: "API keys are used for authentication and should be kept secure.",
        extracted_at: new Date().toISOString(),
        extraction_time: 45
      };
      
      setPageContext(mockContext);
      toast({
        title: "Context refreshed",
        description: "Page context has been updated successfully."
      });
    } catch (error) {
      console.error('Failed to extract page context:', error);
      setError('Failed to extract page context');
    }
  };

  // Submit question to backend
  const submitQuestion = async () => {
    if (!question.trim() || !pageContext) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          context: pageContext
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      const newHistoryItem: ConversationItem = {
        question: question,
        answer: data.answer,
        timestamp: new Date().toISOString()
      };

      setAnswer(data.answer);
      setQuestion('');
      setConversationHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);

      toast({
        title: "Question answered",
        description: "Got response from AI assistant."
      });

    } catch (error) {
      console.error('Failed to submit question:', error);
      setError('Failed to get response from backend. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy answer to clipboard
  const copyAnswer = async () => {
    if (answer) {
      try {
        await navigator.clipboard.writeText(answer);
        toast({
          title: "Answer copied",
          description: "Answer has been copied to clipboard."
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Failed to copy answer to clipboard.",
          variant: "destructive"
        });
      }
    }
  };

  // Clear conversation history
  const clearHistory = () => {
    setConversationHistory([]);
    toast({
      title: "History cleared",
      description: "Conversation history has been cleared."
    });
  };

  // Format time relative to now
  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  // Initialize
  useEffect(() => {
    checkBackendConnection();
    refreshContext();
  }, []);

  // Handle Enter key in textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitQuestion();
    }
  };

  return (
    <div className="w-[400px] h-screen bg-white border-l border-gray-200 flex flex-col font-roboto">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-chrome-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/src/assets/arkangel-wings-logo.png" 
                alt="ArkAngel Wings Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-medium text-chrome-dark">ArkAngel</h1>
              <p className="text-xs text-chrome-gray">Ask questions about this page</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-chrome-success animate-pulse' :
              connectionStatus === 'loading' ? 'bg-yellow-500 animate-spin' :
              'bg-chrome-error'
            }`} />
            <span className={`text-xs ${
              connectionStatus === 'connected' ? 'text-chrome-success' :
              connectionStatus === 'loading' ? 'text-yellow-600' :
              'text-chrome-error'
            }`}>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'loading' ? 'Connecting...' :
               'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Page Context Section */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-chrome-dark">Page Context</h2>
            <Button 
              size="sm"
              onClick={refreshContext}
              className="h-6 px-3 text-xs bg-chrome-blue hover:bg-blue-600"
              data-testid="button-refresh-context"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>

          {pageContext ? (
            <div className="space-y-3">
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-chrome-gray">Title:</span>
                      <span className="text-chrome-dark font-mono text-right max-w-48 truncate" data-testid="text-page-title">
                        {pageContext.title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-chrome-gray">URL:</span>
                      <span className="text-chrome-dark font-mono text-right max-w-48 truncate" data-testid="text-page-url">
                        {pageContext.url}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-chrome-gray">Headings:</span>
                      <span className="text-chrome-dark text-right" data-testid="text-headings-count">
                        {pageContext.headings.length} found
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-chrome-gray">Actions:</span>
                      <span className="text-chrome-dark text-right" data-testid="text-actions-count">
                        {pageContext.actions.length} buttons/links
                      </span>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <Collapsible open={isJsonExpanded} onOpenChange={setIsJsonExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-between text-xs p-0 h-auto text-chrome-blue hover:text-blue-600"
                        data-testid="button-toggle-json"
                      >
                        View Full Context
                        <ChevronDown className={`w-3 h-3 transition-transform ${isJsonExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-chrome-dark text-chrome-light text-xs p-3 rounded-md overflow-x-auto font-mono" data-testid="text-context-json">
                        <pre>{JSON.stringify(pageContext, null, 2)}</pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              {pageContext.selected_text && (
                <div className="p-2 bg-blue-50 rounded-md border border-blue-200" data-testid="text-selected-content">
                  <div className="flex items-start space-x-2">
                    <Quote className="text-chrome-blue w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-chrome-blue font-medium">Selected Text:</p>
                      <p className="text-xs text-chrome-dark italic mt-1">
                        "{pageContext.selected_text}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-chrome-gray">Loading page context...</p>
            </div>
          )}
        </div>

        {/* Question Input Section */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-chrome-dark mb-3">Ask a Question</h2>
          
          <div className="space-y-3">
            <Textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What would you like to know about this page?"
              className="resize-none text-sm"
              rows={3}
              data-testid="input-question"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-chrome-gray">
                <AlertCircle className="w-3 h-3" />
                <span>Context will be included automatically</span>
              </div>
              
              <Button 
                onClick={submitQuestion}
                disabled={!question.trim() || isLoading}
                size="sm"
                className="bg-chrome-blue hover:bg-blue-600"
                data-testid="button-submit-question"
              >
                {isLoading ? (
                  <Spinner className="w-3 h-3 mr-2" />
                ) : (
                  <Send className="w-3 h-3 mr-2" />
                )}
                Ask
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-chrome-dark mb-3">Answer</h2>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg" data-testid="status-loading">
              <Spinner className="w-4 h-4" />
              <span className="text-sm text-chrome-gray">Processing your question...</span>
            </div>
          </div>
        )}

        {/* Answer Display */}
        {answer && !isLoading && (
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-chrome-dark mb-3">Answer</h2>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3" data-testid="text-answer">
                  <div className="w-6 h-6 bg-chrome-success rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-chrome-dark leading-relaxed">
                      {answer}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-chrome-gray">
                        <span>Response time: &lt;200ms</span>
                        <span>{formatTime(new Date().toISOString())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-3 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyAnswer}
                className="text-xs text-chrome-blue hover:text-blue-600"
                data-testid="button-copy-answer"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Answer
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 border-b border-gray-100">
            <Card className="border-chrome-error" data-testid="status-error">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-chrome-error rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-chrome-error">Connection Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <div className="mt-3 flex space-x-3">
                      <Button 
                        size="sm"
                        onClick={checkBackendConnection}
                        className="bg-chrome-error hover:bg-red-600 text-xs"
                        data-testid="button-retry-connection"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-chrome-dark">Recent Questions</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearHistory}
                className="text-xs text-chrome-gray hover:text-chrome-blue h-auto p-0"
                data-testid="button-clear-history"
              >
                Clear
              </Button>
            </div>

            <div className="space-y-3">
              {conversationHistory.map((item, index) => (
                <Card key={index} className="bg-gray-50 border-gray-100" data-testid={`card-history-${index}`}>
                  <CardContent className="p-3">
                    <p className="text-xs text-chrome-dark font-medium mb-1">
                      Q: {item.question}
                    </p>
                    <p className="text-xs text-chrome-gray mb-2">
                      A: {item.answer.slice(0, 100)}{item.answer.length > 100 ? '...' : ''}
                    </p>
                    <span className="text-xs text-chrome-gray">
                      {formatTime(item.timestamp)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-chrome-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-xs text-chrome-gray hover:text-chrome-blue h-auto p-0">
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-chrome-gray hover:text-chrome-blue h-auto p-0">
              <HelpCircle className="w-3 h-3 mr-1" />
              Help
            </Button>
          </div>
          <div className="text-xs text-chrome-gray">v1.0.0</div>
        </div>
      </div>
    </div>
  );
}
