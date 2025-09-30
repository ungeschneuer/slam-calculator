/**
 * Poetry Slam Punktesummen-Rechner
 * 
 * A comprehensive scoring calculator for Poetry Slam competitions featuring:
 * - Dynamic judge management (3-15 judges)
 * - Intelligent scoring calculation (drops highest/lowest scores)
 * - Offline-first PWA architecture
 * - Dark/light mode support
 * - Comprehensive history tracking
 * - Built-in timer functionality
 * 
 * @class PoetrySlamCalculator
 * @author Marcel Schneuer
 * @version 1.3.0
 */
class PoetrySlamCalculator {
    /**
     * Initialize the Poetry Slam Calculator
     * Sets up all default values and initializes the application
     */
    constructor() {
        // Core configuration
        /** @type {number} Minimum number of judges allowed */
        this.minJudges = 3;
        /** @type {number} Maximum number of judges allowed */
        this.maxJudges = 15;
        /** @type {number} Current number of active judges */
        this.currentJudgeCount = 5;
        
        // Data management
        /** @type {Array} History of all calculations */
        this.history = [];
        /** @type {Object|null} Current calculation result */
        this.currentResult = null;
        /** @type {string} Current view mode: 'list' or 'table' */
        this.currentView = 'list';
        
        // Auto-save functionality
        /** @type {number|null} Timeout ID for auto-save */
        this.autoSaveTimeout = null;
        /** @type {number} Delay before auto-save triggers (in ms) */
        this.autoSaveDelay = 2000; // Increased delay to reduce processing
        
        // Error handling
        /** @type {number} Current error count */
        this.errorCount = 0;
        /** @type {number} Maximum errors before alert */
        this.maxErrors = 5;
        /** @type {Array} Log of all errors */
        this.errorLog = [];
        
        // Timer functionality
        /** @type {number|null} Timer interval ID */
        this.timerInterval = null;
        /** @type {number|null} Timer start timestamp */
        this.timerStartTime = null;
        /** @type {number} Timer duration in milliseconds */
        this.timerDuration = 0;
        /** @type {number} Remaining time in milliseconds */
        this.timerRemaining = 0;
        /** @type {boolean} Timer pause state */
        this.timerPaused = false;
        /** @type {number} Timestamp when timer was paused */
        this.timerPauseTime = 0;
        
        // Performance optimization
        /** @type {number} Last recorded screen width for resize optimization */
        this.lastScreenWidth = window.innerWidth;
        
        this.init();
    }

    /**
     * Initialize the application
     * Sets up all components, event listeners, and loads saved data
     * @throws {Error} If critical initialization fails
     */
    init() {
        try {
            // Load saved data
            this.loadHistory();
            this.loadTheme();
            this.loadViewPreference();
            
            // Setup core functionality
            this.setupEventListeners();
            this.setupDarkMode();
            this.setupErrorHandling();
            this.setupOfflineMonitoring();
            
            // Initialize UI
            this.generateJudgeInputs();
            this.updateJudgeCount();
            this.initializeTooltips();
            
            // Setup PWA features
            this.registerServiceWorker();
            this.setupPWAViewport();
        } catch (error) {
            this.handleError('Initialisierung fehlgeschlagen', error);
        }
    }

    /**
     * Set up all event listeners for the application
     * Includes button clicks, keyboard navigation, and input validation
     * @throws {Error} If critical event listeners fail to attach
     */
    setupEventListeners() {
        try {
            // Core action buttons
            this.safeAddEventListener('addJudge', 'click', () => this.addJudge());
            this.safeAddEventListener('removeJudge', 'click', () => this.removeJudge());
            this.safeAddEventListener('calculateBtn', 'click', () => this.calculateScore());
            this.safeAddEventListener('resetBtn', 'click', () => this.saveAndReset());
            
            // History and data management
            this.safeAddEventListener('clearHistory', 'click', () => this.clearHistory());
            this.safeAddEventListener('viewToggle', 'click', () => this.toggleView());
            this.safeAddEventListener('exportCSV', 'click', () => this.exportCSV());
            this.safeAddEventListener('exportJSON', 'click', () => this.exportJSON());
            
            // UI controls
            this.safeAddEventListener('toggleTheme', 'click', () => this.toggleTheme());
            this.safeAddEventListener('helpButton', 'click', () => this.showHelp());
            
            // Timer functionality
            this.safeAddEventListener('startTimer', 'click', () => this.startTimer());
            this.safeAddEventListener('pauseTimer', 'click', () => this.pauseTimer());
            this.safeAddEventListener('resumeTimer', 'click', () => this.resumeTimer());
            this.safeAddEventListener('stopTimer', 'click', () => this.stopTimer());

        } catch (error) {
            this.handleError('Event Listener Setup fehlgeschlagen', error);
        }

        // Setup specialized event handlers
        this.setupInputListeners();
        this.setupKeyboardListeners();
        this.setupTouchListeners();
    }

    /**
     * Set up input validation and auto-save listeners
     * Handles real-time validation and automatic saving
     */
    setupInputListeners() {
        // Debounced input handler to prevent excessive processing
        let inputTimeout;
        document.addEventListener('input', (e) => {
            try {
                // Clear existing timeout
                clearTimeout(inputTimeout);
                
                if (e.target.classList.contains('judge-input')) {
                    // Only validate input, don't modify it during typing
                    this.validateInput(e.target);
                    
                    // Debounce auto-save to prevent excessive processing
                    inputTimeout = setTimeout(() => {
                        this.triggerAutoSave(e.target);
                    }, 500); // Increased debounce time
                } else if (e.target.id === 'participantName') {
                    // Debounce auto-save for participant name too
                    inputTimeout = setTimeout(() => {
                        this.triggerAutoSave(e.target);
                    }, 500);
                }
            } catch (error) {
                this.handleError('Input Event Handler Fehler', error);
            }
        });
        
        // Handle decimal separator processing on blur (when user finishes typing)
        document.addEventListener('blur', (e) => {
            try {
                if (e.target.classList.contains('judge-input')) {
                    this.limitDecimalPlaces(e.target);
                }
            } catch (error) {
                this.handleError('Blur Event Handler Fehler', error);
            }
        });
    }

    /**
     * Set up keyboard navigation and shortcuts
     * Includes input field navigation and global shortcuts
     */
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            try {
                // Input field navigation
                if (e.target.classList.contains('judge-input')) {
                    if (e.key === 'Enter' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        this.focusNextInput(e.target);
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.focusPreviousInput(e.target);
                    }
                }
                
                // Global keyboard shortcuts
                if (e.ctrlKey || e.metaKey) {
                    this.handleGlobalShortcuts(e);
                } else {
                    this.handleSingleKeyShortcuts(e);
                }
            } catch (error) {
                this.handleError('Keyboard Event Handler Fehler', error);
            }
        });
    }

    /**
     * Handle global keyboard shortcuts (Ctrl/Cmd + key)
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleGlobalShortcuts(e) {
        switch (e.key.toLowerCase()) {
            case 'enter':
                e.preventDefault();
                this.calculateScore();
                break;
            case 's':
                e.preventDefault();
                this.saveAndReset();
                break;
            case 'v':
                e.preventDefault();
                this.toggleView();
                break;
            case 't':
                e.preventDefault();
                this.startTimer();
                break;
            case 'p':
                e.preventDefault();
                if (this.timerInterval) {
                    this.timerPaused ? this.resumeTimer() : this.pauseTimer();
                }
                break;
            case 'h':
                e.preventDefault();
                this.showHelp();
                break;
        }
    }

    /**
     * Handle single key shortcuts (when not typing in inputs)
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleSingleKeyShortcuts(e) {
        // Only trigger when not typing in form controls
        if (e.target.classList.contains('form-control')) return;
        
        switch (e.key.toLowerCase()) {
            case 't':
                e.preventDefault();
                this.startTimer();
                break;
            case 'p':
                e.preventDefault();
                if (this.timerInterval) {
                    this.timerPaused ? this.resumeTimer() : this.pauseTimer();
                }
                break;
            case 's':
                e.preventDefault();
                this.stopTimer();
                break;
            case 'h':
                e.preventDefault();
                this.showHelp();
                break;
        }
    }

    /**
     * Set up touch event listeners for mobile optimization
     * Provides visual feedback for button interactions
     */
    setupTouchListeners() {
        document.addEventListener('touchstart', (e) => {
            try {
                if (e.target.classList.contains('btn')) {
                    e.target.style.transform = 'scale(0.95)';
                }
            } catch (error) {
                this.handleError('Touch Event Fehler', error);
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            try {
                if (e.target.classList.contains('btn')) {
                    setTimeout(() => {
                        e.target.style.transform = '';
                    }, 150);
                }
            } catch (error) {
                this.handleError('Touch Event Fehler', error);
            }
        }, { passive: true });
    }

    /**
     * Set up dark mode detection and automatic theme switching
     * Respects system preferences and listens for changes
     */
    setupDarkMode() {
        // Check for system preference on load
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.setTheme('dark');
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a theme
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Load saved theme from localStorage and apply it
     * Falls back to system preference if no saved theme
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        }
    }

    /**
     * Load saved view preference (list/table) from localStorage
     * Defaults to list view if no preference is saved
     */
    loadViewPreference() {
        const savedView = localStorage.getItem('viewMode');
        if (savedView && ['list', 'table'].includes(savedView)) {
            this.currentView = savedView;
        }
        this.updateView();
    }

    // PWA Service Worker Registrierung
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Service Worker wird automatisch von Vite PWA registriert
                // Service Worker wird von Vite PWA Plugin verwaltet
                
                // Force cache refresh on app load
                this.forceCacheRefresh();
                
                // Listen for service worker updates
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    // Service Worker updated, triggering reload
                    window.location.reload();
                });

            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Force cache refresh for PWA updates
    async forceCacheRefresh() {
        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                // Send message to service worker to skip waiting
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                
                // Clear all caches
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                
                // Cache refresh completed successfully
            }
        } catch (error) {
            console.warn('Cache refresh failed:', error);
        }
    }

    // Manual refresh function for users
    async forceRefresh() {
        try {
            this.showNotification('Aktualisiere App...', 'info');
            
            // Clear all caches
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            
            // Force service worker update
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // Reload the page
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
            
        } catch (error) {
            console.error('Force refresh failed:', error);
            this.showNotification('Aktualisierung fehlgeschlagen', 'error');
        }
    }

    // Update-Benachrichtigung anzeigen
    showUpdateNotification() {
        const updateToast = document.createElement('div');
        updateToast.className = 'toast align-items-center text-white bg-primary border-0 position-fixed top-0 end-0 m-3';
        updateToast.style.zIndex = '9999';
        updateToast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-arrow-clockwise me-2"></i>
                    Neue Version verfügbar! Seite wird aktualisiert...
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        document.body.appendChild(updateToast);
        
        const toast = new bootstrap.Toast(updateToast);
        toast.show();
        
        setTimeout(() => {
            toast.hide();
            document.body.removeChild(updateToast);
        }, 3000);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme icon
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        // Update status bar colors for iOS
        this.updateStatusBarColors(theme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    updateStatusBarColors(theme) {
        const themeColorMeta = document.getElementById('themeColor');
        const statusBarStyleMeta = document.getElementById('statusBarStyle');
        
        if (themeColorMeta && statusBarStyleMeta) {
            if (theme === 'dark') {
                // Dark theme: dark background, light text
                themeColorMeta.setAttribute('content', '#0d1117');
                statusBarStyleMeta.setAttribute('content', 'black-translucent');
            } else {
                // Light theme: light background, dark text
                themeColorMeta.setAttribute('content', '#ffffff');
                statusBarStyleMeta.setAttribute('content', 'default');
            }
        }
    }

    toggleView() {
        this.currentView = this.currentView === 'list' ? 'table' : 'list';
        localStorage.setItem('viewMode', this.currentView);
        this.updateView();
        this.displayHistory();
    }

    updateView() {
        const viewIcon = document.getElementById('viewIcon');
        const historyList = document.getElementById('historyList');
        const historyTable = document.getElementById('historyTable');
        
        if (viewIcon) {
            viewIcon.className = this.currentView === 'list' ? 'bi bi-table' : 'bi bi-list-ul';
        }
        
        if (historyList && historyTable) {
            if (this.currentView === 'list') {
                historyList.style.display = 'block';
                historyTable.style.display = 'none';
            } else {
                historyList.style.display = 'none';
                historyTable.style.display = 'block';
            }
        }
    }

    // Auto-Save Funktionen
    triggerAutoSave(input) {
        // Clear existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // Show saving indicator
        this.showAutoSaveIndicator(input, 'saving');

        // Set new timeout
        this.autoSaveTimeout = setTimeout(() => {
            this.performAutoSave(input);
        }, this.autoSaveDelay);
    }

    // Offline-Status überwachen
    setupOfflineMonitoring() {
        window.addEventListener('online', () => {
    
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.showNotification('Offline-Modus aktiv', 'warning');
        });

        // Initial check
        if (!navigator.onLine) {
            this.showNotification('Offline-Modus aktiv', 'warning');
        }
    }

    // Offline-Daten synchronisieren
    async syncOfflineData() {
        try {
            const offlineData = localStorage.getItem('poetrySlamOfflineData');
            if (offlineData) {
                const data = JSON.parse(offlineData);
                // Syncing offline data to server
                
                // Hier könnte die Synchronisation mit einem Server erfolgen
                // await this.syncToServer(data);
                
                // Clear offline data after successful sync
                localStorage.removeItem('poetrySlamOfflineData');
        
            }
        } catch (error) {
            console.error('Sync failed:', error);
            this.showNotification('Synchronisation fehlgeschlagen', 'error');
        }
    }

    showAutoSaveIndicator(input, state) {
        input.classList.remove('auto-saved', 'auto-saving');
        
        if (state === 'saving') {
            input.classList.add('auto-saving');
        } else if (state === 'saved') {
            input.classList.add('auto-saved');
            setTimeout(() => {
                input.classList.remove('auto-saved');
            }, 2000);
        }
    }

    performAutoSave(input) {
        // Simuliere Auto-Save (hier könnte später eine echte Speicherung erfolgen)
        this.showAutoSaveIndicator(input, 'saved');
        
        // Optional: Speichere in localStorage für Wiederherstellung
        const autoSaveData = {
            participantName: document.getElementById('participantName').value,
            judgeScores: this.getCurrentScores(),
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('poetrySlamAutoSave', JSON.stringify(autoSaveData));
        } catch (e) {
            console.warn('Auto-Save fehlgeschlagen:', e);
        }
    }

    getCurrentScores() {
        const scores = {};
        document.querySelectorAll('.judge-input').forEach(input => {
            if (input.value.trim()) {
                let value = input.value.trim();
                
                // Count decimal separators
                const commaCount = (value.match(/,/g) || []).length;
                const dotCount = (value.match(/\./g) || []).length;
                
                // Only allow one decimal separator
                if (commaCount > 1 || dotCount > 1) {
                    // If multiple separators of same type, keep only the first one
                    if (commaCount > 1) {
                        const firstComma = value.indexOf(',');
                        value = value.substring(0, firstComma + 1) + value.substring(firstComma + 1).replace(/,/g, '');
                    }
                    if (dotCount > 1) {
                        const firstDot = value.indexOf('.');
                        value = value.substring(0, firstDot + 1) + value.substring(firstDot + 1).replace(/\./g, '');
                    }
                }
                
                // If both comma and dot are present, remove the first one and keep the last one
                if (commaCount > 0 && dotCount > 0) {
                    const lastComma = value.lastIndexOf(',');
                    const lastDot = value.lastIndexOf('.');
                    
                    if (lastComma > lastDot) {
                        // Keep comma, remove all dots
                        value = value.replace(/\./g, '');
                        value = value.replace(',', '.');
                    } else {
                        // Keep dot, remove all commas
                        value = value.replace(/,/g, '');
                    }
                } else if (commaCount > 0) {
                    // Only comma present, convert to dot
                    value = value.replace(',', '.');
                }
                
                scores[input.id] = value;
            }
        });
        return scores;
    }

    generateJudgeInputs() {
        const container = document.getElementById('judgeInputs');
        
        // Store current values before clearing
        const currentValues = {};
        document.querySelectorAll('.judge-input').forEach(input => {
            if (input.value) {
                currentValues[input.id] = input.value;
            }
        });
        
        // Use requestAnimationFrame for smoother DOM updates
        requestAnimationFrame(() => {
            container.innerHTML = '';

            // Bestimme die Anzahl Spalten basierend auf Bildschirmgröße
            const isMobile = window.innerWidth <= 768;
            const isSmallMobile = window.innerWidth <= 576;
            
            let colClass = 'col-md-6 col-lg-4';
            if (isSmallMobile) {
                colClass = 'col-6';
            } else if (isMobile) {
                colClass = 'col-md-6';
            }

            // Create document fragment for better performance
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < this.currentJudgeCount; i++) {
                const col = document.createElement('div');
                col.className = colClass;
                
                col.innerHTML = `
                    <div class="form-group">
                        <label for="judge${i + 1}" class="form-label small mb-1">Juror*in ${i + 1}</label>
                        <div class="input-group input-group-sm">
                            <input type="number" 
                                   class="form-control form-control-sm judge-input" 
                                   id="judge${i + 1}" 
                                   placeholder="1,0-10,0"
                                   data-judge-id="${i + 1}"
                                   step="0.1"
                                   min="1.0"
                                   max="10.0"
                                   inputmode="decimal"
                                   pattern="[0-9]*[.,]?[0-9]+"
                                   ${i > 0 ? `data-previous="judge${i}"` : ''}
                                   ${i < this.currentJudgeCount - 1 ? `data-next="judge${i + 2}"` : ''}>
                            <span class="input-group-text input-group-text-sm">Pkt</span>
                        </div>
                        <div class="invalid-feedback small" id="feedback${i + 1}"></div>
                    </div>
                `;
                
                fragment.appendChild(col);
            }
            
            // Append all at once to minimize reflows
            container.appendChild(fragment);
            
            // Restore values after DOM is updated
            Object.keys(currentValues).forEach(judgeId => {
                const input = document.getElementById(judgeId);
                if (input) {
                    input.value = currentValues[judgeId];
                    this.validateInput(input);
                }
            });

            // Restore auto-saved data if available
            this.restoreAutoSaveData();
        });
    }

    restoreAutoSaveData() {
        try {
            const autoSaveData = localStorage.getItem('poetrySlamAutoSave');
            if (autoSaveData) {
                const data = JSON.parse(autoSaveData);
                const now = Date.now();
                const oneHour = 60 * 60 * 1000; // 1 Stunde

                // Restore only if data is less than 1 hour old
                if (now - data.timestamp < oneHour) {
                    if (data.participantName) {
                        document.getElementById('participantName').value = data.participantName;
                    }
                    
                    if (data.judgeScores) {
                        Object.keys(data.judgeScores).forEach(judgeId => {
                            const input = document.getElementById(judgeId);
                            if (input) {
                                input.value = data.judgeScores[judgeId];
                                this.validateInput(input);
                            }
                        });
                    }
                } else {
                    // Clear old auto-save data
                    localStorage.removeItem('poetrySlamAutoSave');
                }
            }
        } catch (e) {
            console.warn('Auto-Save Wiederherstellung fehlgeschlagen:', e);
        }
    }

    addJudge() {
        if (this.currentJudgeCount < this.maxJudges) {
            this.currentJudgeCount++;
            this.generateJudgeInputs();
            this.updateJudgeCount();
        } else {
            this.showNotification('Maximale Anzahl Juror*innen erreicht', 'warning');
        }
    }

    removeJudge() {
        if (this.currentJudgeCount > this.minJudges) {
            this.currentJudgeCount--;
            this.generateJudgeInputs();
            this.updateJudgeCount();
        } else {
            this.showNotification('Minimale Anzahl Juror*innen erreicht', 'warning');
        }
    }

    updateJudgeCount() {
        document.getElementById('judgeCount').textContent = this.currentJudgeCount;
    }

    limitDecimalPlaces(input) {
        let value = input.value;
        
        // Count decimal separators
        const commaCount = (value.match(/,/g) || []).length;
        const dotCount = (value.match(/\./g) || []).length;
        
        // Only process if there are issues with separators
        if (commaCount > 1 || dotCount > 1 || (commaCount > 0 && dotCount > 0)) {
            // If multiple separators of same type, keep only the first one
            if (commaCount > 1) {
                const firstComma = value.indexOf(',');
                value = value.substring(0, firstComma + 1) + value.substring(firstComma + 1).replace(/,/g, '');
            }
            if (dotCount > 1) {
                const firstDot = value.indexOf('.');
                value = value.substring(0, firstDot + 1) + value.substring(firstDot + 1).replace(/\./g, '');
            }
            
            // If both comma and dot are present, keep the last one
            if (commaCount > 0 && dotCount > 0) {
                const lastComma = value.lastIndexOf(',');
                const lastDot = value.lastIndexOf('.');
                
                if (lastComma > lastDot) {
                    // Keep comma, remove all dots
                    value = value.replace(/\./g, '');
                    value = value.replace(',', '.');
                } else {
                    // Keep dot, remove all commas
                    value = value.replace(/,/g, '');
                }
            }
        }
        
        // Convert comma to dot for consistency
        if (value.includes(',')) {
            value = value.replace(',', '.');
        }
        
        // Limit to one decimal place
        if (value.includes('.')) {
            const parts = value.split('.');
            if (parts[1].length > 1) {
                value = parts[0] + '.' + parts[1].substring(0, 1);
            }
        }
        
        // Only update if value actually changed
        if (value !== input.value) {
            input.value = value;
        }
    }

    validateInput(input) {
        let value = input.value;
        
        // For validation, we need to normalize the value to check if it's valid
        // but we don't want to modify the input during typing
        let normalizedValue = value;
        
        // Count decimal separators
        const commaCount = (value.match(/,/g) || []).length;
        const dotCount = (value.match(/\./g) || []).length;
        
        // Normalize for validation (convert comma to dot for parsing)
        if (commaCount > 0) {
            normalizedValue = value.replace(',', '.');
        }
        
        input.classList.remove('is-valid', 'is-invalid');
        
        if (value === '') {
            return false;
        }
        
        // Check for multiple decimal places in normalized value
        if (normalizedValue.includes('.') && normalizedValue.split('.')[1].length > 1) {
            input.classList.add('is-invalid');
            const feedback = document.getElementById(`feedback${input.dataset.judgeId}`);
            if (feedback) {
                feedback.textContent = 'Maximal eine Nachkommastelle';
            }
            return false;
        }
        
        // Check for multiple separators
        if (commaCount > 1 || dotCount > 1 || (commaCount > 0 && dotCount > 0)) {
            input.classList.add('is-invalid');
            const feedback = document.getElementById(`feedback${input.dataset.judgeId}`);
            if (feedback) {
                feedback.textContent = 'Nur ein Dezimaltrennzeichen erlaubt';
            }
            return false;
        }
        
        const numValue = parseFloat(normalizedValue);
        
        if (isNaN(numValue) || numValue < 1.0 || numValue > 10.0) {
            input.classList.add('is-invalid');
            const feedback = document.getElementById(`feedback${input.dataset.judgeId}`);
            if (feedback) {
                feedback.textContent = '1,0 - 10,0';
            }
            return false;
        }
        
        input.classList.add('is-valid');
        return true;
    }

    focusNextInput(currentInput) {
        const nextId = currentInput.dataset.next;
        if (nextId) {
            const nextInput = document.getElementById(nextId);
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        } else {
            // Wenn es das letzte Feld ist, fokussiere den Berechnen-Button
            const calculateBtn = document.getElementById('calculateBtn');
            if (calculateBtn) {
                calculateBtn.focus();
            }
        }
    }

    focusPreviousInput(currentInput) {
        const previousId = currentInput.dataset.previous;
        if (previousId) {
            const previousInput = document.getElementById(previousId);
            if (previousInput) {
                previousInput.focus();
                previousInput.select();
            }
        } else {
            // Wenn es das erste Feld ist, fokussiere das Teilnehmer-Name-Feld
            const participantInput = document.getElementById('participantName');
            if (participantInput) {
                participantInput.focus();
                participantInput.select();
            }
        }
    }

    getScores() {
        const scores = [];
        const inputs = document.querySelectorAll('.judge-input');
        
        for (let input of inputs) {
            let value = input.value.trim();
            if (value === '') {
                return null; // Nicht alle Felder ausgefüllt
            }
            
            if (!this.validateInput(input)) {
                return null; // Ungültige Eingabe
            }
            
            // Count decimal separators
            const commaCount = (value.match(/,/g) || []).length;
            const dotCount = (value.match(/\./g) || []).length;
            
            // Only allow one decimal separator
            if (commaCount > 1 || dotCount > 1) {
                // If multiple separators of same type, keep only the first one
                if (commaCount > 1) {
                    const firstComma = value.indexOf(',');
                    value = value.substring(0, firstComma + 1) + value.substring(firstComma + 1).replace(/,/g, '');
                }
                if (dotCount > 1) {
                    const firstDot = value.indexOf('.');
                    value = value.substring(0, firstDot + 1) + value.substring(firstDot + 1).replace(/\./g, '');
                }
            }
            
            // If both comma and dot are present, remove the first one and keep the last one
            if (commaCount > 0 && dotCount > 0) {
                const lastComma = value.lastIndexOf(',');
                const lastDot = value.lastIndexOf('.');
                
                if (lastComma > lastDot) {
                    // Keep comma, remove all dots
                    value = value.replace(/\./g, '');
                    value = value.replace(',', '.');
                } else {
                    // Keep dot, remove all commas
                    value = value.replace(/,/g, '');
                }
            } else if (commaCount > 0) {
                // Only comma present, convert to dot
                value = value.replace(',', '.');
            }
            
            const numValue = parseFloat(value);
            scores.push(numValue);
        }
        
        return scores;
    }

    calculateScore() {
        try {
            const scores = this.getScores();
            
            if (!scores) {
                this.showNotification('Bitte füllen Sie alle Felder mit gültigen Werten (1,0 - 10,0) aus', 'error');
                return;
            }

            // Zeige Progress Bar
            this.showProgressBar();

            // Simuliere kurze Berechnungszeit für bessere UX
            setTimeout(() => {
                try {
                    // Sortiere die Scores
                    const sortedScores = [...scores].sort((a, b) => a - b);
                    
                    // Entferne die kleinste und größte Zahl
                    const excludedScores = [sortedScores[0], sortedScores[sortedScores.length - 1]];
                    const includedScores = sortedScores.slice(1, -1);
                    
                    // Berechne die Summe der mittleren Werte
                    const totalScore = includedScores.reduce((sum, score) => sum + score, 0);
                    
                    // Speichere das aktuelle Ergebnis
                    this.currentResult = {
                        scores: scores,
                        excludedScores: excludedScores,
                        includedScores: includedScores,
                        totalScore: totalScore,
                        participantName: document.getElementById('participantName')?.value?.trim() || 'Unbekannt'
                    };
                    
                    this.hideProgressBar();
                    this.displayResult();
            
                } catch (error) {
                    this.hideProgressBar();
                    this.handleError('Fehler bei der Berechnung', error);
                }
            }, 500);
        } catch (error) {
            this.handleError('Fehler beim Starten der Berechnung', error);
        }
    }

    showProgressBar() {
        const progressBar = document.getElementById('progressBar');
        const progressBarInner = progressBar.querySelector('.progress-bar');
        
        progressBar.style.display = 'block';
        progressBarInner.style.width = '0%';
        
        // Animiere Progress Bar
        setTimeout(() => {
            progressBarInner.style.width = '100%';
        }, 100);
    }

    hideProgressBar() {
        const progressBar = document.getElementById('progressBar');
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 300);
    }

    displayResult() {
        if (!this.currentResult) return;
        
        const resultCard = document.getElementById('resultCard');
        const totalScoreElement = document.getElementById('totalScore');
        const excludedScoresElement = document.getElementById('excludedScores');
        const includedScoresElement = document.getElementById('includedScores');
        
        // Formatiere die Gesamtpunktzahl mit Komma
        totalScoreElement.textContent = this.currentResult.totalScore.toFixed(1).replace('.', ',');
        
        // Zeige gestrichene Punkte mit Animation
        excludedScoresElement.innerHTML = this.currentResult.excludedScores
            .map((score, index) => `<span class="score-badge bg-danger" style="animation-delay: ${index * 0.1}s">${score.toFixed(1).replace('.', ',')}</span>`)
            .join('');
        
        // Zeige gewertete Punkte mit Animation
        includedScoresElement.innerHTML = this.currentResult.includedScores
            .map((score, index) => `<span class="score-badge bg-success" style="animation-delay: ${index * 0.1}s">${score.toFixed(1).replace('.', ',')}</span>`)
            .join('');
        
        resultCard.style.display = 'block';
        resultCard.classList.add('fade-in');
        
        // Scroll to result
        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    }

    saveAndReset() {
        if (!this.currentResult) {
            this.showNotification('Bitte führen Sie zuerst eine Berechnung durch', 'warning');
            return;
        }
        
        // Erstelle History-Eintrag
        const historyEntry = {
            id: Date.now(),
            timestamp: new Date().toLocaleString('de-DE'),
            participantName: this.currentResult.participantName || 'Unbekannt',
            totalScore: this.currentResult.totalScore,
            excludedScores: this.currentResult.excludedScores,
            includedScores: this.currentResult.includedScores,
            allScores: this.currentResult.scores
        };
        
        // Add timer information if timer was used
        if (this.timerDuration > 0) {
            historyEntry.timerUsed = true;
            historyEntry.timerDuration = this.timerDuration;
            historyEntry.timeRemaining = this.timerRemaining;
            historyEntry.timeOverrun = this.timerRemaining <= 0;
        }
        
        // Füge zur History hinzu
        this.history.unshift(historyEntry);
        this.saveHistory();
        this.displayHistory();
        
        // Reset
        this.resetForm();
        this.currentResult = null;
        
        // Stop timer
        this.stopTimer();
        

    }

    resetForm() {
        // Lösche alle Eingaben
        document.querySelectorAll('.judge-input').forEach(input => {
            input.value = '';
            input.classList.remove('is-valid', 'is-invalid', 'auto-saved', 'auto-saving');
        });
        
        document.getElementById('participantName').value = '';
        document.getElementById('participantName').classList.remove('auto-saved', 'auto-saving');
        
        // Clear auto-save timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null;
        }
        
        // Clear auto-save data
        localStorage.removeItem('poetrySlamAutoSave');
        
        // Verstecke Ergebnis
        document.getElementById('resultCard').style.display = 'none';
        
        // Fokussiere erstes Eingabefeld
        const firstInput = document.querySelector('.judge-input');
        if (firstInput) {
            firstInput.focus();
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('poetrySlamHistory');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (error) {
            this.handleError('Fehler beim Laden der History', error);
            this.history = [];
        }
        this.displayHistory();
    }

    saveHistory() {
        try {
            localStorage.setItem('poetrySlamHistory', JSON.stringify(this.history));
        } catch (error) {
            this.handleError('Fehler beim Speichern der History', error);
        }
    }

    displayHistory() {
        const historyList = document.getElementById('historyList');
        const historyTable = document.getElementById('historyTable');
        const noHistory = document.getElementById('noHistory');
        
        if (this.history.length === 0) {
            historyList.style.display = 'none';
            historyTable.style.display = 'none';
            noHistory.style.display = 'block';
            return;
        }
        
        noHistory.style.display = 'none';
        
        if (this.currentView === 'list') {
            historyList.style.display = 'block';
            historyTable.style.display = 'none';
            this.displayHistoryList();
        } else {
            historyList.style.display = 'none';
            historyTable.style.display = 'block';
            this.displayHistoryTable();
        }
    }

    displayHistoryList() {
        const historyList = document.getElementById('historyList');
        
        historyList.innerHTML = this.history.map(entry => {
            const timerInfo = entry.timerUsed ? `
                <div class="timer-info mt-2">
                    <small class="text-muted">
                        <i class="bi bi-clock"></i> 
                        ${(entry.timerDuration / 60).toFixed(1)}min Timer
                        ${entry.timeOverrun ? 
                            `<span class="text-danger">(Zeit überschritten)</span>` : 
                            `<span class="text-success">(${Math.floor(entry.timeRemaining / 60)}:${(entry.timeRemaining % 60).toString().padStart(2, '0')} verbleibend)</span>`
                        }
                    </small>
                </div>
            ` : '';
            
            return `
                <div class="history-item fade-in">
                    <button class="btn btn-sm btn-outline-danger delete-btn" onclick="calculator.deleteHistoryEntry(${entry.id})" title="Eintrag löschen">
                        <i class="bi bi-trash"></i>
                    </button>
                    
                    <div class="timestamp">${entry.timestamp}</div>
                    <div class="participant-name">${entry.participantName}</div>
                    
                    <div class="total-score">
                        ${entry.totalScore.toFixed(1).replace('.', ',')}
                    </div>
                    
                    <div class="scores">
                        <div class="excluded-scores">
                            <small>Gestrichen</small>
                            <div>${entry.excludedScores.map(s => s.toFixed(1).replace('.', ',')).join(' / ')}</div>
                        </div>
                        <div class="included-scores">
                            <small>Gewertet</small>
                            <div>${entry.includedScores.map(s => s.toFixed(1).replace('.', ',')).join(' / ')}</div>
                        </div>
                    </div>
                    ${timerInfo}
                </div>
            `;
        }).join('');
    }

    displayHistoryTable() {
        const historyTableBody = document.getElementById('historyTableBody');
        
        historyTableBody.innerHTML = this.history.map(entry => `
            <tr class="fade-in">
                <td><small>${entry.timestamp}</small></td>
                <td><strong>${entry.participantName}</strong></td>
                <td><span>${entry.totalScore.toFixed(1).replace('.', ',')}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="calculator.deleteHistoryEntry(${entry.id})" title="Löschen">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    deleteHistoryEntry(id) {
        this.history = this.history.filter(entry => entry.id !== id);
        this.saveHistory();
        this.displayHistory();

    }

    clearHistory() {
        if (confirm('Möchten Sie wirklich die gesamte History löschen?')) {
            this.history = [];
            this.saveHistory();
            this.displayHistory();
    
        }
    }

    exportCSV() {
        if (this.history.length === 0) {
            this.showNotification('Keine Daten zum Exportieren vorhanden', 'warning');
            return;
        }

        const headers = ['Datum', 'Name', 'Gesamtpunktzahl', 'Gestrichene Punkte', 'Gewertete Punkte', 'Alle Punkte'];
        const csvContent = [
            headers.join(';'),
            ...this.history.map(entry => [
                entry.timestamp,
                entry.participantName,
                entry.totalScore.toFixed(1).replace('.', ','),
                entry.excludedScores.map(s => s.toFixed(1).replace('.', ',')).join(', '),
                entry.includedScores.map(s => s.toFixed(1).replace('.', ',')).join(', '),
                entry.allScores.map(s => s.toFixed(1).replace('.', ',')).join(', ')
            ].join(';'))
        ].join('\n');

        this.downloadFile(csvContent, 'poetry-slam-history.csv', 'text/csv;charset=utf-8;');

    }

    exportJSON() {
        if (this.history.length === 0) {
            this.showNotification('Keine Daten zum Exportieren vorhanden', 'warning');
            return;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            totalEntries: this.history.length,
            data: this.history
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        this.downloadFile(jsonContent, 'poetry-slam-history.json', 'application/json');

    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    showNotification(message, type = 'info') {
        try {
            const toast = document.getElementById('notificationToast');
            const toastMessage = document.getElementById('toastMessage');
            
            if (!toast || !toastMessage) {
                console.error('Toast-Elemente nicht gefunden');
                return;
            }
            
            toastMessage.textContent = message;
            
            // Entferne alte Klassen
            toast.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-white', 'text-dark');
            
            // Füge neue Klasse hinzu (CSS übernimmt die korrekten Farben)
            switch (type) {
                case 'success':
                    toast.classList.add('bg-success');
                    break;
                case 'error':
                    toast.classList.add('bg-danger');
                    break;
                case 'warning':
                    toast.classList.add('bg-warning');
                    break;
                default:
                    toast.classList.add('bg-info');
            }
            
            // Zeige Toast
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        } catch (error) {
            console.error('Fehler beim Anzeigen der Benachrichtigung:', error);
            // Fallback: Alert verwenden
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Error Handling System
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError('Globaler Fehler', event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('Unbehandelte Promise-Ablehnung', event.reason);
        });

        // Console error interceptor (disabled to prevent infinite recursion)
        // const originalConsoleError = console.error;
        // console.error = (...args) => {
        //     this.logError('Console Error', args.join(' '));
        //     originalConsoleError.apply(console, args);
        // };
    }

    handleError(message, error) {
        this.errorCount++;
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: message,
            error: error?.message || error?.toString() || 'Unbekannter Fehler',
            stack: error?.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errorLog.push(errorInfo);
        this.logError(message, error);

        // Zeige Benutzer-freundliche Nachricht
        this.showNotification(`Ein Fehler ist aufgetreten: ${message}`, 'error');

        // Bei zu vielen Fehlern: App-Neustart vorschlagen
        if (this.errorCount >= this.maxErrors) {
            this.suggestAppRestart();
        }

        // Speichere Error Log
        this.saveErrorLog();
    }

    logError(message, error) {
        // Use console.warn instead of console.error to avoid potential recursion
        console.warn(`[${new Date().toISOString()}] ${message}:`, error);
    }

    suggestAppRestart() {
        const restart = confirm(
            'Es sind mehrere Fehler aufgetreten. Möchten Sie die App neu starten?'
        );
        if (restart) {
            window.location.reload();
        }
    }

    saveErrorLog() {
        try {
            localStorage.setItem('poetrySlamErrorLog', JSON.stringify(this.errorLog));
        } catch (error) {
            console.error('Fehler beim Speichern des Error Logs:', error);
        }
    }

    loadErrorLog() {
        try {
            const savedLog = localStorage.getItem('poetrySlamErrorLog');
            if (savedLog) {
                this.errorLog = JSON.parse(savedLog);
            }
        } catch (error) {
            console.error('Fehler beim Laden des Error Logs:', error);
        }
    }

    safeAddEventListener(elementId, event, handler) {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                this.logError(`Element nicht gefunden: ${elementId}`, new Error(`Element ${elementId} existiert nicht`));
            }
        } catch (error) {
            this.handleError(`Event Listener Fehler für ${elementId}`, error);
        }
    }

    safeGetElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            this.logError(`Element nicht gefunden: ${elementId}`, new Error(`Element ${elementId} existiert nicht`));
        }
        return element;
    }

    // Debug-Funktionen für Entwickler
    debugInfo() {
        const info = {
            version: '1.2',
            errorCount: this.errorCount,
            errorLog: this.errorLog,
            historyLength: this.history.length,
            currentJudgeCount: this.currentJudgeCount,
            currentView: this.currentView,
            userAgent: navigator.userAgent,
            localStorage: {
                available: typeof Storage !== 'undefined',
                history: localStorage.getItem('poetrySlamHistory') ? 'available' : 'not found',
                theme: localStorage.getItem('theme') || 'not set',
                viewMode: localStorage.getItem('viewMode') || 'not set'
            },
            serviceWorker: 'serviceWorker' in navigator ? 'supported' : 'not supported',
            online: navigator.onLine
        };
        
        // Debug information logged for development
        return info;
    }

    exportErrorLog() {
        try {
            const errorData = {
                exportDate: new Date().toISOString(),
                errorCount: this.errorCount,
                errors: this.errorLog
            };
            
            const jsonContent = JSON.stringify(errorData, null, 2);
            this.downloadFile(jsonContent, 'error-log.json', 'application/json');
    
        } catch (error) {
            this.handleError('Fehler beim Exportieren des Error Logs', error);
        }
    }

    clearErrorLog() {
        try {
            this.errorLog = [];
            this.errorCount = 0;
            localStorage.removeItem('poetrySlamErrorLog');
    
        } catch (error) {
            this.handleError('Fehler beim Löschen des Error Logs', error);
        }
    }

    // Initialize Bootstrap tooltips
    initializeTooltips() {
        try {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        } catch (error) {
            this.handleError('Fehler beim Initialisieren der Tooltips', error);
        }
    }

    // Timer Functions
    startTimer() {
        try {
            const minutes = parseFloat(document.getElementById('timerMinutes').value);
            if (isNaN(minutes) || minutes < 0.5 || minutes > 60) {
                this.showNotification('Bitte geben Sie eine gültige Zeit zwischen 0,5 und 60 Minuten ein', 'warning');
                return;
            }

            this.timerDuration = minutes * 60; // Convert to seconds
            this.timerRemaining = this.timerDuration;
            this.timerStartTime = Date.now();
            this.timerPaused = false;
            this.timerPauseTime = 0;

            // Show timer container
            document.getElementById('timerContainer').style.display = 'block';
            
            // Update button states
            document.getElementById('startTimer').disabled = true;
            document.getElementById('pauseTimer').style.display = 'inline-block';
            document.getElementById('resumeTimer').style.display = 'none';
            document.getElementById('stopTimer').disabled = false;

            // Start timer interval
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);
            
            // Initial update
            this.updateTimer();
            
    
            
            // Play sound for timer start
            this.playTimerSound('start');
            
        } catch (error) {
            this.handleError('Fehler beim Starten des Timers', error);
        }
    }

    pauseTimer() {
        try {
            if (this.timerInterval && !this.timerPaused) {
                clearInterval(this.timerInterval);
                this.timerPaused = true;
                this.timerPauseTime = Date.now();
                
                // Update button states
                document.getElementById('pauseTimer').style.display = 'none';
                document.getElementById('resumeTimer').style.display = 'inline-block';
                
                this.showNotification('Timer pausiert', 'info');
            }
        } catch (error) {
            this.handleError('Fehler beim Pausieren des Timers', error);
        }
    }

    resumeTimer() {
        try {
            if (this.timerPaused) {
                // Adjust start time for pause duration
                const pauseDuration = Date.now() - this.timerPauseTime;
                this.timerStartTime += pauseDuration;
                
                this.timerPaused = false;
                this.timerPauseTime = 0;
                
                // Restart timer interval
                this.timerInterval = setInterval(() => this.updateTimer(), 1000);
                
                // Update button states
                document.getElementById('pauseTimer').style.display = 'inline-block';
                document.getElementById('resumeTimer').style.display = 'none';
                
                this.showNotification('Timer fortgesetzt', 'info');
            }
        } catch (error) {
            this.handleError('Fehler beim Fortsetzen des Timers', error);
        }
    }

    stopTimer() {
        try {
            // Check if timer is actually running
            const wasRunning = this.timerInterval !== null;
            
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            
            // Reset timer state
            this.timerRemaining = 0;
            this.timerPaused = false;
            this.timerPauseTime = 0;
            
            // Hide timer container
            document.getElementById('timerContainer').style.display = 'none';
            
            // Reset button states
            document.getElementById('startTimer').disabled = false;
            document.getElementById('pauseTimer').style.display = 'inline-block';
            document.getElementById('resumeTimer').style.display = 'none';
            document.getElementById('stopTimer').disabled = true;
            
            // Remove warning/danger classes
            const timerDisplay = document.getElementById('timerDisplay');
            timerDisplay.classList.remove('text-warning', 'text-danger', 'timer-warning', 'timer-danger');
            timerDisplay.classList.add('text-primary');
            
            // Only show notification if timer was actually running
            if (wasRunning) {
                this.showNotification('Timer gestoppt', 'info');
            }
            
        } catch (error) {
            this.handleError('Fehler beim Stoppen des Timers', error);
        }
    }

    updateTimer() {
        try {
            if (!this.timerStartTime || this.timerPaused) return;
            
            const elapsed = Math.floor((Date.now() - this.timerStartTime) / 1000);
            this.timerRemaining = Math.max(0, this.timerDuration - elapsed);
            
            // Update display
            const minutes = Math.floor(this.timerRemaining / 60);
            const seconds = this.timerRemaining % 60;
            const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            document.getElementById('timerDisplay').textContent = display;
            
            // Update progress bar
            const progressPercent = (this.timerRemaining / this.timerDuration) * 100;
            document.getElementById('timerProgress').style.width = `${progressPercent}%`;
            
            // Update visual states
            this.updateTimerVisualState();
            
            // Check if timer finished
            if (this.timerRemaining <= 0) {
                this.timerFinished();
            }
            
        } catch (error) {
            this.handleError('Fehler beim Aktualisieren des Timers', error);
        }
    }

    updateTimerVisualState() {
        try {
            const timerDisplay = document.getElementById('timerDisplay');
            const progressBar = document.getElementById('timerProgress');
            const remainingPercent = (this.timerRemaining / this.timerDuration) * 100;
            
            // Remove all state classes
            timerDisplay.classList.remove('text-primary', 'text-warning', 'text-danger', 'timer-warning', 'timer-danger');
            progressBar.classList.remove('bg-primary', 'bg-warning', 'bg-danger');
            
            if (remainingPercent > 50) {
                // Normal state
                timerDisplay.classList.add('text-primary');
                progressBar.classList.add('bg-primary');
            } else if (remainingPercent > 20) {
                // Warning state
                timerDisplay.classList.add('text-warning', 'timer-warning');
                progressBar.classList.add('bg-warning');
            } else {
                // Danger state
                timerDisplay.classList.add('text-danger', 'timer-danger');
                progressBar.classList.add('bg-danger');
            }
            
        } catch (error) {
            this.handleError('Fehler beim Aktualisieren des Timer-Zustands', error);
        }
    }

    timerFinished() {
        try {
            // Stop timer
            this.stopTimer();
            
            // Show notification
            this.showNotification('Zeit ist abgelaufen!', 'warning');
            
            // Play sound
            this.playTimerSound('finish');
            
        } catch (error) {
            this.handleError('Fehler beim Timer-Ende', error);
        }
    }

    playTimerSound(type) {
        try {
            // Create audio context for sound effects
            if ('AudioContext' in window || 'webkitAudioContext' in window) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                if (type === 'start') {
                    // Play start sound (high beep)
                    this.playBeep(audioContext, 800, 200);
                } else if (type === 'finish') {
                    // Play finish sound (low beep)
                    this.playBeep(audioContext, 400, 500);
                }
            }
        } catch (error) {
            // Silently fail if audio is not supported
            // Audio not supported in this browser
        }
    }

    playBeep(audioContext, frequency, duration) {
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            // Beep audio playback failed silently
        }
    }

    // Help Modal Functions
    showHelp() {
        try {
            const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
            helpModal.show();
            
            // Analytics tracking (optional)
            this.trackHelpUsage();
            
        } catch (error) {
            this.handleError('Fehler beim Anzeigen der Hilfe', error);
        }
    }

    trackHelpUsage() {
        try {
            // Optional: Track help usage for analytics
            const helpCount = parseInt(localStorage.getItem('helpUsageCount') || '0');
            localStorage.setItem('helpUsageCount', (helpCount + 1).toString());
            
            // Could send to analytics service here
            // Help accessed tracking for analytics
        } catch (error) {
            // Silently fail for analytics
        }
    }

    /**
     * Setup PWA viewport for iPhone notch
     * Dynamically adjusts padding for safe area insets
     */
    setupPWAViewport() {
        try {
            // Check if running in PWA mode
            if (window.matchMedia('(display-mode: standalone)').matches) {
                // Check if on iOS device
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    // Get safe area inset
                    const safeAreaTop = getComputedStyle(document.documentElement)
                        .getPropertyValue('--sat') || '44px';
                    
                    // Apply dynamic padding
                    document.body.style.paddingTop = safeAreaTop;
                    
                    // Add additional header padding
                    const header = document.querySelector('header');
                    if (header) {
                        header.style.paddingTop = '1.5rem';
                    }
                    
                    console.log('PWA viewport adjusted for iPhone notch');
                }
            }
        } catch (error) {
            this.handleError('PWA viewport setup failed', error);
        }
    }

    // PWA Service Worker Registration
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    // Service Worker successfully registered
                })
                .catch(error => {
                    // Service Worker registration failed silently
                });
        }
    }


}

// Initialisiere die App
let calculator;

document.addEventListener('DOMContentLoaded', () => {
    try {
        calculator = new PoetrySlamCalculator();
        
        // Event Listener für Resize-Events (optimized)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            try {
                // Debounce resize events to prevent excessive regenerations
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    // Only regenerate if screen size category actually changed
                    const currentWidth = window.innerWidth;
                    const wasMobile = calculator.lastScreenWidth <= 768;
                    const isMobile = currentWidth <= 768;
                    const wasSmallMobile = calculator.lastScreenWidth <= 576;
                    const isSmallMobile = currentWidth <= 576;
                    
                    // Only regenerate if mobile/desktop category changed
                    if (wasMobile !== isMobile || wasSmallMobile !== isSmallMobile) {
                        calculator.lastScreenWidth = currentWidth;
                        calculator.generateJudgeInputs();
                    }
                }, 300); // Increased debounce time
            } catch (error) {
                calculator?.handleError('Resize Event Fehler', error);
            }
        });
    } catch (error) {
        console.error('Kritischer Fehler bei der App-Initialisierung:', error);
        alert('Die App konnte nicht gestartet werden. Bitte laden Sie die Seite neu.');
    }
});

// PWA Install Prompt Management
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    // Show install button when prompt is available
    const installButton = document.getElementById('installApp');
    if (installButton) {
        installButton.style.display = 'inline-block';
    }
});

// Handle install button click
document.addEventListener('DOMContentLoaded', () => {
    const installButton = document.getElementById('installApp');
    if (installButton) {
        installButton.addEventListener('click', (e) => {
            // Ensure this is called directly from user gesture
            if (calculator && window.deferredPrompt) {
                try {
                    // Call prompt directly from the click handler
                    window.deferredPrompt.prompt();
                    
                    // Handle the user choice asynchronously
                    window.deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
    
                        } else {
                            calculator.showNotification('Installation abgebrochen', 'info');
                        }
                        
                        // Clear the deferredPrompt
                        window.deferredPrompt = null;
                        
                        // Hide the install button
                        installButton.style.display = 'none';
                    }).catch((error) => {
                        calculator.handleError('Install prompt error', error);
                    });
                    
                } catch (error) {
                    calculator.handleError('Install prompt error', error);
                }
            }
        });
    }
});

// Globale Debug-Funktionen (nur im Entwicklungsmodus)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugApp = () => {
        if (calculator) {
            return calculator.debugInfo();
        } else {
            console.error('App nicht initialisiert');
            return null;
        }
    };
    
    window.exportErrors = () => {
        if (calculator) {
            calculator.exportErrorLog();
        } else {
            console.error('App nicht initialisiert');
        }
    };
    
    window.clearErrors = () => {
        if (calculator) {
            calculator.clearErrorLog();
        } else {
            console.error('App nicht initialisiert');
        }
    };
    
    // Debug functions available in development mode only
}
