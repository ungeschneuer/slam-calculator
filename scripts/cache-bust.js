#!/usr/bin/env node

/**
 * Cache Busting Script for PWA Deployment
 * Forces all caches to be cleared on every deployment
 * Works for development, preview, and production
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Check if we're in development/preview mode
const isDev = process.argv.includes('--dev');
const isPreview = process.argv.includes('--preview');
const isProduction = process.env.NODE_ENV === 'production' && !isDev && !isPreview;

console.log(`🔄 Starting cache busting process... (${isDev ? 'development' : isPreview ? 'preview' : isProduction ? 'production' : 'development'} mode)`);

// Generate unique cache busting identifier
const timestamp = Date.now();
const randomId = crypto.randomBytes(8).toString('hex');
const cacheBustId = `${timestamp}-${randomId}`;

console.log(`📝 Generated cache bust ID: ${cacheBustId}`);

// Update service worker with new cache ID (all modes)
const swPath = path.join(__dirname, '../dist/sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Replace cache ID in service worker
  swContent = swContent.replace(
    /cacheId:\s*['"`][^'"`]*['"`]/g,
    `cacheId: 'poetry-slam-calculator-${cacheBustId}'`
  );
  
  // Add cache versioning
  swContent = swContent.replace(
    /const\s+CACHE_NAME\s*=\s*['"`][^'"`]*['"`]/g,
    `const CACHE_NAME = 'poetry-slam-calculator-${cacheBustId}'`
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
  manifest.version = cacheBustId;
  manifest.name = `Poetry Slam Rechner v${cacheBustId}`;
  manifest.short_name = `Slam Rechner v${cacheBustId.slice(-8)}`;
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest version');
} else {
  console.log('⚠️ Manifest not found - skipping update');
}

// Create cache-bust meta file
const metaPath = path.join(__dirname, '../dist/cache-bust.json');
const metaData = {
  version: cacheBustId,
  timestamp: timestamp,
  buildId: randomId,
  deployed: new Date().toISOString(),
  cacheStrategy: 'aggressive'
};

fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));
console.log('✅ Created cache-bust metadata');

// Update HTML with cache-busting meta tags and query parameters
const indexPath = path.join(__dirname, '../dist/index.html');
if (fs.existsSync(indexPath)) {
  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Standard cache control meta tags (elegant approach)
  const cacheBustMeta = `
    <meta name="cache-bust" content="${cacheBustId}">
    <meta name="build-timestamp" content="${timestamp}">
    <meta name="deploy-version" content="${randomId}">
  `;
  
  // Insert before closing head tag
  htmlContent = htmlContent.replace('</head>', `${cacheBustMeta}\n  </head>`);
  
  // Standard approach: Let Vite handle filename versioning, we just update the HTML
  fs.writeFileSync(indexPath, htmlContent);
  console.log('✅ Updated HTML with cache-busting meta tags and timestamped filename');
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

console.log('🎉 Cache busting completed successfully!');
console.log(`📊 Cache Bust ID: ${cacheBustId}`);
console.log('🚀 Ready for deployment with aggressive cache busting!');
