#!/usr/bin/env node

/**
 * Gold Standard PWA Cache Busting Script
 * Implements industry best practices for cache invalidation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PWAVersionManager = require('./version-manager.js');

// Check if we're in development/preview mode
const isDev = process.argv.includes('--dev');
const isPreview = process.argv.includes('--preview');
const isProduction = process.env.NODE_ENV === 'production' && !isDev && !isPreview;

console.log(`🏆 Starting Gold Standard PWA cache busting... (${isDev ? 'development' : isPreview ? 'preview' : isProduction ? 'production' : 'development'} mode)`);

// Initialize version manager
const versionManager = new PWAVersionManager();
const versionInfo = versionManager.updateVersion();
versionManager.updateManifest(versionInfo);
versionManager.createVersionInfo(versionInfo);

console.log(`📦 Gold Standard Version: ${versionInfo.version}`);
console.log(`🔑 Build ID: ${versionInfo.buildId}`);
console.log(`🏷️ Hash: ${versionInfo.hash}`);

// Update service worker with new cache ID (all modes)
const swPath = path.join(__dirname, '../dist/sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Replace cache ID in service worker
  swContent = swContent.replace(
    /cacheId:\s*['"`][^'"`]*['"`]/g,
    `cacheId: 'poetry-slam-calculator-${versionInfo.hash}'`
  );
  
  // Add cache versioning
  swContent = swContent.replace(
    /const\s+CACHE_NAME\s*=\s*['"`][^'"`]*['"`]/g,
    `const CACHE_NAME = 'poetry-slam-calculator-${versionInfo.hash}'`
  );
  
  fs.writeFileSync(swPath, swContent);
  console.log('✅ Updated service worker cache ID');
} else {
  console.log('⚠️ Service worker not found - skipping update');
}

// Update manifest with new version (all modes)
const manifestPath = path.join(__dirname, '../dist/manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = versionInfo.version;
  manifest.name = `Poetry Slam Rechner v${versionInfo.hash}`;
  manifest.short_name = `Slam Rechner v${versionInfo.hash}`;
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest version');
} else {
  console.log('⚠️ Manifest not found - skipping update');
}

// Create cache-bust meta file
const metaPath = path.join(__dirname, '../dist/cache-bust.json');
const metaData = {
  version: versionInfo.version,
  build: versionInfo.build,
  buildId: versionInfo.buildId,
  hash: versionInfo.hash,
  timestamp: versionInfo.timestamp,
  deployed: new Date().toISOString(),
  cacheStrategy: 'gold-standard'
};

fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));
console.log('✅ Created Gold Standard cache metadata');

// Update HTML with Gold Standard PWA version injection
const indexPath = path.join(__dirname, '../dist/index.html');
if (fs.existsSync(indexPath)) {
  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  if (isDev || isPreview) {
    // 🏆 Gold Standard: Dev/Preview - NO CACHING
    const devScript = `
    <script>
      // 🏆 Gold Standard: Development Mode - NO CACHING
      window.VERSION_INFO = {
        version: '${versionInfo.version}',
        build: ${versionInfo.build},
        buildId: '${versionInfo.buildId}',
        hash: '${versionInfo.hash}',
        timestamp: '${versionInfo.timestamp}',
        mode: '${isDev ? 'development' : 'preview'}',
        caching: 'DISABLED'
      };
      self.VERSION_INFO = window.VERSION_INFO;
      
      // Force no caching in dev/preview
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    </script>
    `;
    
    htmlContent = htmlContent.replace('</head>', `${devScript}\n  </head>`);
    console.log('✅ Updated HTML with NO-CACHE development mode');
  } else {
    // Production - Gold Standard PWA version injection
    const versionScript = `
    <script>
      // Gold Standard PWA Version Info
      window.VERSION_INFO = ${JSON.stringify(versionInfo, null, 2)};
      self.VERSION_INFO = ${JSON.stringify(versionInfo, null, 2)};
    </script>
    `;
    
    htmlContent = htmlContent.replace('</head>', `${versionScript}\n  </head>`);
    console.log('✅ Updated HTML with Gold Standard PWA version injection');
  }
  
  fs.writeFileSync(indexPath, htmlContent);
}

// Create .htaccess for Apache servers (only for production)
if (isProduction) {
  const htaccessPath = path.join(__dirname, '../dist/.htaccess');
  const htaccessContent = `
# Industry Standard Cache Control
<IfModule mod_headers.c>
  # HTML files - short cache with revalidation
  <FilesMatch "\\.(html|htm)$">
    Header always set Cache-Control "public, max-age=300, must-revalidate"
    Header always set Vary "Accept-Encoding"
  </FilesMatch>
  
  # Service Worker - no cache
  <FilesMatch "sw\\.js$">
    Header always set Cache-Control "no-cache, no-store, must-revalidate"
    Header always set Pragma "no-cache"
  </FilesMatch>
  
  # Manifest - short cache
  <FilesMatch "manifest\\.webmanifest$">
    Header always set Cache-Control "public, max-age=3600, must-revalidate"
  </FilesMatch>
  
  # Versioned assets - long term cache (Vite handles versioning)
  <FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header always set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

# Standard expiration rules
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 5 minutes"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Version: ${cacheBustId}
# Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(htaccessPath, htaccessContent);
  console.log('✅ Created .htaccess for cache control');
} else {
  console.log(`⏭️ Skipping .htaccess creation (${isDev ? 'development' : isPreview ? 'preview' : 'development'} mode)`);
}

// Server-side cache busting only - no JavaScript required

console.log('🎉 Gold Standard PWA cache busting completed successfully!');
console.log(`📊 Version: ${versionInfo.version}`);
console.log(`🔑 Build ID: ${versionInfo.buildId}`);
console.log(`🏷️ Hash: ${versionInfo.hash}`);
console.log('🚀 Ready for deployment with Gold Standard PWA caching!');
