# 🚀 Aggressive Cache Busting System

This document explains the comprehensive cache busting system implemented to force all PWA caches and assets to reload on every deployment.

## 📋 Overview

The cache busting system consists of multiple layers:

1. **Build-time cache busting** - Unique identifiers for all assets
2. **Service worker cache busting** - Dynamic cache IDs
3. **Client-side cache busting** - Browser cache invalidation
4. **Server-side cache control** - HTTP headers for cache control

## 🔧 Components

### 1. Build Scripts

#### `scripts/cache-bust.js`
- **Purpose**: Post-build cache busting script
- **Function**: Updates service worker, manifest, and HTML with unique identifiers
- **Usage**: `node scripts/cache-bust.js`

#### `scripts/client-cache-bust.js`
- **Purpose**: Client-side cache invalidation
- **Function**: Clears browser caches and forces service worker updates
- **Usage**: Automatically loaded in HTML

### 2. Package.json Scripts

```json
{
  "build:cache-bust": "vite build && node scripts/cache-bust.js",
  "build:pages:cache-bust": "NODE_ENV=production vite build && node scripts/cache-bust.js",
  "preview:fresh": "npm run clean && npm run build:cache-bust && vite preview",
  "deploy": "npm run build:pages:cache-bust && echo 'Build completed with cache busting. Push to main branch to deploy.'",
  "cache-bust": "node scripts/cache-bust.js"
}
```

### 3. Vite Configuration

#### Asset Naming with Timestamps
```javascript
assetFileNames: (assetInfo) => {
  const timestamp = Date.now();
  // Assets get unique timestamps: [name]-[timestamp]-[hash][extname]
}
```

#### Dynamic Cache IDs
```javascript
cacheId: `poetry-slam-calculator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

### 4. GitHub Actions Workflow

#### `.github/workflows/deploy-with-cache-bust.yml`
- **Trigger**: Push to main branch
- **Function**: Builds with cache busting and deploys to GitHub Pages
- **Cache Strategy**: Aggressive - forces all caches to reload

## 🎯 How It Works

### Build Process

1. **Vite Build**: Creates assets with unique timestamps
2. **Cache Bust Script**: Updates service worker and manifest
3. **Client Script**: Prepares for browser-side cache invalidation
4. **Deployment**: All assets have unique identifiers

### Runtime Process

1. **Client Detection**: Browser detects new version via meta tags
2. **Cache Clearing**: All browser caches are cleared
3. **Service Worker Update**: New service worker is registered
4. **Force Reload**: Page reloads with fresh assets

## 📊 Cache Busting Strategies

### 1. Asset Versioning
- **Files**: All assets get unique timestamps
- **Format**: `[name]-[timestamp]-[hash][extname]`
- **Example**: `app-1759185500049-BUO1kOa3.js`

### 2. Service Worker Cache IDs
- **Format**: `poetry-slam-calculator-[timestamp]-[random]`
- **Example**: `poetry-slam-calculator-1759185500049-e120d36b491ae429`

### 3. Manifest Versioning
- **Version**: Unique timestamp-based ID
- **Name**: Includes version identifier
- **Example**: `Poetry Slam Rechner v1759185500049-e120d36b491ae429`

### 4. HTML Meta Tags
```html
<meta name="cache-bust" content="1759185500049-e120d36b491ae429">
<meta name="build-timestamp" content="1759185500049">
<meta name="deploy-version" content="e120d36b491ae429">
```

## 🚀 Usage

### Development
```bash
# Build with cache busting
npm run build:cache-bust

# Preview with fresh cache
npm run preview:fresh
```

### Production
```bash
# Production build with cache busting
npm run build:pages:cache-bust

# Deploy with cache busting
npm run deploy
```

### Manual Cache Busting
```bash
# Run cache busting on existing build
npm run cache-bust
```

## 🔍 Monitoring

### Cache Bust Metadata
File: `dist/cache-bust.json`
```json
{
  "version": "1759185500049-e120d36b491ae429",
  "timestamp": 1759185500049,
  "buildId": "e120d36b491ae429",
  "deployed": "2025-09-29T22:38:20.049Z",
  "cacheStrategy": "aggressive"
}
```

### Client-Side Monitoring
```javascript
// Check cache bust ID
console.log('Cache Bust ID:', document.querySelector('meta[name="cache-bust"]').content);

// Force manual cache bust
window.forceCacheBust();
```

## 🛠️ Troubleshooting

### Common Issues

1. **Service Worker Not Updating**
   - **Solution**: Check cache-bust.json for new version
   - **Manual Fix**: `window.forceCacheBust()`

2. **Assets Not Loading**
   - **Solution**: Check asset timestamps in build output
   - **Manual Fix**: Hard refresh (Ctrl+F5)

3. **PWA Not Installing**
   - **Solution**: Clear browser data and retry
   - **Manual Fix**: Uninstall and reinstall PWA

### Debug Commands

```bash
# Check build output
ls -la dist/

# Check cache bust metadata
cat dist/cache-bust.json

# Check service worker
cat dist/sw.js | grep cacheId
```

## 📈 Performance Impact

### Positive Effects
- ✅ **Guaranteed Fresh Content**: Users always get latest version
- ✅ **No Stale Data**: Eliminates cache-related bugs
- ✅ **Immediate Updates**: Changes are visible instantly

### Considerations
- ⚠️ **Larger Downloads**: Assets are re-downloaded on each update
- ⚠️ **Network Usage**: Increased bandwidth for frequent updates
- ⚠️ **Build Time**: Slightly longer build process

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Build Output**: Check for unique timestamps
2. **Verify Cache Clearing**: Test on different devices
3. **Update Dependencies**: Keep cache busting scripts current

### Optimization
1. **Selective Busting**: Only bust changed assets
2. **Smart Caching**: Cache static assets longer
3. **Incremental Updates**: Update only changed components

## 📚 References

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

**Last Updated**: 2025-09-29  
**Version**: 1.3.1  
**Cache Strategy**: Aggressive
