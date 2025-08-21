#!/usr/bin/env node

import { google } from 'googleapis';
import { readFileSync, createReadStream, writeFileSync, existsSync } from 'fs';
import { createServer } from 'http';
import { URL } from 'url';
import open from 'open';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log(`
🚀 YOUTUBE OAUTH UPLOAD
━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// OAuth2 Configuration
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_PORT = 3333;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;
const TOKEN_PATH = resolve(__dirname, '.youtube-token.json');

class YouTubeOAuthUploader {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
        );
        
        this.youtube = google.youtube({
            version: 'v3',
            auth: this.oauth2Client
        });
    }

    async loadSavedToken() {
        try {
            if (existsSync(TOKEN_PATH)) {
                const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
                this.oauth2Client.setCredentials(token);
                console.log('✅ Loaded saved authentication token');
                
                // Check if token is expired and refresh if needed
                if (token.expiry_date && token.expiry_date < Date.now()) {
                    console.log('🔄 Token expired, refreshing...');
                    const { credentials } = await this.oauth2Client.refreshAccessToken();
                    this.oauth2Client.setCredentials(credentials);
                    this.saveToken(credentials);
                }
                return true;
            }
        } catch (err) {
            console.log('⚠️ No saved token found, need to authenticate');
        }
        return false;
    }

    saveToken(token) {
        writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
        console.log('💾 Token saved for future use');
    }

    async authenticate() {
        // Try to load saved token first
        if (await this.loadSavedToken()) {
            return;
        }

        console.log('🔐 Starting OAuth authentication...\n');
        
        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/youtube.upload',
                'https://www.googleapis.com/auth/youtube'
            ],
            prompt: 'consent'
        });

        // Create temporary server to handle OAuth callback
        const server = createServer();
        
        const authPromise = new Promise((resolve, reject) => {
            server.on('request', async (req, res) => {
                const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
                
                if (url.pathname === '/oauth2callback') {
                    const code = url.searchParams.get('code');
                    
                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(`
                            <html>
                                <body style="font-family: Arial; padding: 40px; text-align: center;">
                                    <h1>✅ Authentication Successful!</h1>
                                    <p>You can close this window and return to the terminal.</p>
                                    <script>setTimeout(() => window.close(), 2000)</script>
                                </body>
                            </html>
                        `);
                        
                        server.close();
                        
                        try {
                            const { tokens } = await this.oauth2Client.getToken(code);
                            this.oauth2Client.setCredentials(tokens);
                            this.saveToken(tokens);
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        res.writeHead(400);
                        res.end('No code received');
                        reject(new Error('No authorization code received'));
                    }
                }
            });
        });

        server.listen(REDIRECT_PORT, () => {
            console.log(`📡 OAuth callback server listening on port ${REDIRECT_PORT}`);
            console.log('🌐 Opening browser for authentication...\n');
            open(authUrl);
        });

        await authPromise;
        console.log('\n✅ Authentication complete!');
    }

    async uploadVideo(videoPath, metadataPath) {
        console.log('\n📤 Uploading to YouTube...\n');
        
        const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
        const fileSize = (readFileSync(videoPath).length / 1024 / 1024).toFixed(2);
        
        console.log(`📹 Video: ${videoPath}`);
        console.log(`📏 Size: ${fileSize} MB`);
        console.log(`📝 Title: ${metadata.title}`);
        console.log(`🏷️ Tags: ${metadata.tags.slice(0, 5).join(', ')}...\n`);

        try {
            const response = await this.youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: metadata.title,
                        description: metadata.description,
                        tags: metadata.tags,
                        categoryId: '27', // Education
                        defaultLanguage: 'en',
                        defaultAudioLanguage: 'en'
                    },
                    status: {
                        privacyStatus: 'unlisted', // Start as unlisted for safety
                        selfDeclaredMadeForKids: false,
                        embeddable: true,
                        publicStatsViewable: true
                    }
                },
                media: {
                    body: createReadStream(videoPath)
                }
            }, {
                onUploadProgress: (evt) => {
                    const progress = Math.round((evt.bytesRead / fileSize / 1024 / 1024) * 100);
                    process.stdout.write(`\r⬆️ Upload Progress: ${progress}%`);
                }
            });

            console.log('\n\n' + '═'.repeat(50));
            console.log('✅ VIDEO UPLOADED SUCCESSFULLY!');
            console.log('═'.repeat(50));
            console.log(`\n🎬 Video ID: ${response.data.id}`);
            console.log(`🔗 Watch at: https://youtube.com/watch?v=${response.data.id}`);
            console.log(`📊 Status: ${response.data.status.privacyStatus}`);
            console.log(`✏️ Edit at: https://studio.youtube.com/video/${response.data.id}/edit`);
            console.log('\n🚀 THE EVERYTHING AGENT DELIVERS!');
            
            // Open the video in browser
            setTimeout(() => {
                console.log('\n🌐 Opening video in browser...');
                open(`https://youtube.com/watch?v=${response.data.id}`);
            }, 1000);
            
            return response.data;
            
        } catch (error) {
            if (error.message?.includes('quotaExceeded')) {
                console.error('\n❌ YouTube API quota exceeded for today');
                console.error('Try again tomorrow or use manual upload');
            } else if (error.message?.includes('forbidden')) {
                console.error('\n❌ Channel not verified or API not enabled');
                console.error('Make sure YouTube Data API v3 is enabled in Google Cloud Console');
            } else {
                console.error('\n❌ Upload failed:', error.message);
            }
            throw error;
        }
    }

    async run() {
        const videoPath = resolve(__dirname, 'output/youtube-ready.mp4');
        const metadataPath = resolve(__dirname, 'output/youtube-ready_youtube.json');
        
        // Check files exist
        if (!existsSync(videoPath)) {
            console.error(`❌ Video not found: ${videoPath}`);
            console.log('\n💡 Run this first: node excalidraw-to-youtube.js sample.excalidraw');
            process.exit(1);
        }
        
        if (!existsSync(metadataPath)) {
            console.error(`❌ Metadata not found: ${metadataPath}`);
            process.exit(1);
        }

        try {
            await this.authenticate();
            await this.uploadVideo(videoPath, metadataPath);
        } catch (error) {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        }
    }
}

// Run the uploader
const uploader = new YouTubeOAuthUploader();
uploader.run();