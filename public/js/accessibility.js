/**
 * Accessibility features implementation for MyBidhaa
 * Features include:
 * - Screen reader
 * - Screen magnifier
 * - High contrast mode
 * - Font size adjuster
 * - Keyboard navigation
 * - Readable font
 */
class Accessibility {
    constructor() {
        this.features = {
            screenReader: false,
            magnifier: false,
            highContrast: false,
            largeText: false,
            keyboardNav: false,
            readableFont: false
        };
        
        this.magnifierSettings = {
            scale: 1.5,
            size: 150,
            active: false
        };
        
        this.initElements();
        this.loadUserPreferences();
        this.attachEventListeners();
    }
    
    initElements() {
        // Create magnifier element if it doesn't exist yet
        if (!document.querySelector('.screen-magnifier')) {
            this.magnifierEl = document.createElement('div');
            this.magnifierEl.className = 'screen-magnifier';
            this.magnifierEl.style.cssText = `
                position: fixed;
                border-radius: 50%;
                width: ${this.magnifierSettings.size}px;
                height: ${this.magnifierSettings.size}px;
                border: 2px solid #622c84;
                pointer-events: none;
                overflow: hidden;
                z-index: 99999;
                display: none;
                background-color: white;
                background-repeat: no-repeat;
                box-shadow: 0 0 10px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(this.magnifierEl);
        } else {
            this.magnifierEl = document.querySelector('.screen-magnifier');
        }
        
        // Create screen reader announcement area
        if (!document.querySelector('.sr-announcer')) {
            this.announcerEl = document.createElement('div');
            this.announcerEl.setAttribute('aria-live', 'assertive');
            this.announcerEl.setAttribute('role', 'status');
            this.announcerEl.className = 'sr-announcer';
            this.announcerEl.style.cssText = `
                position: absolute;
                width: 1px;
                height: 1px;
                margin: -1px;
                padding: 0;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                border: 0;
            `;
            document.body.appendChild(this.announcerEl);
        } else {
            this.announcerEl = document.querySelector('.sr-announcer');
        }
        
        // Create TTS engine
        this.speechSynthesis = window.speechSynthesis;
        this.voices = [];
        
        if (this.speechSynthesis) {
            // Load voices
            this.speechSynthesis.onvoiceschanged = () => {
                this.voices = this.speechSynthesis.getVoices();
                console.log('Screen reader: Loaded', this.voices.length, 'voices');
            };
            
            // Initial voice load attempt
            this.voices = this.speechSynthesis.getVoices();
        }
    }
    
    loadUserPreferences() {
        try {
            const savedPrefs = localStorage.getItem('accessibility');
            if (savedPrefs) {
                this.features = JSON.parse(savedPrefs);
                this.applySettings();
            }
            
            // Update UI buttons to match loaded preferences
            this.updateButtonStates();
        } catch (e) {
            console.error('Failed to load accessibility preferences', e);
        }
    }
    
    updateButtonStates() {
        // Update UI to match current state
        Object.keys(this.features).forEach(feature => {
            const button = document.querySelector(`[data-accessibility="${feature}"]`);
            if (button) {
                button.setAttribute('aria-pressed', this.features[feature]);
                button.classList.toggle('active', this.features[feature]);
            }
        });
    }
    
    saveUserPreferences() {
        try {
            localStorage.setItem('accessibility', JSON.stringify(this.features));
        } catch (e) {
            console.error('Failed to save accessibility preferences', e);
        }
    }
    
    attachEventListeners() {
        // Toggle buttons
        document.querySelectorAll('[data-accessibility]').forEach(button => {
            const feature = button.getAttribute('data-accessibility');
            
            button.addEventListener('click', () => {
                this.toggleFeature(feature);
                button.setAttribute('aria-pressed', this.features[feature]);
                button.classList.toggle('active', this.features[feature]);
                
                // Announce the change
                const state = this.features[feature] ? 'enabled' : 'disabled';
                this.announce(`${feature.replace(/([A-Z])/g, ' $1')} ${state}`);
            });
            
            // Set initial state
            button.setAttribute('aria-pressed', this.features[feature]);
            button.classList.toggle('active', this.features[feature]);
        });
        
        // Magnifier mouse events
        if (this.magnifierEl) {
            document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }
        
        // Handle focus events for screen reader
        document.addEventListener('focusin', this.handleFocus.bind(this));
        
        // Handle clicks for screen reader
        document.addEventListener('click', this.handleClick.bind(this));
    }
    
    toggleFeature(feature) {
        if (this.features.hasOwnProperty(feature)) {
            this.features[feature] = !this.features[feature];
            this.saveUserPreferences();
            this.applySettings();
            return true;
        }
        return false;
    }
    
    applySettings() {
        // Apply high contrast
        document.body.classList.toggle('high-contrast-mode', this.features.highContrast);
        
        // Apply large text
        document.body.classList.toggle('large-text-mode', this.features.largeText);
        
        // Apply keyboard navigation
        document.body.classList.toggle('keyboard-nav-mode', this.features.keyboardNav);
        
        // Apply readable font
        document.body.classList.toggle('readable-font-mode', this.features.readableFont);
        
        // Set magnifier active state
        this.magnifierSettings.active = this.features.magnifier;
        
        // Make magnifier visible/hidden based on current setting
        if (!this.features.magnifier) {
            this.magnifierEl.style.display = 'none';
        }
        
        console.log('Accessibility settings applied:', this.features);
    }
    
    // Screen Reader Methods
    announce(message) {
        if (!this.features.screenReader) return;
        
        // Update the live region
        this.announcerEl.textContent = message;
        
        // If speech synthesis is available, use it
        if (this.speechSynthesis && !this.speechSynthesis.speaking) {
            const utterance = new SpeechSynthesisUtterance(message);
            
            // Use a preferred voice if available
            if (this.voices.length > 0) {
                // Try to find an English voice
                const englishVoice = this.voices.find(voice => 
                    voice.lang.startsWith('en')
                );
                if (englishVoice) utterance.voice = englishVoice;
            }
            
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            
            this.speechSynthesis.speak(utterance);
        }
    }
    
    handleFocus(event) {
        if (!this.features.screenReader) return;
        
        const target = event.target;
        
        // Extract text to announce
        let textToAnnounce = '';
        
        // For form elements, announce their type and label
        if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) {
            // Get element type
            const type = target.tagName === 'INPUT' ? target.type : target.tagName.toLowerCase();
            
            // Try to find an associated label
            let labelText = '';
            if (target.id) {
                const label = document.querySelector(`label[for="${target.id}"]`);
                if (label) labelText = label.textContent.trim();
            }
            
            // For buttons, use their text content
            if (target.tagName === 'BUTTON' || (target.tagName === 'INPUT' && target.type === 'button')) {
                labelText = target.textContent || target.value || '';
            }
            
            textToAnnounce = `${type} ${labelText}: ${target.value || ''}`;
        } 
        // For links, announce the linked text and destination
        else if (target.tagName === 'A') {
            textToAnnounce = `Link: ${target.textContent.trim() || 'unnamed link'}`;
        }
        // For other elements with text content
        else if (target.textContent) {
            textToAnnounce = target.textContent.trim();
        }
        
        if (textToAnnounce) {
            this.announce(textToAnnounce);
        }
    }
    
    handleClick(event) {
        if (!this.features.screenReader) return;
        
        const target = event.target;
        
        // Skip if element already gets focus event
        if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'].includes(target.tagName)) {
            return;
        }
        
        // Read clicked text content
        if (target.textContent) {
            this.announce(`Clicked: ${target.textContent.trim()}`);
        }
    }
    
    // Screen Magnifier Methods
    handleMouseMove(event) {
        if (!this.features.magnifier) return;
        
        const { clientX, clientY } = event;
        
        // Position the magnifier at the mouse
        const magnifierSize = this.magnifierSettings.size;
        this.magnifierEl.style.left = `${clientX - magnifierSize / 2}px`;
        this.magnifierEl.style.top = `${clientY - magnifierSize / 2}px`;
        
        // Make sure the magnifier is visible
        if (this.magnifierEl.style.display === 'none') {
            this.magnifierEl.style.display = 'block';
        }
        
        // Get what's under the mouse
        const elemBelow = document.elementFromPoint(clientX, clientY);
        if (!elemBelow) return;
        
        // Create a magnification effect
        try {
            // Get the page coordinates
            const rect = elemBelow.getBoundingClientRect();
            const scale = this.magnifierSettings.scale;
            
            // Create a snapshot of the content under the magnifier
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            // Apply the magnified view
            this.magnifierEl.style.backgroundImage = `none`;
            this.magnifierEl.innerHTML = ''; // Clear any previous content
            
            // Clone the element for magnification
            const clone = elemBelow.cloneNode(true);
            clone.style.transform = `scale(${scale})`;
            clone.style.transformOrigin = `${x}px ${y}px`;
            clone.style.position = 'absolute';
            clone.style.top = `-${y * (scale - 1)}px`;
            clone.style.left = `-${x * (scale - 1)}px`;
            clone.style.width = '100%';
            clone.style.height = '100%';
            
            this.magnifierEl.appendChild(clone);
        } catch (e) {
            console.error('Magnifier error:', e);
        }
    }
}

// Initialize accessibility features when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize accessibility features
    const screenReaderBtn = document.getElementById('screenReaderBtn');
    const magnifierBtn = document.getElementById('magnifierBtn');
    const highContrastBtn = document.getElementById('highContrastBtn');
    const largeTextBtn = document.getElementById('largeTextBtn');

    // Screen Reader functionality
    screenReaderBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        document.body.classList.toggle('screen-reader-mode');
        
        if (this.classList.contains('active')) {
            // Add ARIA live regions and roles
            document.querySelectorAll('article, section').forEach(element => {
                element.setAttribute('aria-live', 'polite');
            });
        } else {
            // Remove ARIA live regions
            document.querySelectorAll('[aria-live]').forEach(element => {
                element.removeAttribute('aria-live');
            });
        }
    });

    // Magnifier functionality
    let magnifierActive = false;
    let magnifier = null;

    magnifierBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        magnifierActive = !magnifierActive;

        if (magnifierActive) {
            // Create magnifier
            magnifier = document.createElement('div');
            magnifier.className = 'magnifier';
            document.body.appendChild(magnifier);

            document.addEventListener('mousemove', handleMagnifier);
        } else {
            // Remove magnifier
            if (magnifier) {
                document.body.removeChild(magnifier);
                document.removeEventListener('mousemove', handleMagnifier);
            }
        }
    });

    function handleMagnifier(e) {
        if (!magnifierActive || !magnifier) return;

        const x = e.clientX;
        const y = e.clientY;
        const size = 150; // Size of the magnifier

        magnifier.style.left = (x - size/2) + 'px';
        magnifier.style.top = (y - size/2) + 'px';
        magnifier.style.transform = `scale(1.5)`;
    }

    // High Contrast functionality
    highContrastBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        document.body.classList.toggle('high-contrast');
        
        if (document.body.classList.contains('high-contrast')) {
            // Apply high contrast styles
            document.documentElement.style.setProperty('--text-color', '#ffffff');
            document.documentElement.style.setProperty('--background-color', '#000000');
            document.documentElement.style.setProperty('--link-color', '#ffff00');
        } else {
            // Reset to default styles
            document.documentElement.style.setProperty('--text-color', '');
            document.documentElement.style.setProperty('--background-color', '');
            document.documentElement.style.setProperty('--link-color', '');
        }
    });

    // Large Text functionality
    largeTextBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        document.body.classList.toggle('large-text');
        
        if (document.body.classList.contains('large-text')) {
            // Increase font sizes
            document.body.style.fontSize = '120%';
            document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                const currentSize = window.getComputedStyle(heading).fontSize;
                const newSize = parseFloat(currentSize) * 1.2;
                heading.style.fontSize = newSize + 'px';
            });
        } else {
            // Reset font sizes
            document.body.style.fontSize = '';
            document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                heading.style.fontSize = '';
            });
        }
    });

    // Handle skip link
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.focus();
                mainContent.scrollIntoView();
            }
        });
    }
}); 