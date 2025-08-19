// Background script for Chrome extension
(() => {
    'use strict';

    let currentContext = null;
    let currentTabId = null;

    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
        console.log('ArkAngel extension installed');
        
        // Set up default settings
        chrome.storage.local.set({
            backendUrl: 'http://localhost:3000',
            autoExtract: true,
            showNotifications: true
        });
    });

    // Handle tab activation
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        currentTabId = activeInfo.tabId;
        
        // Enable side panel for the current tab
        await chrome.sidePanel.setOptions({
            tabId: activeInfo.tabId,
            enabled: true
        });

        // Clear current context when switching tabs
        currentContext = null;
    });

    // Handle tab updates (navigation)
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            currentTabId = tabId;
            currentContext = null;

            // Enable side panel for the updated tab
            await chrome.sidePanel.setOptions({
                tabId: tabId,
                enabled: true
            });
        }
    });

    // Handle action button click
    chrome.action.onClicked.addListener(async (tab) => {
        // Open side panel
        await chrome.sidePanel.open({ tabId: tab.id });
    });

    // Handle messages from content scripts and side panel
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'contextExtracted':
                handleContextExtracted(request, sender);
                break;
                
            case 'selectionChanged':
                handleSelectionChanged(request, sender);
                break;
                
            case 'getContext':
                sendResponse({ context: currentContext });
                break;
                
            case 'extractContext':
                extractContextFromTab(sender.tab?.id || currentTabId)
                    .then(context => sendResponse({ success: true, context }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true; // Keep message channel open
                
            default:
                console.log('Unknown message action:', request.action);
        }
    });

    function handleContextExtracted(request, sender) {
        if (sender.tab && sender.tab.id === currentTabId) {
            currentContext = {
                ...request.context,
                tabId: sender.tab.id,
                tabUrl: sender.tab.url
            };
            
            console.log('Context extracted for tab:', sender.tab.id);
        }
    }

    function handleSelectionChanged(request, sender) {
        if (sender.tab && sender.tab.id === currentTabId && currentContext) {
            currentContext.selected_text = request.selectedText;
            console.log('Selection updated:', request.selectedText.slice(0, 50));
        }
    }

    async function extractContextFromTab(tabId) {
        if (!tabId) {
            throw new Error('No active tab');
        }

        try {
            // Check if we can access the tab
            const tab = await chrome.tabs.get(tabId);
            
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot access chrome:// or extension pages');
            }

            // Execute content script to extract context
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    // This function runs in the page context
                    function extractPageContext() {
                        const title = document.title || '';
                        const url = window.location.href;
                        const metaDescription = document.querySelector('meta[name="description"]')?.content || '';

                        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                            .slice(0, 10)
                            .map(h => ({
                                level: parseInt(h.tagName.charAt(1)),
                                text: h.textContent.trim()
                            }))
                            .filter(h => h.text.length > 0);

                        const actions = Array.from(document.querySelectorAll('button, a[href], [role="button"]'))
                            .slice(0, 20)
                            .map(el => ({
                                text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 50),
                                type: el.tagName.toLowerCase() === 'button' ? 'button' : 'link'
                            }))
                            .filter(action => action.text.length > 0);

                        const forms = Array.from(document.querySelectorAll('form'))
                            .slice(0, 5)
                            .map(form => ({
                                action: form.action || window.location.href,
                                method: form.method || 'GET',
                                inputs: Array.from(form.querySelectorAll('input, select, textarea'))
                                    .map(input => input.type || input.tagName.toLowerCase())
                            }));

                        const selectedText = window.getSelection().toString().trim();

                        return {
                            title,
                            url,
                            meta_description: metaDescription,
                            headings,
                            actions,
                            forms,
                            selected_text: selectedText,
                            extracted_at: new Date().toISOString()
                        };
                    }

                    return extractPageContext();
                }
            });

            if (results && results[0] && results[0].result) {
                const context = results[0].result;
                currentContext = {
                    ...context,
                    tabId: tabId,
                    tabUrl: tab.url
                };
                return context;
            } else {
                throw new Error('Failed to extract context');
            }

        } catch (error) {
            console.error('Error extracting context from tab:', error);
            throw error;
        }
    }

    // Periodically check backend connection
    async function checkBackendHealth() {
        try {
            const settings = await chrome.storage.local.get(['backendUrl']);
            const backendUrl = settings.backendUrl || 'http://localhost:3000';
            
            const response = await fetch(`${backendUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                console.log('Backend is healthy');
            } else {
                console.warn('Backend health check failed:', response.status);
            }
        } catch (error) {
            console.warn('Backend not reachable:', error.message);
        }
    }

    // Check backend health every 30 seconds
    setInterval(checkBackendHealth, 30000);

    // Initial health check
    setTimeout(checkBackendHealth, 2000);

})();
