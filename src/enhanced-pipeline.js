/**
 * Enhanced Excalidraw Video Pipeline with Voice Integration
 * Combines animation with AI-generated narration
 */

import { ExcalidrawAnimator } from './animation/animator.js';
import { VoiceNarrator, AIScriptGenerator } from './voice/narrator.js';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export class EnhancedExcalidrawPipeline {
    constructor(config = {}) {
        this.config = {
            outputDir: config.outputDir || './output/enhanced',
            width: config.width || 1920,
            height: config.height || 1080,
            frameRate: config.frameRate || 30,
            voiceEnabled: config.voiceEnabled !== false,
            aiScriptEnabled: config.aiScriptEnabled !== false,
            ...config
        };

        // Initialize components
        this.animator = new ExcalidrawAnimator({
            width: this.config.width,
            height: this.config.height,
            frameRate: this.config.frameRate,
            outputDir: join(this.config.outputDir, 'frames')
        });

        this.narrator = new VoiceNarrator({
            outputDir: join(this.config.outputDir, 'audio'),
            voice: config.voice || 'af_heart'
        });

        this.scriptGenerator = this.config.aiScriptEnabled ? 
            new AIScriptGenerator({
                ollamaUrl: config.ollamaUrl || 'http://127.0.0.1:11434/v1'
            }) : null;

        // Ensure output directory exists
        mkdirSync(this.config.outputDir, { recursive: true });
    }

    /**
     * Process Excalidraw file with voice narration
     */
    async processWithVoice(excalidrawPath, options = {}) {
        console.log('🚀 Starting Enhanced Excalidraw Pipeline with Voice...');
        console.log(`📁 Input: ${excalidrawPath}`);
        console.log(`🎙️ Voice: ${options.voice || this.config.voice || 'af_heart'}`);
        console.log(`🤖 AI Script: ${this.config.aiScriptEnabled ? 'Enabled' : 'Disabled'}`);

        try {
            // Step 1: Load and parse Excalidraw file
            const excalidrawData = this.loadExcalidrawFile(excalidrawPath);
            console.log(`📊 Loaded ${excalidrawData.elements?.length || 0} elements`);

            // Step 2: Generate voice narration
            let narration = null;
            if (this.config.voiceEnabled) {
                narration = await this.narrator.generateNarration(
                    excalidrawData,
                    this.scriptGenerator
                );
                console.log(`🎙️ Generated ${narration.audioSegments.length} audio segments`);
            }

            // Step 3: Generate animation synchronized with narration
            const animation = await this.generateSynchronizedAnimation(
                excalidrawData,
                narration
            );
            console.log(`🎬 Generated animation: ${animation.duration}ms`);

            // Step 4: Combine animation and audio into final video
            const finalVideo = await this.createFinalVideo(
                animation,
                narration,
                options
            );

            console.log('✅ Enhanced video generation complete!');
            console.log(`📹 Output: ${finalVideo.path}`);

            return {
                success: true,
                video: finalVideo,
                animation: animation,
                narration: narration,
                outputDir: this.config.outputDir
            };

        } catch (error) {
            console.error('❌ Pipeline failed:', error);
            throw error;
        }
    }

    /**
     * Load and parse Excalidraw file
     */
    loadExcalidrawFile(path) {
        try {
            const content = readFileSync(path, 'utf-8');
            const data = JSON.parse(content);
            
            // Validate Excalidraw structure
            if (!data.elements || !Array.isArray(data.elements)) {
                throw new Error('Invalid Excalidraw file: missing elements array');
            }

            return data;
        } catch (error) {
            throw new Error(`Failed to load Excalidraw file: ${error.message}`);
        }
    }

    /**
     * Generate animation synchronized with narration timeline
     */
    async generateSynchronizedAnimation(excalidrawData, narration) {
        console.log('🎬 Generating synchronized animation...');

        // If no narration, use standard animation
        if (!narration) {
            return await this.animator.generateAnimation(
                excalidrawData,
                this.createDefaultTimestamps(excalidrawData.elements)
            );
        }

        // Synchronize animation with narration timeline
        const syncedTimestamps = this.createSynchronizedTimestamps(
            excalidrawData.elements,
            narration.timeline
        );

        // Adjust animation speed to match narration
        const originalAnimator = this.animator;
        this.animator.config.speed = this.calculateAnimationSpeed(
            excalidrawData.elements.length,
            narration.timeline.totalDuration
        );

        const animation = await this.animator.generateAnimation(
            excalidrawData,
            syncedTimestamps
        );

        // Add narration sync metadata
        animation.narrationSync = {
            timeline: narration.timeline,
            segments: narration.timeline.segments.map(seg => ({
                audioStart: seg.startTime,
                audioEnd: seg.endTime,
                animationFrames: seg.animationSync
            }))
        };

        this.animator = originalAnimator;
        return animation;
    }

    /**
     * Create synchronized timestamps for animation
     */
    createSynchronizedTimestamps(elements, timeline) {
        const timestamps = [];
        
        timeline.segments.forEach(segment => {
            const segmentElements = segment.animationSync.elements;
            const startTime = segment.startTime;
            const duration = segment.duration;
            
            segmentElements.forEach((element, index) => {
                const elementStartTime = startTime + (duration / segmentElements.length) * index;
                timestamps.push({
                    id: element.id,
                    created: elementStartTime,
                    updated: elementStartTime + (duration / segmentElements.length)
                });
            });
        });

        // Add any remaining elements not in timeline
        elements.forEach(element => {
            if (!timestamps.find(t => t.id === element.id)) {
                timestamps.push({
                    id: element.id,
                    created: timeline.totalDuration,
                    updated: timeline.totalDuration + 1000
                });
            }
        });

        return timestamps;
    }

    /**
     * Create default timestamps for elements
     */
    createDefaultTimestamps(elements) {
        return elements.map((element, index) => ({
            id: element.id,
            created: index * 500,
            updated: (index + 1) * 500
        }));
    }

    /**
     * Calculate optimal animation speed
     */
    calculateAnimationSpeed(elementCount, narrationDuration) {
        const baseAnimationTime = elementCount * 500; // 500ms per element
        const speed = baseAnimationTime / narrationDuration;
        
        // Clamp speed between 0.5x and 2x
        return Math.max(0.5, Math.min(2, speed));
    }

    /**
     * Create final video with animation and audio
     */
    async createFinalVideo(animation, narration, options) {
        console.log('🎥 Creating final video with audio...');

        const outputPath = join(this.config.outputDir, 'final-video.mp4');
        
        // Prepare ffmpeg command based on animation type
        let ffmpegCmd;
        
        if (animation.type === 'dai-shi-progressive-animation' && animation.svgPath) {
            // Convert SVG animation to video
            ffmpegCmd = await this.createSvgToVideoCommand(
                animation.svgPath,
                narration,
                outputPath
            );
        } else {
            // Use frame-by-frame approach
            ffmpegCmd = await this.createFramesToVideoCommand(
                animation.frames,
                narration,
                outputPath
            );
        }

        // Execute ffmpeg
        return new Promise((resolve, reject) => {
            console.log('🎬 Running ffmpeg...');
            
            const process = spawn('sh', ['-c', ffmpegCmd], {
                stdio: 'inherit'
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        path: outputPath,
                        duration: animation.duration,
                        hasAudio: !!narration,
                        metadata: {
                            width: this.config.width,
                            height: this.config.height,
                            frameRate: this.config.frameRate,
                            voice: narration?.audioSegments[0]?.voice
                        }
                    });
                } else {
                    reject(new Error(`FFmpeg failed with code ${code}`));
                }
            });
        });
    }

    /**
     * Create ffmpeg command for SVG to video conversion
     */
    async createSvgToVideoCommand(svgPath, narration, outputPath) {
        // First, convert SVG animation to video using puppeteer
        const videoPath = await this.convertSvgToVideo(svgPath);
        
        if (narration) {
            // Merge narration audio
            const audioPath = join(narration.outputDir, 'narration-complete.wav');
            await this.narrator.mergeAudioSegments(narration.timeline);
            
            return `ffmpeg -i ${videoPath} -i ${audioPath} -c:v copy -c:a aac -strict experimental ${outputPath}`;
        } else {
            return `ffmpeg -i ${videoPath} -c:v copy ${outputPath}`;
        }
    }

    /**
     * Create ffmpeg command for frames to video conversion
     */
    async createFramesToVideoCommand(frames, narration, outputPath) {
        const framePattern = join(frames[0]).replace(/frame_\d+\.png$/, 'frame_%06d.png');
        
        if (narration) {
            // Merge narration audio first
            const audioPath = join(narration.outputDir, 'narration-complete.wav');
            await this.narrator.mergeAudioSegments(narration.timeline);
            
            return `ffmpeg -framerate ${this.config.frameRate} -i ${framePattern} -i ${audioPath} -c:v libx264 -pix_fmt yuv420p -c:a aac -strict experimental ${outputPath}`;
        } else {
            return `ffmpeg -framerate ${this.config.frameRate} -i ${framePattern} -c:v libx264 -pix_fmt yuv420p ${outputPath}`;
        }
    }

    /**
     * Convert SVG animation to video using puppeteer
     */
    async convertSvgToVideo(svgPath) {
        console.log('🎨 Converting SVG animation to video...');
        
        // This would use puppeteer to record the SVG animation
        // For now, return a placeholder
        const videoPath = svgPath.replace('.svg', '.mp4');
        
        // TODO: Implement actual SVG to video conversion
        console.log('⚠️  SVG to video conversion not yet implemented, using placeholder');
        
        return videoPath;
    }

    /**
     * Process with voice commands (using Whisper STT)
     */
    async processWithVoiceCommands(audioPath, options = {}) {
        console.log('🎤 Processing voice commands...');
        
        // TODO: Implement Whisper STT integration
        // This would:
        // 1. Transcribe audio commands
        // 2. Parse commands into drawing instructions
        // 3. Generate Excalidraw elements
        // 4. Process through normal pipeline
        
        throw new Error('Voice command processing not yet implemented');
    }

    /**
     * Interactive mode with real-time voice
     */
    async startInteractiveMode(options = {}) {
        console.log('🎮 Starting interactive mode...');
        
        // TODO: Implement real-time interactive mode
        // This would:
        // 1. Start WebRTC connection
        // 2. Stream audio input through Whisper
        // 3. Generate drawings in real-time
        // 4. Provide voice feedback through Kokoro
        
        throw new Error('Interactive mode not yet implemented');
    }
}

// Export convenience function
export async function enhanceExcalidrawVideo(inputPath, options = {}) {
    const pipeline = new EnhancedExcalidrawPipeline(options);
    return await pipeline.processWithVoice(inputPath, options);
}