import { google } from 'googleapis';
import fs from 'fs-extra';
import { join } from 'path';
import { createReadStream } from 'fs';

export class YouTubeUploader {
    constructor(config = {}) {
        this.config = {
            scopes: ['https://www.googleapis.com/auth/youtube.upload'],
            credentialsPath: config.credentialsPath || './credentials.json',
            tokenPath: config.tokenPath || './token.json',
            ...config
        };
        
        this.oauth2Client = null;
        this.youtube = null;
    }

    async initialize() {
        try {
            console.log('🔐 Initializing YouTube Data API v3 OAuth2 authentication...');
            
            // Load OAuth2 credentials
            const credentials = await this.loadCredentials();
            
            // Create OAuth2 client
            const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
            this.oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            
            // Load existing token or create new one
            const token = await this.loadToken();
            if (token) {
                this.oauth2Client.setCredentials(token);
                console.log('✅ Using existing authentication token');
            } else {
                console.log('🔑 No existing token found. Authorization required.');
                await this.authorize();
            }
            
            // Initialize YouTube API client
            this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
            
            console.log('✅ YouTube Data API v3 initialized successfully');
            
        } catch (error) {
            throw new Error(`YouTube API initialization failed: ${error.message}`);
        }
    }
    
    async loadCredentials() {
        try {
            const credentialsPath = this.config.credentialsPath;
            console.log(`📋 Loading OAuth2 credentials from: ${credentialsPath}`);
            
            if (!await fs.pathExists(credentialsPath)) {
                throw new Error(`Credentials file not found at ${credentialsPath}. Please download it from Google Cloud Console.`);
            }
            
            return await fs.readJson(credentialsPath);
            
        } catch (error) {
            throw new Error(`Failed to load credentials: ${error.message}`);
        }
    }
    
    async loadToken() {
        try {
            const tokenPath = this.config.tokenPath;
            
            if (await fs.pathExists(tokenPath)) {
                console.log(`🎟️  Loading existing token from: ${tokenPath}`);
                return await fs.readJson(tokenPath);
            }
            
            return null;
            
        } catch (error) {
            console.log(`⚠️  Could not load token: ${error.message}`);
            return null;
        }
    }
    
    async saveToken(token) {
        try {
            const tokenPath = this.config.tokenPath;
            await fs.writeJson(tokenPath, token);
            console.log(`💾 Token saved to: ${tokenPath}`);
            
        } catch (error) {
            console.error(`Failed to save token: ${error.message}`);
        }
    }
    
    async authorize() {
        return new Promise((resolve, reject) => {
            const authUrl = this.oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: this.config.scopes,
            });
            
            console.log('🌐 Authorize this app by visiting this URL:');
            console.log(authUrl);
            console.log('');
            console.log('📋 After authorization, you will get a code. Please enter it here:');
            
            // In a real implementation, you'd get the code from user input
            // For now, we'll provide instructions
            const error = new Error(
                'Manual authorization required. Please:\\n' +
                '1. Visit the authorization URL above\\n' +
                '2. Authorize the application\\n' +
                '3. Copy the authorization code\\n' +
                '4. Run: node src/upload/authorize.js [code]'
            );
            
            reject(error);
        });
    }
    
    async handleAuthCode(code) {
        try {
            console.log('🔄 Exchanging authorization code for tokens...');
            
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            
            await this.saveToken(tokens);
            
            console.log('✅ Authorization completed successfully!');
            return tokens;
            
        } catch (error) {
            throw new Error(`Failed to exchange authorization code: ${error.message}`);
        }
    }
    
    async uploadVideo(videoPath, metadata = {}) {
        try {
            if (!this.youtube) {
                throw new Error('YouTube API not initialized. Call initialize() first.');
            }
            
            console.log('📤 Starting YouTube video upload...');
            console.log(`📁 Video file: ${videoPath}`);
            
            // Verify video file exists
            if (!await fs.pathExists(videoPath)) {
                throw new Error(`Video file not found: ${videoPath}`);
            }
            
            // Default metadata for Excalidraw animations
            const defaultMetadata = {
                title: 'Excalidraw Animation - Automated Upload',
                description: 'Animated Excalidraw drawing created using the Excalidraw-to-YouTube pipeline powered by Claude Code and dai-shi/excalidraw-animate.\\n\\nThis video showcases timestamp-based animation sequencing that recreates the drawing process step by step.\\n\\n🎨 Generated automatically using Claude Code\\n🚀 Zero-MCP autonomous AI workflow\\n⚡ Powered by dai-shi/excalidraw-animate',
                tags: ['excalidraw', 'animation', 'ai', 'claude', 'automated', 'drawing', 'visualization'],
                categoryId: '28', // Science & Technology
                defaultLanguage: 'en',
                defaultAudioLanguage: 'en'
            };
            
            const videoMetadata = { ...defaultMetadata, ...metadata };
            
            console.log(`📝 Title: ${videoMetadata.title}`);
            console.log(`📋 Description: ${videoMetadata.description.substring(0, 100)}...`);
            console.log(`🏷️  Tags: ${videoMetadata.tags.join(', ')}`);
            
            // Upload video
            const response = await this.youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: videoMetadata.title,
                        description: videoMetadata.description,
                        tags: videoMetadata.tags,
                        categoryId: videoMetadata.categoryId,
                        defaultLanguage: videoMetadata.defaultLanguage,
                        defaultAudioLanguage: videoMetadata.defaultAudioLanguage
                    },
                    status: {
                        privacyStatus: 'public', // 'private', 'public', or 'unlisted'
                        madeForKids: false
                    }
                },
                media: {
                    body: createReadStream(videoPath)
                }
            });
            
            const videoId = response.data.id;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            console.log('✅ Video uploaded successfully!');
            console.log(`🎬 Video ID: ${videoId}`);
            console.log(`🔗 Video URL: ${videoUrl}`);
            console.log(`📊 Upload status: ${response.data.status.uploadStatus}`);
            
            return {
                videoId,
                videoUrl,
                uploadStatus: response.data.status.uploadStatus,
                title: videoMetadata.title,
                response: response.data
            };
            
        } catch (error) {
            if (error.code === 403) {
                throw new Error('YouTube API quota exceeded or insufficient permissions. Please check your API quotas and scopes.');
            } else if (error.code === 401) {
                throw new Error('Authentication failed. Please re-authorize the application.');
            } else {
                throw new Error(`Video upload failed: ${error.message}`);
            }
        }
    }
    
    async getChannelInfo() {
        try {
            if (!this.youtube) {
                throw new Error('YouTube API not initialized.');
            }
            
            const response = await this.youtube.channels.list({
                part: ['snippet', 'statistics'],
                mine: true
            });
            
            if (response.data.items.length === 0) {
                throw new Error('No YouTube channel found for the authenticated user.');
            }
            
            const channel = response.data.items[0];
            
            console.log('📺 Channel Information:');
            console.log(`   Name: ${channel.snippet.title}`);
            console.log(`   ID: ${channel.id}`);
            console.log(`   Subscribers: ${channel.statistics.subscriberCount}`);
            console.log(`   Total Videos: ${channel.statistics.videoCount}`);
            console.log(`   Total Views: ${channel.statistics.viewCount}`);
            
            return channel;
            
        } catch (error) {
            throw new Error(`Failed to get channel info: ${error.message}`);
        }
    }
    
    async getUploadQuota() {
        try {
            // YouTube allows 50 uploads per day per channel
            console.log('📊 YouTube Upload Limits:');
            console.log('   Daily upload limit: 50 videos per day');
            console.log('   API quota limit: 10,000 units per day (default)');
            console.log('   Upload operation cost: ~1,600 quota units');
            
            return {
                dailyUploadLimit: 50,
                dailyQuotaLimit: 10000,
                uploadQuotaCost: 1600
            };
            
        } catch (error) {
            throw new Error(`Failed to get quota information: ${error.message}`);
        }
    }
}