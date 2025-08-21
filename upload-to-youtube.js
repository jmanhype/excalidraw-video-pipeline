#!/usr/bin/env node

import { google } from 'googleapis';
import { readFileSync, createReadStream, existsSync } from 'fs';
import { resolve } from 'path';
import open from 'open';
import readline from 'readline';

console.log(`
📺 YOUTUBE UPLOAD SCRIPT
🚀 Powered by Claude Code
━━━━━━━━━━━━━━━━━━━━━━━━━
`);

class YouTubeUploader {
    constructor() {
        this.youtube = google.youtube('v3');
        this.oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            'http://localhost:8080/oauth2callback'
        );
    }

    async authenticate() {
        console.log('🔐 Authenticating with YouTube...\n');
        
        // Check for existing credentials
        if (process.env.YOUTUBE_ACCESS_TOKEN) {
            this.oauth2Client.setCredentials({
                access_token: process.env.YOUTUBE_ACCESS_TOKEN,
                refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
            });
            console.log('✅ Using existing credentials');
            return;
        }

        // Generate auth URL
        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/youtube.upload']
        });

        console.log('🌐 Please visit this URL to authorize the application:');
        console.log(authUrl);
        console.log('\n');
        
        // Open browser
        await open(authUrl);
        
        // Get authorization code
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve, reject) => {
            rl.question('Enter the authorization code from the browser: ', async (code) => {
                rl.close();
                
                try {
                    const { tokens } = await this.oauth2Client.getToken(code);
                    this.oauth2Client.setCredentials(tokens);
                    
                    console.log('\n✅ Authentication successful!');
                    console.log('💡 Save these tokens as environment variables:');
                    console.log(`YOUTUBE_ACCESS_TOKEN=${tokens.access_token}`);
                    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async uploadVideo(videoPath, metadataPath) {
        console.log('📤 Starting YouTube upload...\n');
        
        // Load metadata
        const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
        
        // Prepare video resource
        const videoResource = {
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: metadata.title,
                    description: metadata.description,
                    tags: metadata.tags,
                    categoryId: '27' // Education category
                },
                status: {
                    privacyStatus: metadata.visibility || 'private',
                    selfDeclaredMadeForKids: false
                }
            },
            media: {
                body: createReadStream(videoPath)
            }
        };

        try {
            console.log('📹 Uploading video...');
            console.log(`📁 File: ${videoPath}`);
            console.log(`📏 Size: ${(readFileSync(videoPath).length / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📝 Title: ${metadata.title}`);
            console.log(`🏷️  Tags: ${metadata.tags.slice(0, 5).join(', ')}...\n`);

            const response = await this.youtube.videos.insert(videoResource, {
                auth: this.oauth2Client,
                onUploadProgress: (evt) => {
                    const progress = (evt.bytesRead / evt.totalBytes) * 100;
                    process.stdout.write(`\rUpload Progress: ${Math.round(progress)}%`);
                }
            });

            console.log('\n\n✅ Video uploaded successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🎬 Video ID: ${response.data.id}`);
            console.log(`🔗 URL: https://youtube.com/watch?v=${response.data.id}`);
            console.log(`📊 Status: ${response.data.status.privacyStatus}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            return response.data;
            
        } catch (error) {
            console.error('\n❌ Upload failed:', error.message);
            throw error;
        }
    }

    async run(videoPath, metadataPath) {
        try {
            // Check files exist
            if (!existsSync(videoPath)) {
                throw new Error(`Video file not found: ${videoPath}`);
            }
            if (!existsSync(metadataPath)) {
                throw new Error(`Metadata file not found: ${metadataPath}`);
            }

            // Authenticate
            await this.authenticate();
            
            // Upload video
            const result = await this.uploadVideo(videoPath, metadataPath);
            
            // Open video in browser
            const videoUrl = `https://youtube.com/watch?v=${result.id}`;
            console.log('\n🌐 Opening video in browser...');
            await open(videoUrl);
            
            console.log('\n🚀 THE EVERYTHING AGENT DELIVERS TO YOUTUBE!');
            
        } catch (error) {
            console.error('\n❌ Error:', error);
            process.exit(1);
        }
    }
}

// Alternative: Direct browser upload instructions
function showManualUploadInstructions() {
    console.log(`
📺 MANUAL YOUTUBE UPLOAD INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Since YouTube API requires OAuth setup, here's how to upload manually:

1. 🌐 Go to: https://studio.youtube.com

2. 📤 Click "CREATE" → "Upload videos"

3. 📁 Select: output/youtube-ready.mp4

4. 📝 Use this metadata from output/youtube-ready_youtube.json:

   TITLE:
   Excalidraw Animation - ${new Date().toISOString().split('T')[0]}

   DESCRIPTION:
   Progressive animation of Excalidraw drawing with dai-shi features.

   🎨 Features:
   • Progressive stroke animation
   • Smooth path drawing  
   • Text typing effects
   • Pointer tracking
   • 1080p 60fps quality

   ⚡ Created with Excalidraw Video Pipeline
   🚀 Powered by Claude Code - Zero MCP needed
   🎯 The Everything Agent is here!

   TAGS:
   excalidraw, animation, drawing, progressive, svg, dai-shi, 
   visualization, design, tutorial, automated

5. 🎯 Settings:
   • Category: Education
   • Visibility: Public/Unlisted/Private (your choice)
   • Not made for kids

6. ✅ Click "NEXT" → "NEXT" → "PUBLISH"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your video is ready at: output/youtube-ready.mp4
Metadata is at: output/youtube-ready_youtube.json

🚀 THE EVERYTHING AGENT HAS PREPARED EVERYTHING!
`);
}

// Check if running with API credentials
if (process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET) {
    // Run automated upload
    if (process.argv.length < 4) {
        console.log('Usage: node upload-to-youtube.js <video.mp4> <metadata.json>');
        console.log('\nExample:');
        console.log('  node upload-to-youtube.js output/youtube-ready.mp4 output/youtube-ready_youtube.json');
        process.exit(1);
    }

    const uploader = new YouTubeUploader();
    uploader.run(process.argv[2], process.argv[3]);
} else {
    // Show manual instructions
    showManualUploadInstructions();
}