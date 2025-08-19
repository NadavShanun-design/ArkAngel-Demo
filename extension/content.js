// Content script for extracting page context
(() => {
    'use strict';

    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractContext') {
            try {
                const context = extractPageContext();
                sendResponse({ success: true, context });
            } catch (error) {
                console.error('Error extracting context:', error);
                sendResponse({ success: false, error: error.message });
            }
        }
        return true; // Keep message channel open for async response
    });

    function extractPageContext() {
        const startTime = performance.now();
        
        try {
            // Extract basic page info
            const title = document.title || '';
            const url = window.location.href;
            const metaDescription = document.querySelector('meta[name="description"]')?.content || '';

            // Extract headings (limit to first 10 for performance)
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                .slice(0, 10)
                .map(h => ({
                    level: parseInt(h.tagName.charAt(1)),
                    text: h.textContent.trim()
                }))
                .filter(h => h.text.length > 0 && h.text.length < 200);

            // Extract actionable elements (buttons, links with meaningful text)
            const actions = Array.from(document.querySelectorAll('button, a[href], [role="button"], input[type="submit"], input[type="button"]'))
                .slice(0, 20)
                .map(el => {
                    const text = (el.textContent || el.value || el.getAttribute('aria-label') || '').trim();
                    const href = el.href || null;
                    return {
                        text: text.slice(0, 50),
                        type: el.tagName.toLowerCase() === 'button' || el.type === 'button' || el.type === 'submit' ? 'button' : 'link',
                        href: href
                    };
                })
                .filter(action => action.text.length > 0 && action.text.length > 2);

            // Extract form information
            const forms = Array.from(document.querySelectorAll('form'))
                .slice(0, 5)
                .map(form => {
                    const inputs = Array.from(form.querySelectorAll('input, select, textarea'))
                        .map(input => ({
                            type: input.type || input.tagName.toLowerCase(),
                            name: input.name || '',
                            placeholder: input.placeholder || '',
                            required: input.required
                        }));

                    return {
                        action: form.action || window.location.href,
                        method: form.method || 'GET',
                        inputs: inputs
                    };
                });

            // Get currently selected text
            const selectedText = window.getSelection().toString().trim();

            // Extract some visible text content (first few paragraphs)
            const paragraphs = Array.from(document.querySelectorAll('p'))
                .slice(0, 5)
                .map(p => p.textContent.trim())
                .filter(text => text.length > 20 && text.length < 500);

            const context = {
                title,
                url,
                meta_description: metaDescription,
                headings,
                actions,
                forms,
                selected_text: selectedText,
                paragraphs,
                extracted_at: new Date().toISOString(),
                extraction_time: Math.round(performance.now() - startTime)
            };

            return context;

        } catch (error) {
            console.error('Error in extractPageContext:', error);
            throw error;
        }
    }

    // Auto-extract context when page loads and send to background script
    function autoExtractContext() {
        try {
            const context = extractPageContext();
            chrome.runtime.sendMessage({
                action: 'contextExtracted',
                context: context,
                tabId: null // Will be set by background script
            });
        } catch (error) {
            console.error('Auto context extraction failed:', error);
        }
    }

    // Extract context after page load with a small delay
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(autoExtractContext, 1000);
        });
    } else {
        setTimeout(autoExtractContext, 1000);
    }

    // Re-extract context when selection changes (with debouncing)
    let selectionTimeout;
    document.addEventListener('selectionchange', () => {
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText.length > 0) {
                chrome.runtime.sendMessage({
                    action: 'selectionChanged',
                    selectedText: selectedText
                });
            }
        }, 500);
    });

})();
