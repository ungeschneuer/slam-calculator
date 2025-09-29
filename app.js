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
        this.autoSaveDelay = 1000;
        
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
            
            // Setup development timestamp
            this.setupDevTimestamp();
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
        document.addEventListener('input', (e) => {
            try {
                if (e.target.classList.contains('judge-input')) {
                    // Sofortige Eingabe-Normalisierung für Android
                    this.normalizeInput(e.target);
                    // Step 3: Add limitDecimalPlaces to input event
                    this.limitDecimalPlaces(e.target);
                    // Step 2: Add validation on input (but not limitDecimalPlaces)
                    this.validateInput(e.target);
                    this.triggerAutoSave(e.target);
                } else if (e.target.id === 'participantName') {
                    this.triggerAutoSave(e.target);
                }
            } catch (error) {
                this.handleError('Input Event Handler Fehler', error);
            }
        });

        // Step 1: Add validation only on blur (when user leaves the field)
        document.addEventListener('blur', (e) => {
            try {
                if (e.target.classList.contains('judge-input')) {
                    this.limitDecimalPlaces(e.target);
                    this.validateInput(e.target);
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
                scores[input.id] = input.value;
            }
        });
        return scores;
    }

    generateJudgeInputs() {
        const container = document.getElementById('judgeInputs');
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

        for (let i = 0; i < this.currentJudgeCount; i++) {
            const col = document.createElement('div');
            col.className = colClass;
            
            col.innerHTML = `
                <div class="form-group">
                    <label for="judge${i + 1}" class="form-label small mb-1">Juror*in ${i + 1}</label>
                    <div class="input-group input-group-sm">
                        <input type="text" 
                               class="form-control form-control-sm judge-input" 
                               id="judge${i + 1}" 
                               placeholder="1,0-10,0 (oder 1.0-10.0)"
                               data-judge-id="${i + 1}"
                               inputmode="decimal"
                               pattern="[0-9]*[.,]?[0-9]*"
                               autocomplete="off"
                               autocorrect="off"
                               autocapitalize="off"
                               spellcheck="false"
                               ${i > 0 ? `data-previous="judge${i}"` : ''}
                               ${i < this.currentJudgeCount - 1 ? `data-next="judge${i + 2}"` : ''}>
                        <span class="input-group-text input-group-text-sm">Pkt</span>
                    </div>
                    <div class="invalid-feedback small" id="feedback${i + 1}"></div>
                </div>
            `;
            
            container.appendChild(col);
        }

        // Restore auto-saved data if available
        this.restoreAutoSaveData();
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

    /**
     * Normalize input for Android compatibility
     * Handles both comma and dot as decimal separators
     */
    normalizeInput(input) {
        // Erlaube nur Zahlen, Komma und Punkt
        const cleanValue = input.value.replace(/[^0-9,.]/g, '');
        if (cleanValue !== input.value) {
            input.value = cleanValue;
        }
        
        // Verhindere mehr als ein Dezimaltrennzeichen
        const commaCount = (input.value.match(/,/g) || []).length;
        const dotCount = (input.value.match(/\./g) || []).length;
        
        if (commaCount + dotCount > 1) {
            // Behalte nur das erste Dezimaltrennzeichen
            const firstComma = input.value.indexOf(',');
            const firstDot = input.value.indexOf('.');
            
            if (firstComma !== -1 && firstDot !== -1) {
                if (firstComma < firstDot) {
                    input.value = input.value.replace(/\./g, '');
                } else {
                    input.value = input.value.replace(/,/g, '');
                }
            }
        }
    }

    limitDecimalPlaces(input) {
        // Normalisiere für die Verarbeitung
        const normalizedValue = input.value.replace(',', '.');
        
        // Begrenze auf eine Nachkommastelle
        if (normalizedValue.includes('.')) {
            const parts = normalizedValue.split('.');
            if (parts[1].length > 1) {
                // Behalte das ursprüngliche Dezimaltrennzeichen (Komma oder Punkt)
                const originalDecimal = input.value.includes(',') ? ',' : '.';
                input.value = parts[0] + originalDecimal + parts[1].substring(0, 1);
            }
        }
        
        // Zusätzlich: Erlaube nur Zahlen, Komma und Punkt
        const cleanValue = input.value.replace(/[^0-9,.]/g, '');
        if (cleanValue !== input.value) {
            input.value = cleanValue;
        }
    }

    validateInput(input) {
        // Normalisiere Komma zu Punkt für die Validierung
        const value = input.value.replace(',', '.');
        const numValue = parseFloat(value);
        
        input.classList.remove('is-valid', 'is-invalid');
        
        if (value === '') {
            return false;
        }
        
        // Prüfe auf mehr als eine Nachkommastelle (nach Normalisierung)
        if (value.includes('.') && value.split('.')[1].length > 1) {
            input.classList.add('is-invalid');
            const feedback = document.getElementById(`feedback${input.dataset.judgeId}`);
            if (feedback) {
                feedback.textContent = 'Maximal eine Nachkommastelle';
            }
            return false;
        }
        
        if (isNaN(numValue) || numValue < 1.0 || numValue > 10.0) {
            input.classList.add('is-invalid');
            const feedback = document.getElementById(`feedback${input.dataset.judgeId}`);
            if (feedback) {
                feedback.textContent = '1,0 - 10,0 (Komma oder Punkt)';
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
            const value = input.value.trim();
            if (value === '') {
                return null; // Nicht alle Felder ausgefüllt
            }
            
            // NO validation - just parse the value
            const numValue = parseFloat(value.replace(',', '.'));
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

    /**
     * Setup development timestamp display
     * Shows last updated time in development mode only
     */
    setupDevTimestamp() {
        try {
            // Check if running in development mode (localhost or dev server)
            const isDev = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('192.168.') ||
                         window.location.port === '3000';
            
            if (isDev) {
                const devTimestamp = document.getElementById('devTimestamp');
                const lastUpdated = document.getElementById('lastUpdated');
                
                if (devTimestamp && lastUpdated) {
                    // Show the timestamp element
                    devTimestamp.style.display = 'block';
                    
                    // Set current timestamp
                    const now = new Date();
                    const timestamp = now.toLocaleString('de-DE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    
                    lastUpdated.textContent = `Letztes Update: ${timestamp}`;
                    
                    console.log('Development timestamp displayed');
                }
            }
        } catch (error) {
            this.handleError('Development timestamp setup failed', error);
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
        
        // Event Listener für Resize-Events
        window.addEventListener('resize', () => {
            try {
                // Regeneriere Inputs bei Größenänderung für bessere mobile Anpassung
                setTimeout(() => {
                    calculator.generateJudgeInputs();
                }, 100);
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
