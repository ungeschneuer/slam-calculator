// Poetry Slam Punktesummen-Rechner
class PoetrySlamCalculator {
    constructor() {
        this.minJudges = 3;
        this.maxJudges = 15;
        this.currentJudgeCount = 5;
        this.history = [];
        this.currentResult = null;
        this.currentView = 'list'; // 'list' oder 'table'
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 2000; // 2 Sekunden
        
        this.init();
    }

    init() {
        this.loadHistory();
        this.setupEventListeners();
        this.setupDarkMode();
        this.generateJudgeInputs();
        this.updateJudgeCount();
        this.loadTheme();
        this.loadViewPreference();
        this.registerServiceWorker();
        this.setupOfflineMonitoring();
    }

    setupEventListeners() {
        // Button Event Listeners
        document.getElementById('addJudge').addEventListener('click', () => this.addJudge());
        document.getElementById('removeJudge').addEventListener('click', () => this.removeJudge());
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculateScore());
        document.getElementById('resetBtn').addEventListener('click', () => this.saveAndReset());
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
        document.getElementById('toggleTheme').addEventListener('click', () => this.toggleTheme());
        
        // View Toggle
        document.getElementById('viewToggle').addEventListener('click', () => this.toggleView());
        
        // Export Buttons
        document.getElementById('exportCSV').addEventListener('click', () => this.exportCSV());
        document.getElementById('exportJSON').addEventListener('click', () => this.exportJSON());

        // Input Event Listeners mit Auto-Save
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('judge-input')) {
                this.validateInput(e.target);
                this.triggerAutoSave(e.target);
            } else if (e.target.id === 'participantName') {
                this.triggerAutoSave(e.target);
            }
        });

        // Keyboard Navigation für Input-Felder
        document.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('judge-input')) {
                if (e.key === 'Enter' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.focusNextInput(e.target);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.focusPreviousInput(e.target);
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
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
                }
            }
        });

        // Touch Events für bessere Mobile-Erfahrung
        document.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('btn')) {
                e.target.style.transform = 'scale(0.95)';
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (e.target.classList.contains('btn')) {
                setTimeout(() => {
                    e.target.style.transform = '';
                }, 150);
            }
        }, { passive: true });
    }

    setupDarkMode() {
        // Check for system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.setTheme('dark');
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        }
    }

    loadViewPreference() {
        const savedView = localStorage.getItem('viewMode');
        if (savedView) {
            this.currentView = savedView;
        }
        this.updateView();
    }

    // PWA Service Worker Registrierung
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });

                // Handle service worker updates
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('Service Worker updated, reloading...');
                    window.location.reload();
                });

            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
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
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
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
            this.showNotification('Verbindung wiederhergestellt', 'success');
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
                console.log('Syncing offline data:', data);
                
                // Hier könnte die Synchronisation mit einem Server erfolgen
                // await this.syncToServer(data);
                
                // Clear offline data after successful sync
                localStorage.removeItem('poetrySlamOfflineData');
                this.showNotification('Offline-Daten synchronisiert', 'success');
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

    validateInput(input) {
        const value = input.value.replace(',', '.');
        const numValue = parseFloat(value);
        
        input.classList.remove('is-valid', 'is-invalid');
        
        if (value === '') {
            return false;
        }
        
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
            const value = input.value.trim();
            if (value === '') {
                return null; // Nicht alle Felder ausgefüllt
            }
            
            if (!this.validateInput(input)) {
                return null; // Ungültige Eingabe
            }
            
            const numValue = parseFloat(value.replace(',', '.'));
            scores.push(numValue);
        }
        
        return scores;
    }

    calculateScore() {
        const scores = this.getScores();
        
        if (!scores) {
            this.showNotification('Bitte füllen Sie alle Felder mit gültigen Werten (1,0 - 10,0) aus', 'error');
            return;
        }

        // Zeige Progress Bar
        this.showProgressBar();

        // Simuliere kurze Berechnungszeit für bessere UX
        setTimeout(() => {
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
                participantName: document.getElementById('participantName').value.trim()
            };
            
            this.hideProgressBar();
            this.displayResult();
            this.showNotification('Berechnung erfolgreich!', 'success');
        }, 500);
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
        
        // Füge zur History hinzu
        this.history.unshift(historyEntry);
        this.saveHistory();
        this.displayHistory();
        
        // Reset
        this.resetForm();
        this.currentResult = null;
        
        this.showNotification('Ergebnis gespeichert und Formular zurückgesetzt', 'success');
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
        const saved = localStorage.getItem('poetrySlamHistory');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch (e) {
                console.error('Fehler beim Laden der History:', e);
                this.history = [];
            }
        }
        this.displayHistory();
    }

    saveHistory() {
        try {
            localStorage.setItem('poetrySlamHistory', JSON.stringify(this.history));
        } catch (e) {
            console.error('Fehler beim Speichern der History:', e);
            this.showNotification('Fehler beim Speichern der History', 'error');
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
        
        historyList.innerHTML = this.history.map(entry => `
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
                        <div>${entry.excludedScores.map(s => s.toFixed(1).replace('.', ',')).join(', ')}</div>
                    </div>
                    <div class="included-scores">
                        <small>Gewertet</small>
                        <div>${entry.includedScores.map(s => s.toFixed(1).replace('.', ',')).join(', ')}</div>
                    </div>
                </div>
            </div>
        `).join('');
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
        this.showNotification('Eintrag gelöscht', 'success');
    }

    clearHistory() {
        if (confirm('Möchten Sie wirklich die gesamte History löschen?')) {
            this.history = [];
            this.saveHistory();
            this.displayHistory();
            this.showNotification('History gelöscht', 'success');
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
        this.showNotification('CSV Export erfolgreich!', 'success');
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
        this.showNotification('JSON Export erfolgreich!', 'success');
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
        const toast = document.getElementById('notificationToast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        
        // Entferne alte Klassen
        toast.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
        
        // Füge neue Klasse hinzu
        switch (type) {
            case 'success':
                toast.classList.add('bg-success', 'text-white');
                break;
            case 'error':
                toast.classList.add('bg-danger', 'text-white');
                break;
            case 'warning':
                toast.classList.add('bg-warning', 'text-dark');
                break;
            default:
                toast.classList.add('bg-info', 'text-white');
        }
        
        // Zeige Toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    // PWA Service Worker Registration
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registriert:', registration);
                })
                .catch(error => {
                    console.log('Service Worker Registrierung fehlgeschlagen:', error);
                });
        }
    }
}

// Initialisiere die App
let calculator;

document.addEventListener('DOMContentLoaded', () => {
    calculator = new PoetrySlamCalculator();
    calculator.registerServiceWorker();
    
    // Event Listener für Resize-Events
    window.addEventListener('resize', () => {
        // Regeneriere Inputs bei Größenänderung für bessere mobile Anpassung
        setTimeout(() => {
            calculator.generateJudgeInputs();
        }, 100);
    });
});

// Install-Prompt für PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Optional: Zeige Install-Button
    if (deferredPrompt) {
        // Hier könnte ein Install-Button angezeigt werden
        console.log('PWA kann installiert werden');
    }
});
