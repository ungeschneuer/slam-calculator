#!/usr/bin/env node

/**
 * Cache Busting Script for PWA Deployment
 * Forces all caches to be cleared on every deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔄 Starting cache busting process...');

// Generate unique cache busting identifier
const timestamp = Date.now();
const randomId = crypto.randomBytes(8).toString('hex');
const cacheBustId = `${timestamp}-${randomId}`;

console.log(`📝 Generated cache bust ID: ${cacheBustId}`);

// Update service worker with new cache ID
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
}

// Update manifest with new version
const manifestPath = path.join(__dirname, '../dist/manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = cacheBustId;
  manifest.name = `Poetry Slam Rechner v${cacheBustId}`;
  manifest.short_name = `Slam Rechner v${cacheBustId.slice(-8)}`;
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest version');
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

// Update HTML with cache-busting meta tags
const indexPath = path.join(__dirname, '../dist/index.html');
if (fs.existsSync(indexPath)) {
  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add cache-busting meta tags
  const cacheBustMeta = `
    <meta name="cache-bust" content="${cacheBustId}">
    <meta name="build-timestamp" content="${timestamp}">
    <meta name="deploy-version" content="${randomId}">
  `;
  
  // Insert before closing head tag
  htmlContent = htmlContent.replace('</head>', `${cacheBustMeta}\n  </head>`);
  
  fs.writeFileSync(indexPath, htmlContent);
  console.log('✅ Updated HTML with cache-busting meta tags');
}

// Create .htaccess for Apache servers (if needed)
const htaccessPath = path.join(__dirname, '../dist/.htaccess');
const htaccessContent = `
# Cache Busting Configuration
<IfModule mod_headers.c>
  # Force no-cache for HTML files
  <FilesMatch "\\.(html|htm)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>
  
  # Cache static assets with versioning
  <FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  
  # Force revalidation of service worker
  <FilesMatch "sw\\.js$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>
</IfModule>

# Version: ${cacheBustId}
`;

fs.writeFileSync(htaccessPath, htaccessContent);
console.log('✅ Created .htaccess for cache control');

console.log('🎉 Cache busting completed successfully!');
console.log(`📊 Cache Bust ID: ${cacheBustId}`);
console.log('🚀 Ready for deployment with aggressive cache busting!');
