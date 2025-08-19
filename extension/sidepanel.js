class SidePanelApp {
    constructor() {
        this.state = {
            pageContext: null,
            question: '',
            answer: null,
            isLoading: false,
            isJsonExpanded: false,
            connectionStatus: 'disconnected',
            error: null,
            conversationHistory: []
        };

        this.init();
    }

    async init() {
        this.render();
        this.bindEvents();
        await this.checkBackendConnection();
        await this.refreshContext();
    }

    async checkBackendConnection() {
        try {
            const response = await fetch('http://localhost:5000/health');
            if (response.ok) {
                this.updateState({ connectionStatus: 'connected', error: null });
            } else {
                throw new Error('Backend not responding');
            }
        } catch (error) {
            this.updateState({ 
                connectionStatus: 'disconnected',
                error: 'Cannot connect to local backend server. Make sure the server is running on http://localhost:5000'
            });
        }
    }

    async refreshContext() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: this.extractPageContext
            });

            if (results && results[0] && results[0].result) {
                this.updateState({ pageContext: results[0].result });
            }
        } catch (error) {
            console.error('Failed to extract page context:', error);
            this.updateState({ error: 'Failed to extract page context' });
        }
    }

    extractPageContext() {
        try {
            const context = {
                title: document.title,
                url: window.location.href,
                meta_description: document.querySelector('meta[name="description"]')?.content || '',
                headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                    .slice(0, 10)
                    .map(h => h.textContent.trim())
                    .filter(text => text.length > 0),
                actions: Array.from(document.querySelectorAll('button, a[href], [role="button"]'))
                    .slice(0, 20)
                    .map(el => ({
                        text: el.textContent.trim().slice(0, 50),
                        type: el.tagName.toLowerCase() === 'button' ? 'button' : 'link'
                    }))
                    .filter(action => action.text.length > 0),
                selected_text: window.getSelection().toString().trim(),
                forms: Array.from(document.querySelectorAll('form'))
                    .slice(0, 5)
                    .map(form => ({
                        action: form.action,
                        method: form.method,
                        inputs: Array.from(form.querySelectorAll('input, select, textarea'))
                            .map(input => input.type || input.tagName.toLowerCase())
                    }))
            };

            return context;
        } catch (error) {
            console.error('Error extracting context:', error);
            return null;
        }
    }

    async submitQuestion() {
        if (!this.state.question.trim() || !this.state.pageContext) {
            return;
        }

        this.updateState({ isLoading: true, error: null });

        try {
            const response = await fetch('http://localhost:5000/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: this.state.question,
                    context: this.state.pageContext
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            
            const newHistoryItem = {
                question: this.state.question,
                answer: data.answer,
                timestamp: new Date().toISOString()
            };

            this.updateState({
                answer: data.answer,
                question: '',
                isLoading: false,
                conversationHistory: [newHistoryItem, ...this.state.conversationHistory.slice(0, 9)]
            });

        } catch (error) {
            console.error('Failed to submit question:', error);
            this.updateState({
                isLoading: false,
                error: 'Failed to get response from backend. Please check if the server is running.'
            });
        }
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="refresh-context"]')) {
                this.refreshContext();
            } else if (e.target.matches('[data-action="toggle-json"]')) {
                this.updateState({ isJsonExpanded: !this.state.isJsonExpanded });
            } else if (e.target.matches('[data-action="submit-question"]')) {
                this.submitQuestion();
            } else if (e.target.matches('[data-action="retry-connection"]')) {
                this.checkBackendConnection();
            } else if (e.target.matches('[data-action="clear-history"]')) {
                this.updateState({ conversationHistory: [] });
            } else if (e.target.matches('[data-action="copy-answer"]')) {
                if (this.state.answer) {
                    navigator.clipboard.writeText(this.state.answer);
                }
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.matches('[data-field="question"]')) {
                this.updateState({ question: e.target.value });
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.matches('[data-field="question"]') && e.key === 'Enter' && e.ctrlKey) {
                this.submitQuestion();
            }
        });
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }

    render() {
        const root = document.getElementById('root');
        root.innerHTML = `
            <div class="side-panel-container">
                <!-- Header -->
                <div class="panel-header">
                    <div class="header-content">
                        <div class="brand">
                            <div class="brand-icon">
                                <img src="arkangel-wings-logo.png" alt="ArkAngel Wings Logo" class="brand-logo-img">
                            </div>
                            <div class="brand-text">
                                <h1>ArkAngel</h1>
                                <p>Ask questions about this page</p>
                            </div>
                        </div>
                        <div class="connection-status ${this.state.connectionStatus}">
                            <div class="status-dot"></div>
                            <span>${this.state.connectionStatus === 'connected' ? 'Connected' : 'Offline'}</span>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="main-content">
                    <!-- Page Context -->
                    <div class="section">
                        <div class="section-header">
                            <h2>Page Context</h2>
                            <button class="btn-refresh" data-action="refresh-context" data-testid="button-refresh-context">
                                <i class="fas fa-refresh"></i>
                                <span>Refresh</span>
                            </button>
                        </div>

                        ${this.state.pageContext ? `
                            <div class="context-card">
                                <div class="context-summary">
                                    <div class="context-item">
                                        <span class="label">Title:</span>
                                        <span class="value" data-testid="text-page-title">${this.state.pageContext.title || 'No title'}</span>
                                    </div>
                                    <div class="context-item">
                                        <span class="label">URL:</span>
                                        <span class="value" data-testid="text-page-url">${this.state.pageContext.url}</span>
                                    </div>
                                    <div class="context-item">
                                        <span class="label">Headings:</span>
                                        <span class="value" data-testid="text-headings-count">${this.state.pageContext.headings.length} found</span>
                                    </div>
                                    <div class="context-item">
                                        <span class="label">Actions:</span>
                                        <span class="value" data-testid="text-actions-count">${this.state.pageContext.actions.length} buttons/links</span>
                                    </div>
                                </div>

                                <div class="json-toggle">
                                    <button class="toggle-btn" data-action="toggle-json" data-testid="button-toggle-json">
                                        <span>View Full Context</span>
                                        <i class="fas fa-chevron-down ${this.state.isJsonExpanded ? 'expanded' : ''}"></i>
                                    </button>
                                    
                                    ${this.state.isJsonExpanded ? `
                                        <div class="json-viewer" data-testid="text-context-json">
                                            <pre>${JSON.stringify(this.state.pageContext, null, 2)}</pre>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>

                            ${this.state.pageContext.selected_text ? `
                                <div class="selected-text" data-testid="text-selected-content">
                                    <div class="selected-text-content">
                                        <i class="fas fa-quote-left"></i>
                                        <div>
                                            <p class="label">Selected Text:</p>
                                            <p class="text">"${this.state.pageContext.selected_text}"</p>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        ` : `
                            <div class="context-loading">
                                <p>Loading page context...</p>
                            </div>
                        `}
                    </div>

                    <!-- Question Input -->
                    <div class="section">
                        <h2>Ask a Question</h2>
                        
                        <div class="question-form">
                            <textarea 
                                class="question-input"
                                placeholder="What would you like to know about this page?"
                                data-field="question"
                                data-testid="input-question"
                                rows="3"
                            >${this.state.question}</textarea>

                            <div class="form-footer">
                                <div class="form-info">
                                    <i class="fas fa-info-circle"></i>
                                    <span>Context will be included automatically</span>
                                </div>
                                
                                <button 
                                    class="btn-submit ${this.state.isLoading ? 'loading' : ''}"
                                    data-action="submit-question"
                                    data-testid="button-submit-question"
                                    ${!this.state.question.trim() || this.state.isLoading ? 'disabled' : ''}
                                >
                                    <i class="fas fa-paper-plane"></i>
                                    <span>Ask</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Answer Display -->
                    ${this.state.isLoading ? `
                        <div class="section">
                            <h2>Answer</h2>
                            <div class="loading-state" data-testid="status-loading">
                                <div class="spinner"></div>
                                <span>Processing your question...</span>
                            </div>
                        </div>
                    ` : ''}

                    ${this.state.answer ? `
                        <div class="section">
                            <h2>Answer</h2>
                            <div class="answer-card" data-testid="text-answer">
                                <div class="answer-content">
                                    <div class="answer-icon">
                                        <i class="fas fa-check"></i>
                                    </div>
                                    <div class="answer-text">
                                        <p>${this.state.answer}</p>
                                        <div class="answer-meta">
                                            <span>Response time: <200ms</span>
                                            <span>${this.formatTime(new Date())}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="answer-actions">
                                <button class="btn-copy" data-action="copy-answer" data-testid="button-copy-answer">
                                    <i class="fas fa-copy"></i>
                                    <span>Copy Answer</span>
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Error Display -->
                    ${this.state.error ? `
                        <div class="section">
                            <div class="error-card" data-testid="status-error">
                                <div class="error-content">
                                    <div class="error-icon">
                                        <i class="fas fa-exclamation-triangle"></i>
                                    </div>
                                    <div class="error-text">
                                        <h3>Connection Error</h3>
                                        <p>${this.state.error}</p>
                                        <div class="error-actions">
                                            <button class="btn-retry" data-action="retry-connection" data-testid="button-retry-connection">
                                                <i class="fas fa-redo"></i>
                                                Retry
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Conversation History -->
                    ${this.state.conversationHistory.length > 0 ? `
                        <div class="section">
                            <div class="section-header">
                                <h2>Recent Questions</h2>
                                <button class="btn-clear" data-action="clear-history" data-testid="button-clear-history">Clear</button>
                            </div>

                            <div class="history-list">
                                ${this.state.conversationHistory.map((item, index) => `
                                    <div class="history-item" data-testid="card-history-${index}">
                                        <p class="history-question">Q: ${item.question}</p>
                                        <p class="history-answer">A: ${item.answer.slice(0, 100)}${item.answer.length > 100 ? '...' : ''}</p>
                                        <span class="history-time">${this.formatTime(item.timestamp)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="panel-footer">
                    <div class="footer-content">
                        <div class="footer-links">
                            <button class="footer-link">
                                <i class="fas fa-cog"></i>
                                <span>Settings</span>
                            </button>
                            <button class="footer-link">
                                <i class="fas fa-question-circle"></i>
                                <span>Help</span>
                            </button>
                        </div>
                        <div class="version">v1.0.0</div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SidePanelApp();
});
