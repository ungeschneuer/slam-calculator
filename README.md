# 🎭 Poetry Slam Punktesummen-Rechner

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/ungeschneuer/slam-calculator)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-enabled-purple.svg)](https://web.dev/progressive-web-apps/)

Ein moderner, responsiver Punktesummen-Rechner für Poetry Slam Wettbewerbe mit vollständiger Offline-Funktionalität. Entwickelt als Progressive Web App (PWA) für optimale Performance und Benutzerfreundlichkeit auf allen Geräten.

## 🌟 Features

### 📊 **Kernfunktionen**
- **Dynamische Jury-Verwaltung**: 3-15 Juror*innen einstellbar
- **Intelligente Berechnung**: Kleinste und größte Bewertung werden gestrichen
- **Dezimalzahlen**: Bewertungen von 1,0 bis 10,0 mit Komma-Trennung
- **Echtzeit-Validierung**: Sofortige Überprüfung der Eingaben

### 📱 **Mobile Optimierung**
- **Responsive Design**: Optimiert für alle Bildschirmgrößen
- **Touch-freundlich**: Große Touch-Targets für mobile Geräte
- **Landscape-Modus**: Spezielle Optimierung für Querformat
- **iPhone-Optimierung**: Numerisches Keypad, Zoom-Verhinderung

### 🎨 **UI/UX Features**
- **Dark Mode**: Automatische Erkennung und manueller Toggle
- **Smooth Animationen**: Übergänge und Feedback-Animationen
- **Auto-Save**: Automatisches Speichern von Eingaben
- **Keyboard Navigation**: Pfeiltasten und Enter für schnelle Eingabe

### 📋 **History & Export**
- **Persistente Speicherung**: localStorage-basiert
- **Dual-View**: Listen- und Tabellenansicht
- **Export-Funktionen**: CSV und JSON Export
- **Teilnehmer-Namen**: Optionale Speicherung von Namen

### 🔧 **PWA Features**
- **Vollständig Offline**: Funktioniert ohne Internetverbindung
- **Installierbar**: Kann als App installiert werden
- **Service Worker**: Intelligente Cache-Strategien
- **Update-Benachrichtigungen**: Automatische Update-Hinweise

## 🚀 Installation

### **Lokale Installation (Empfohlen)**
Die App ist vollständig lokal installiert und benötigt keine externen CDN-Abhängigkeiten.

```bash
# Repository klonen
git clone https://github.com/ungeschneuer/slam-calculator.git
cd slam-calculator

# Lokale Dateien sind bereits vorhanden:
# - assets/css/bootstrap.min.css
# - assets/js/bootstrap.bundle.min.js  
# - assets/css/bootstrap-icons.css
# - assets/fonts/bootstrap-icons.woff2
```

### **Verwendung**
1. Öffnen Sie `index.html` in einem modernen Browser
2. Die App funktioniert sofort ohne weitere Installation
3. Für PWA-Features: Über HTTPS oder localhost ausführen

## 📖 Verwendung

### **Grundlegende Bedienung**
1. **Jury einrichten**: Anzahl der Juror*innen mit +/- Buttons anpassen
2. **Bewertungen eingeben**: Punkte von 1,0 bis 10,0 für jeden Juror
3. **Berechnen**: "Berechnen" Button klicken
4. **Ergebnis speichern**: "Reset" Button für History-Speicherung

### **Keyboard Shortcuts**
- `Ctrl/Cmd + Enter`: Berechnung starten
- `Ctrl/Cmd + S`: Ergebnis speichern
- `Ctrl/Cmd + V`: History-Ansicht wechseln
- `Enter/Arrow Keys`: Zwischen Eingabefeldern navigieren

### **Mobile Bedienung**
- **Touch-Navigation**: Große Buttons für einfache Bedienung
- **Numerisches Keypad**: Automatisch bei Punkte-Eingabe
- **Swipe-Gesten**: Unterstützung für Touch-Gesten
- **Landscape-Optimierung**: Automatische Anpassung

## 🛠 Technische Details

### **Architektur**
- **Vanilla JavaScript**: Keine Framework-Abhängigkeiten
- **Bootstrap 5**: Lokal eingebunden für UI-Komponenten
- **CSS3**: Moderne Styling mit Custom Properties
- **HTML5**: Semantische Struktur

### **PWA Implementation**
- **Service Worker**: Cache-First Strategie für Assets
- **Manifest**: Vollständige PWA-Konfiguration
- **Offline-First**: Funktioniert ohne Internetverbindung
- **Background Sync**: Vorbereitung für Server-Synchronisation

### **Performance**
- **Lazy Loading**: Assets werden bei Bedarf geladen
- **Minifizierte Dateien**: Optimierte Größe für schnelle Ladezeiten
- **Cache-Strategien**: Intelligente Ressourcen-Verwaltung
- **Touch-Optimierung**: Reduzierte Latenz bei Touch-Events

### **Browser-Kompatibilität**
- **Chrome/Edge**: Vollständige PWA-Unterstützung
- **Firefox**: PWA-Features verfügbar
- **Safari**: Grundlegende PWA-Funktionalität
- **Mobile Browser**: Optimiert für iOS Safari und Chrome Mobile

## 📁 Projektstruktur

```
slam-calculator/
├── index.html              # Haupt-HTML-Datei
├── styles.css              # Custom CSS-Styles
├── app.js                  # Haupt-JavaScript-Logik
├── manifest.json           # PWA-Manifest
├── sw.js                   # Service Worker
├── README.md               # Dokumentation
└── assets/                 # Lokale Assets
    ├── css/
    │   ├── bootstrap.min.css
    │   └── bootstrap-icons.css
    ├── js/
    │   └── bootstrap.bundle.min.js
    └── fonts/
        └── bootstrap-icons.woff2
```

## 🔧 Entwicklung

### **Setup für lokale Entwicklung**
```bash
# Repository klonen
git clone https://github.com/ungeschneuer/slam-calculator.git
cd slam-calculator

# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Für PWA-Testing (mit Service Worker)
npm run build
npm run preview
```

### **Verfügbare Scripts**
```bash
npm run dev       # Development Server (Vite)
npm run build     # Production Build
npm run preview   # Preview der Production Build
npm run clean     # Build-Ordner löschen
```

### **Code-Qualität**
Das Projekt verwendet moderne JavaScript-Standards:
- **ES6+ Syntax**: Classes, Arrow Functions, Async/Await
- **JSDoc Kommentare**: Vollständige API-Dokumentation
- **Error Handling**: Umfassendes Fehler-Management
- **Performance Optimierung**: Lazy Loading, Caching-Strategien

## 📚 API Dokumentation

### **Hauptklasse: PoetrySlamCalculator**

Die Anwendung basiert auf einer einzigen Hauptklasse, die alle Funktionalitäten kapselt:

```javascript
/**
 * Poetry Slam Punktesummen-Rechner
 * @class PoetrySlamCalculator
 * @version 1.3.0
 */
class PoetrySlamCalculator {
    // Kern-Funktionalitäten
    calculateScore()     // Berechnet Slam-Ergebnis
    addJudge()          // Fügt Juror hinzu
    removeJudge()       // Entfernt Juror
    
    // Daten-Management
    saveAndReset()      // Speichert in History und resettet
    loadHistory()       // Lädt gespeicherte Historie
    exportCSV()         // CSV-Export der Historie
    exportJSON()        // JSON-Export der Historie
    
    // Timer-Funktionen
    startTimer()        // Startet Performance-Timer
    pauseTimer()        // Pausiert Timer
    resumeTimer()       // Setzt Timer fort
    stopTimer()         // Stoppt Timer
    
    // UI-Management
    toggleTheme()       // Wechselt Dark/Light Mode
    toggleView()        // Wechselt Listen-/Tabellenansicht
    showHelp()          // Zeigt Hilfe-Modal
}
```

### **Datenstrukturen**

#### **Score-Berechnung**
```javascript
{
    total: 28.5,           // Gesamtergebnis
    scores: [9.2, 9.8, 9.5, 9.1, 8.9],  // Alle Bewertungen
    validScores: [9.2, 9.5, 9.1],       // Gewertete Scores
    excludedScores: [9.8, 8.9],         // Ausgeschlossene Scores
    participantName: "Max Mustermann",    // Optional
    timestamp: "2024-01-15T14:30:00Z"    // ISO Timestamp
}
```

#### **History-Eintrag**
```javascript
{
    id: "unique-id-123",
    timestamp: "2024-01-15T14:30:00Z",
    participantName: "Max Mustermann",
    total: 28.5,
    scores: [9.2, 9.8, 9.5, 9.1, 8.9],
    validScores: [9.2, 9.5, 9.1],
    excludedScores: [9.8, 8.9],
    judgeCount: 5
}
```

### **Event-System**

#### **Keyboard Shortcuts**
```javascript
// Globale Shortcuts (Ctrl/Cmd + Key)
'Ctrl+Enter'  → calculateScore()
'Ctrl+S'      → saveAndReset()
'Ctrl+V'      → toggleView()
'Ctrl+T'      → startTimer()
'Ctrl+P'      → pauseTimer()/resumeTimer()
'Ctrl+H'      → showHelp()

// Einzelne Tasten (außerhalb von Eingabefeldern)
'T'           → startTimer()
'P'           → pauseTimer()/resumeTimer()
'S'           → stopTimer()
'H'           → showHelp()
```

#### **Auto-Save**
```javascript
// Automatisches Speichern nach 1 Sekunde Inaktivität
autoSaveDelay: 1000  // Millisekunden
```

### **Storage-Management**

#### **localStorage Keys**
```javascript
'poetrySlamHistory'    // Historie der Berechnungen
'poetrySlamAutoSave'   // Auto-gespeicherte Eingaben
'theme'                // Ausgewähltes Theme (dark/light)
'viewMode'             // Aktuelle Ansicht (list/table)
'helpUsageCount'       // Anzahl Hilfe-Aufrufe
'poetrySlamErrors'     // Error-Log für Debugging
```

### **Fehler-Behandlung**

Das System verwendet mehrstufiges Error-Handling:

1. **Try-Catch Blöcke**: In allen kritischen Funktionen
2. **Error-Logging**: Automatische Fehler-Protokollierung
3. **User-Feedback**: Benutzerfreundliche Fehlermeldungen
4. **Graceful Degradation**: Funktionalität bleibt bei Teilfehlern erhalten

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.

