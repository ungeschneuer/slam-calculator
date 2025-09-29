#!/usr/bin/env node

/**
 * Gold Standard PWA Version Management
 * Implements industry-standard versioning for PWA cache invalidation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PWAVersionManager {
    constructor() {
        this.versionFile = path.join(__dirname, '../src/version.json');
        this.manifestPath = path.join(__dirname, '../public/manifest.webmanifest');
        this.distPath = path.join(__dirname, '../dist');
    }

    /**
     * Generate a semantic version with build metadata
     */
    generateVersion() {
        const now = new Date();
        const timestamp = now.getTime();
        const buildId = crypto.randomBytes(4).toString('hex');
        
        // Semantic versioning: major.minor.patch+build
        const version = {
            major: 1,
            minor: 3,
            patch: 1,
            build: timestamp,
            buildId: buildId,
            timestamp: now.toISOString(),
            hash: crypto.createHash('sha256')
                .update(`${timestamp}-${buildId}`)
                .digest('hex')
                .substring(0, 8)
        };

        return {
            version: `${version.major}.${version.minor}.${version.patch}+${version.buildId}`,
            build: version.build,
            buildId: version.buildId,
            hash: version.hash,
            timestamp: version.timestamp
        };
    }

    /**
     * Update version files
     */
    updateVersion() {
        const versionInfo = this.generateVersion();
        
        // Create version.json for runtime access
        const versionData = {
            version: versionInfo.version,
            build: versionInfo.build,
            buildId: versionInfo.buildId,
            hash: versionInfo.hash,
            timestamp: versionInfo.timestamp,
            generated: new Date().toISOString()
        };

        // Write to src for development
        fs.writeFileSync(this.versionFile, JSON.stringify(versionData, null, 2));
        
        // Write to dist for production
        const distVersionPath = path.join(this.distPath, 'version.json');
        if (fs.existsSync(this.distPath)) {
            fs.writeFileSync(distVersionPath, JSON.stringify(versionData, null, 2));
        }

        console.log(`📦 Version updated: ${versionInfo.version}`);
        return versionInfo;
    }

    /**
     * Update manifest with version
     */
    updateManifest(versionInfo) {
        if (fs.existsSync(this.manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
            manifest.version = versionInfo.version;
            manifest.name = `Poetry Slam Rechner v${versionInfo.hash}`;
            manifest.short_name = `Slam Rechner v${versionInfo.hash}`;
            
            fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
            console.log('✅ Manifest updated with version');
        }
    }

    /**
     * Create version info for service worker
     */
    createVersionInfo(versionInfo) {
        const versionInfoContent = `
// Auto-generated version info - DO NOT EDIT
export const VERSION_INFO = {
    version: '${versionInfo.version}',
    build: ${versionInfo.build},
    buildId: '${versionInfo.buildId}',
    hash: '${versionInfo.hash}',
    timestamp: '${versionInfo.timestamp}',
    generated: '${new Date().toISOString()}'
};

export const CACHE_VERSION = 'v${versionInfo.hash}';
export const CACHE_NAME = 'poetry-slam-calculator-${versionInfo.hash}';
`;

        const versionInfoPath = path.join(__dirname, '../src/version-info.js');
        fs.writeFileSync(versionInfoPath, versionInfoContent);
        console.log('✅ Version info created for service worker');
    }
}

// CLI usage
if (require.main === module) {
    const manager = new PWAVersionManager();
    const versionInfo = manager.updateVersion();
    manager.updateManifest(versionInfo);
    manager.createVersionInfo(versionInfo);
    
    console.log('🎉 Gold Standard PWA Version Management Complete!');
    console.log(`📊 Version: ${versionInfo.version}`);
    console.log(`🔑 Build ID: ${versionInfo.buildId}`);
    console.log(`🏷️ Hash: ${versionInfo.hash}`);
}

module.exports = PWAVersionManager;
