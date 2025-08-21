#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { spawn } from 'child_process';
import puppeteer from 'puppeteer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegStatic);

console.log(`
🚀 EXCALIDRAW TO YOUTUBE PIPELINE
⚡ Powered by Claude Code - Zero MCP Needed
🎯 The Everything Agent is HERE
`);

class ExcalidrawToYouTube {
    constructor() {
        this.outputDir = './output';
        this.frameDir = './output/frames';
    }

    async processExcalidrawFile(inputFile) {
        console.log('\n📁 Loading Excalidraw file:', inputFile);
        
        if (!existsSync(inputFile)) {
            throw new Error(`File not found: ${inputFile}`);
        }
        
        const excalidrawData = JSON.parse(readFileSync(inputFile, 'utf8'));
        console.log(`✅ Loaded ${excalidrawData.elements.length} elements`);
        
        return excalidrawData;
    }

    generateProgressiveSVG(excalidrawData) {
        console.log('\n🎨 Generating progressive SVG animation...');
        console.log('⚡ Using dai-shi/excalidraw-animate methods');
        
        const width = 1920;
        const height = 1080;
        const duration = 10; // 10 seconds total
        
        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <rect width="${width}" height="${height}" fill="white"/>
    <g id="animation-container">`;
        
        // Process each element with progressive animation
        excalidrawData.elements.forEach((element, index) => {
            const startTime = (index * duration / excalidrawData.elements.length).toFixed(2);
            const elementDuration = (duration / excalidrawData.elements.length).toFixed(2);
            
            switch (element.type) {
                case 'rectangle':
                    svg += this.createProgressiveRectangle(element, startTime, elementDuration);
                    break;
                case 'ellipse':
                    svg += this.createProgressiveEllipse(element, startTime, elementDuration);
                    break;
                case 'arrow':
                case 'line':
                    svg += this.createProgressiveLine(element, startTime, elementDuration);
                    break;
                case 'text':
                    svg += this.createProgressiveText(element, startTime, elementDuration);
                    break;
                case 'freedraw':
                    svg += this.createProgressiveFreedraw(element, startTime, elementDuration);
                    break;
            }
        });
        
        // Add timeline progress bar
        svg += `
        <rect x="0" y="${height - 20}" width="${width}" height="20" fill="#f0f0f0"/>
        <rect x="0" y="${height - 20}" width="0" height="20" fill="#4CAF50">
            <animate attributeName="width" from="0" to="${width}" 
                     dur="${duration}s" fill="freeze"/>
        </rect>
        <text x="10" y="${height - 5}" font-size="12" fill="black">Progress</text>
    </g>
</svg>`;
        
        console.log('✅ Generated progressive SVG with animations');
        return svg;
    }

    createProgressiveRectangle(element, startTime, duration) {
        const { x, y, width, height, strokeColor = '#000000', backgroundColor = 'none' } = element;
        const perimeter = 2 * (width + height);
        
        return `
        <g id="rect-${element.id}">
            <!-- Progressive stroke -->
            <rect x="${x}" y="${y}" width="${width}" height="${height}" 
                  stroke="${strokeColor}" stroke-width="2" fill="none"
                  stroke-dasharray="${perimeter}" stroke-dashoffset="${perimeter}">
                <animate attributeName="stroke-dashoffset" 
                         from="${perimeter}" to="0"
                         begin="${startTime}s" dur="${duration}s" fill="freeze"/>
            </rect>
            <!-- Fill animation -->
            ${backgroundColor !== 'none' ? `
            <rect x="${x}" y="${y}" width="${width}" height="${height}" 
                  fill="${backgroundColor}" opacity="0">
                <animate attributeName="opacity" 
                         from="0" to="0.5"
                         begin="${parseFloat(startTime) + parseFloat(duration) * 0.7}s" 
                         dur="${parseFloat(duration) * 0.3}s" fill="freeze"/>
            </rect>` : ''}
            <!-- Pointer -->
            <circle r="5" fill="red">
                <animateMotion dur="${duration}s" begin="${startTime}s" fill="freeze">
                    <mpath href="#rect-path-${element.id}"/>
                </animateMotion>
            </circle>
            <path id="rect-path-${element.id}" 
                  d="M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z" 
                  fill="none"/>
        </g>`;
    }

    createProgressiveEllipse(element, startTime, duration) {
        const { x, y, width, height, strokeColor = '#000000' } = element;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const rx = width / 2;
        const ry = height / 2;
        const circumference = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
        
        return `
        <g id="ellipse-${element.id}">
            <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" 
                     stroke="${strokeColor}" stroke-width="2" fill="none"
                     stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}">
                <animate attributeName="stroke-dashoffset" 
                         from="${circumference}" to="0"
                         begin="${startTime}s" dur="${duration}s" fill="freeze"/>
            </ellipse>
            <!-- Pointer -->
            <circle r="5" fill="red">
                <animateMotion dur="${duration}s" begin="${startTime}s" fill="freeze" 
                               path="M ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy - 0.01}"/>
            </circle>
        </g>`;
    }

    createProgressiveLine(element, startTime, duration) {
        const points = element.points || [[0, 0], [element.width || 100, element.height || 100]];
        const { x, y, strokeColor = '#000000' } = element;
        
        let pathData = `M ${x + points[0][0]} ${y + points[0][1]}`;
        let totalLength = 0;
        
        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${x + points[i][0]} ${y + points[i][1]}`;
            const dx = points[i][0] - points[i - 1][0];
            const dy = points[i][1] - points[i - 1][1];
            totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        
        return `
        <g id="line-${element.id}">
            <path d="${pathData}" stroke="${strokeColor}" stroke-width="2" fill="none"
                  stroke-dasharray="${totalLength}" stroke-dashoffset="${totalLength}">
                <animate attributeName="stroke-dashoffset" 
                         from="${totalLength}" to="0"
                         begin="${startTime}s" dur="${duration}s" fill="freeze"/>
            </path>
            <!-- Pointer -->
            <circle r="5" fill="red">
                <animateMotion dur="${duration}s" begin="${startTime}s" fill="freeze" 
                               path="${pathData}"/>
            </circle>
        </g>`;
    }

    createProgressiveText(element, startTime, duration) {
        const { x, y, text = '', fontSize = 20, fontFamily = 'Arial' } = element;
        const chars = text.split('');
        const charDelay = parseFloat(duration) / chars.length;
        
        return `
        <g id="text-${element.id}">
            <text x="${x}" y="${y}" font-size="${fontSize}" font-family="${fontFamily}" fill="black">
                ${chars.map((char, i) => `
                <tspan opacity="0">
                    ${char}
                    <animate attributeName="opacity" 
                             from="0" to="1"
                             begin="${parseFloat(startTime) + i * charDelay}s" 
                             dur="0.1s" fill="freeze"/>
                </tspan>`).join('')}
            </text>
        </g>`;
    }

    createProgressiveFreedraw(element, startTime, duration) {
        const { points = [], x, y, strokeColor = '#000000' } = element;
        
        if (points.length < 2) return '';
        
        let pathData = `M ${x + points[0][0]} ${y + points[0][1]}`;
        let totalLength = 0;
        
        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${x + points[i][0]} ${y + points[i][1]}`;
            const dx = points[i][0] - points[i - 1][0];
            const dy = points[i][1] - points[i - 1][1];
            totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        
        return `
        <g id="freedraw-${element.id}">
            <path d="${pathData}" stroke="${strokeColor}" stroke-width="2" fill="none"
                  stroke-linecap="round" stroke-linejoin="round"
                  stroke-dasharray="${totalLength}" stroke-dashoffset="${totalLength}">
                <animate attributeName="stroke-dashoffset" 
                         from="${totalLength}" to="0"
                         begin="${startTime}s" dur="${duration}s" fill="freeze"/>
            </path>
            <!-- Pointer -->
            <circle r="5" fill="red">
                <animateMotion dur="${duration}s" begin="${startTime}s" fill="freeze" 
                               path="${pathData}"/>
            </circle>
        </g>`;
    }

    async convertSVGToVideo(svgContent, outputPath) {
        console.log('\n🎬 Converting SVG to YouTube-ready video...');
        console.log('📊 Target: 1920x1080 @ 60fps');
        
        const svgPath = join(this.outputDir, 'animation.svg');
        writeFileSync(svgPath, svgContent);
        
        // Use puppeteer to render frames
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto('file://' + resolve(svgPath));
        
        // Capture frames
        const fps = 60;
        const duration = 10;
        const totalFrames = fps * duration;
        
        console.log(`📸 Capturing ${totalFrames} frames...`);
        
        for (let i = 0; i < totalFrames; i++) {
            const time = (i / fps) * 1000;
            
            await page.evaluate((t) => {
                const svg = document.querySelector('svg');
                if (svg.setCurrentTime) {
                    svg.setCurrentTime(t / 1000);
                }
            }, time);
            
            await page.screenshot({
                path: join(this.frameDir, `frame_${String(i).padStart(5, '0')}.png`),
                type: 'png'
            });
            
            if (i % 60 === 0) {
                console.log(`Progress: ${Math.round((i / totalFrames) * 100)}%`);
            }
        }
        
        await browser.close();
        
        // Create video with FFmpeg
        console.log('\n🎥 Encoding YouTube-optimized video...');
        
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(join(this.frameDir, 'frame_%05d.png'))
                .inputOptions(['-framerate', String(fps)])
                .outputOptions([
                    '-c:v', 'libx264',
                    '-preset', 'slow',
                    '-crf', '18',
                    '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart',
                    '-profile:v', 'high',
                    '-level', '4.2',
                    '-bf', '2',
                    '-g', String(fps * 2),
                    '-maxrate', '10M',
                    '-bufsize', '20M'
                ])
                .output(outputPath)
                .on('end', () => {
                    console.log('✅ YouTube-ready video created!');
                    resolve(outputPath);
                })
                .on('error', reject)
                .run();
        });
    }

    generateYouTubeMetadata(excalidrawData, videoPath) {
        console.log('\n📝 Generating YouTube metadata...');
        
        const metadata = {
            title: `Excalidraw Animation - ${new Date().toISOString().split('T')[0]}`,
            description: `Progressive animation of Excalidraw drawing with ${excalidrawData.elements.length} elements.

🎨 Features:
• Progressive stroke animation
• Smooth path drawing  
• Text typing effects
• Pointer tracking
• 1080p 60fps quality

⚡ Created with Excalidraw Video Pipeline
🚀 Powered by Claude Code - Zero MCP needed
🎯 The Everything Agent is here!

#excalidraw #animation #drawing #visualization #daishi`,
            tags: [
                'excalidraw',
                'animation',
                'drawing',
                'progressive',
                'svg',
                'dai-shi',
                'visualization',
                'design',
                'tutorial',
                'automated'
            ],
            category: 'Education',
            visibility: 'public',
            language: 'en',
            license: 'Creative Commons',
            recordingDate: new Date().toISOString(),
            videoFile: videoPath,
            thumbnail: join(this.outputDir, 'thumbnail.png')
        };
        
        const metadataPath = videoPath.replace('.mp4', '_youtube.json');
        writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        console.log('✅ YouTube metadata saved:', metadataPath);
        console.log('\n🎯 READY FOR YOUTUBE UPLOAD!');
        console.log('━'.repeat(50));
        console.log('📺 Title:', metadata.title);
        console.log('🏷️  Tags:', metadata.tags.slice(0, 5).join(', ') + '...');
        console.log('📁 Video:', videoPath);
        console.log('📊 Metadata:', metadataPath);
        console.log('━'.repeat(50));
        
        return metadata;
    }

    async run(inputFile) {
        try {
            console.log('━'.repeat(50));
            console.log('🚀 EXCALIDRAW → YOUTUBE PIPELINE');
            console.log('━'.repeat(50));
            
            // Ensure directories exist
            const { mkdirSync } = await import('fs');
            mkdirSync(this.outputDir, { recursive: true });
            mkdirSync(this.frameDir, { recursive: true });
            
            // Process Excalidraw file
            const excalidrawData = await this.processExcalidrawFile(inputFile);
            
            // Generate progressive SVG
            const svgContent = this.generateProgressiveSVG(excalidrawData);
            
            // Convert to YouTube video
            const videoPath = join(this.outputDir, 'youtube-ready.mp4');
            await this.convertSVGToVideo(svgContent, videoPath);
            
            // Generate YouTube metadata
            this.generateYouTubeMetadata(excalidrawData, videoPath);
            
            // Clean up frames
            console.log('\n🧹 Cleaning up temporary files...');
            const { readdirSync, unlinkSync } = await import('fs');
            const frames = readdirSync(this.frameDir);
            frames.forEach(frame => unlinkSync(join(this.frameDir, frame)));
            
            console.log('\n✨ PIPELINE COMPLETE!');
            console.log('🎬 Your YouTube-ready video is at:', videoPath);
            console.log('\n🚀 THE EVERYTHING AGENT HAS DELIVERED!');
            
        } catch (error) {
            console.error('\n❌ Pipeline error:', error);
            process.exit(1);
        }
    }
}

// CLI entry point
if (process.argv.length < 3) {
    console.log('Usage: node excalidraw-to-youtube.js <excalidraw-file.json>');
    console.log('\nExample:');
    console.log('  node excalidraw-to-youtube.js drawing.excalidraw');
    process.exit(1);
}

const pipeline = new ExcalidrawToYouTube();
pipeline.run(process.argv[2]);