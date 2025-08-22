# Poetry Slam Punktesummen-Rechner

Ein moderner, responsiver Punktesummen-Rechner für Poetry Slam Wettbewerbe mit Offline-Funktionalität.

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
git clone https://github.com/marcel-schneuer/slam-calculator.git
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

### **Lokale Entwicklung**
```bash
# Einfacher HTTP-Server für PWA-Testing
python3 -m http.server 8000
# oder
npx serve .

# Öffnen Sie http://localhost:8000
```

### **Cache-Busting**
Bei Änderungen an CSS/JS-Dateien:
1. Version in `index.html` erhöhen: `?v=1.3`
2. Service Worker Cache-Name aktualisieren
3. Manifest-Version anpassen

## 🎯 Zukünftige Verbesserungen

### **Geplante Features**
- **Cloud-Synchronisation**: Server-basierte Datenspeicherung
- **Event-Management**: Mehrere Events verwalten
- **Erweiterte Statistiken**: Detaillierte Analysen
- **Mehrsprachigkeit**: Internationale Unterstützung

### **Technische Verbesserungen**
- **TypeScript**: Für bessere Code-Qualität
- **Testing**: Unit und E2E Tests
- **Build-Process**: Webpack/Vite Integration
- **CI/CD**: Automatisierte Deployments

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstellen Sie einen Pull Request oder öffnen Sie ein Issue.

---

**Entwickelt für Poetry Slam Veranstaltungen** 🎭
