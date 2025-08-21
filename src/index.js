#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { ExcalidrawParser } from './processing/parser.js';
import { ExcalidrawAnimator } from './animation/animator.js';
import { VideoExporter } from './export/videoExporter.js';
import { YouTubeUploader } from './upload/youtubeUploader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
const configPath = join(__dirname, '..', 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));

console.log('🎨 Excalidraw to YouTube Video Pipeline');
console.log('======================================');
console.log('');
console.log('Features:');
console.log('✓ Zero-MCP autonomous AI workflow');
console.log('✓ Claude AI integration');
console.log('✓ Customizable animation speeds');
console.log('✓ YouTube-optimized output');
console.log('');

class ExcalidrawVideoPipeline {
    constructor(config) {
        this.config = config;
        this.version = '1.0.0';
        this.parser = new ExcalidrawParser();
        this.animator = new ExcalidrawAnimator(config.animation);
        this.exporter = new VideoExporter(config.export);
        this.uploader = new YouTubeUploader(config.youtube);
    }

    async initialize() {
        console.log('🚀 Initializing pipeline...');
        console.log(`📐 Video dimensions: ${this.config.video.width}x${this.config.video.height}`);
        console.log(`🎬 Animation speed: ${this.config.animation.defaultSpeed}x`);
        console.log(`🎥 Frame rate: ${this.config.animation.frameRate} FPS`);
        console.log(`🤖 AI Model: ${this.config.ai.model}`);
        console.log(`📁 Input path: ${this.config.paths.input}`);
        console.log(`📁 Output path: ${this.config.paths.output}`);
        console.log('');
    }

    async processExcalidrawFiles() {
        console.log('📝 Processing Excalidraw files...');
        
        const inputPath = this.config.paths.input;
        const excalidrawData = await this.parser.parseFile(inputPath);
        
        console.log('   ✓ Parsed drawing elements');
        console.log('   ✓ Extracted timestamp data for animation sequencing');
        console.log('   ✓ Analyzed content structure');
        
        return excalidrawData;
    }

    async generateAnimation(excalidrawData) {
        console.log('🎭 Generating animations using dai-shi/excalidraw-animate...');
        
        const animationData = await this.animator.generateAnimation(
            excalidrawData.elements, 
            excalidrawData.timestamps
        );
        
        console.log('   ✓ Created sequenced playback from timestamps');
        console.log('   ✓ Applied smooth transitions between frames');
        console.log('   ✓ Optimized frame generation for YouTube format');
        
        return animationData;
    }

    async exportVideo(animationData) {
        console.log('🎞️  Exporting video with FFmpeg...');
        
        const videoResult = await this.exporter.exportVideo(animationData);
        
        console.log('   ✓ Rendered all animation frames');
        console.log('   ✓ Encoded with FFmpeg using YouTube-optimized settings');
        console.log('   ✓ Optimized file size and quality');
        
        return videoResult;
    }

    async uploadToYouTube(videoResult, metadata = {}) {
        try {
            console.log('📺 Uploading to YouTube using Claude Code + Context7 integration...');
            
            // Initialize YouTube uploader
            await this.uploader.initialize();
            
            // Get channel info for verification
            const channelInfo = await this.uploader.getChannelInfo();
            console.log(`🎯 Target channel: ${channelInfo.snippet.title}`);
            
            // Prepare video metadata with Excalidraw-specific information
            const uploadMetadata = {
                title: `Excalidraw Animation - ${new Date().toISOString().split('T')[0]}`,
                description: `🎨 Animated Excalidraw drawing created using the Excalidraw-to-YouTube pipeline

🚀 **Technology Stack:**
• Claude Code + Context7 MCP server integration
• dai-shi/excalidraw-animate for timestamp-based sequencing  
• Zero-MCP autonomous AI workflow
• YouTube Data API v3 for direct upload

⚡ **Features:**
• Automatic timestamp extraction from .excalidraw files
• Chronological element animation based on drawing sequence
• YouTube-optimized video encoding with FFmpeg
• Direct upload to YouTube channel: https://www.youtube.com/@jmanhype1

🎬 **Animation Details:**
• Duration: ${Math.round(videoResult.duration / 1000)}s
• Frame count: ${videoResult.frameCount} frames
• Generated: ${new Date().toLocaleString()}

This video demonstrates the complete autonomous pipeline from Excalidraw file to YouTube upload, powered entirely by Claude Code.`,
                tags: [
                    'excalidraw', 'animation', 'claude-code', 'ai', 'automation',
                    'context7', 'mcp', 'youtube-api', 'drawing', 'visualization',
                    'dai-shi', 'excalidraw-animate', 'timestamp', 'pipeline'
                ],
                ...metadata
            };
            
            console.log('📋 Upload metadata prepared');
            console.log(`   Title: ${uploadMetadata.title}`);
            console.log(`   Tags: ${uploadMetadata.tags.slice(0, 5).join(', ')}...`);
            
            // Upload video to YouTube
            const uploadResult = await this.uploader.uploadVideo(videoResult.outputPath, uploadMetadata);
            
            console.log('✅ Video successfully uploaded to YouTube!');
            console.log(`🎬 Video URL: ${uploadResult.videoUrl}`);
            console.log(`📺 Channel: https://www.youtube.com/@jmanhype1`);
            
            return uploadResult;
            
        } catch (error) {
            if (error.message.includes('Manual authorization required')) {
                console.log('🔐 YouTube authorization required');
                console.log('   Please follow the setup guide in setup-youtube.md');
                console.log('   Then run the pipeline again to complete the upload');
                return { requiresAuth: true, error: error.message };
            } else {
                throw new Error(`YouTube upload failed: ${error.message}`);
            }
        }
    }

    async run() {
        try {
            await this.initialize();
            
            // Process Excalidraw file with timestamp extraction
            const excalidrawData = await this.processExcalidrawFiles();
            
            // Generate animation using dai-shi/excalidraw-animate
            const animationData = await this.generateAnimation(excalidrawData, excalidrawData.timestamps);
            
            // Export video with FFmpeg
            const videoResult = await this.exportVideo(animationData);
            
            console.log('✅ Video generation completed successfully!');
            console.log(`🎞️  Video saved to: ${videoResult.outputPath}`);
            console.log(`⏱️  Duration: ${videoResult.duration}ms`);
            console.log(`🎬 Frame count: ${videoResult.frameCount} frames`);
            
            // Upload to YouTube automatically
            console.log('');
            console.log('🚀 Starting automatic YouTube upload...');
            const uploadResult = await this.uploadToYouTube(videoResult);
            
            if (uploadResult.requiresAuth) {
                console.log('⚠️  YouTube upload requires manual authorization first');
                return { videoResult, uploadResult };
            }
            
            console.log('');
            console.log('🎉 COMPLETE SUCCESS! Excalidraw-to-YouTube pipeline finished!');
            console.log('📺 Video is now live on YouTube!');
            console.log(`🔗 Watch at: ${uploadResult.videoUrl}`);
            console.log('🤖 Powered by Claude Code + Context7 + dai-shi/excalidraw-animate');
            
            return { videoResult, uploadResult };
            
        } catch (error) {
            console.error('❌ Pipeline failed:', error.message);
            console.error(error.stack);
            process.exit(1);
        }
    }
}

// Run the pipeline
const pipeline = new ExcalidrawVideoPipeline(config);
pipeline.run();
