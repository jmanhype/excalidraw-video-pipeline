#!/usr/bin/env node

import { YouTubeUploader } from './youtubeUploader.js';

async function authorize() {
    const code = process.argv[2];
    
    if (!code) {
        console.error('❌ Usage: node src/upload/authorize.js [authorization_code]');
        console.log('');
        console.log('📋 Steps to get authorization code:');
        console.log('1. Run the main pipeline: node src/index.js');
        console.log('2. Copy the authorization URL that appears');
        console.log('3. Open it in your browser and authorize the app');
        console.log('4. Copy the authorization code from the redirect');
        console.log('5. Run: node src/upload/authorize.js YOUR_CODE');
        console.log('');
        console.log('📚 Full setup guide: setup-youtube-oauth2.md');
        process.exit(1);
    }

    try {
        console.log('🔐 Processing authorization code using Context7 best practices...');
        
        const uploader = new YouTubeUploader();
        await uploader.initialize();
        await uploader.handleAuthCode(code);
        
        console.log('✅ Authorization completed successfully!');
        console.log('🎯 YouTube Data API v3 authentication configured');
        console.log('📺 Ready to upload to: https://www.youtube.com/@jmanhype1');
        console.log('🚀 Run the pipeline again: node src/index.js');
        
    } catch (error) {
        console.error('❌ Authorization failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('- Ensure credentials.json exists in project root');
        console.log('- Check that the authorization code is valid and unused');
        console.log('- Verify YouTube Data API v3 is enabled in Google Cloud Console');
        console.log('- Make sure OAuth consent screen is configured properly');
        console.log('- Check redirect URI matches OAuth client configuration');
        console.log('');
        console.log('📖 See setup-youtube-oauth2.md for detailed instructions');
        process.exit(1);
    }
}

authorize();