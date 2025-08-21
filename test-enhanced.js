#!/usr/bin/env node

/**
 * Test the Enhanced Excalidraw Pipeline with Voice Narration
 */

import { enhanceExcalidrawVideo } from './src/enhanced-pipeline.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Create a sample Excalidraw diagram
const sampleDiagram = {
    type: "excalidraw",
    version: 2,
    source: "enhanced-pipeline-test",
    elements: [
        {
            id: "title-text",
            type: "text",
            x: 100,
            y: 50,
            width: 300,
            height: 40,
            text: "Voice AI Architecture",
            fontSize: 32,
            fontFamily: 1,
            textAlign: "center",
            verticalAlign: "middle"
        },
        {
            id: "input-box",
            type: "rectangle",
            x: 50,
            y: 150,
            width: 200,
            height: 80,
            strokeColor: "#1e88e5",
            backgroundColor: "#e3f2fd",
            fillStyle: "solid",
            label: "Voice Input"
        },
        {
            id: "whisper-box",
            type: "rectangle",
            x: 350,
            y: 150,
            width: 200,
            height: 80,
            strokeColor: "#43a047",
            backgroundColor: "#e8f5e9",
            fillStyle: "solid",
            label: "Whisper STT"
        },
        {
            id: "arrow-1",
            type: "arrow",
            x: 250,
            y: 190,
            width: 100,
            height: 0,
            points: [[0, 0], [100, 0]],
            strokeColor: "#333333"
        },
        {
            id: "llm-box",
            type: "rectangle",
            x: 650,
            y: 150,
            width: 200,
            height: 80,
            strokeColor: "#8e24aa",
            backgroundColor: "#f3e5f5",
            fillStyle: "solid",
            label: "Llama3 LLM"
        },
        {
            id: "arrow-2",
            type: "arrow",
            x: 550,
            y: 190,
            width: 100,
            height: 0,
            points: [[0, 0], [100, 0]],
            strokeColor: "#333333"
        },
        {
            id: "tts-box",
            type: "rectangle",
            x: 350,
            y: 300,
            width: 200,
            height: 80,
            strokeColor: "#f4511e",
            backgroundColor: "#fff3e0",
            fillStyle: "solid",
            label: "Kokoro TTS"
        },
        {
            id: "arrow-3",
            type: "arrow",
            x: 750,
            y: 230,
            width: -200,
            height: 70,
            points: [[0, 0], [-200, 70]],
            strokeColor: "#333333"
        },
        {
            id: "output-box",
            type: "rectangle",
            x: 50,
            y: 300,
            width: 200,
            height: 80,
            strokeColor: "#00897b",
            backgroundColor: "#e0f2f1",
            fillStyle: "solid",
            label: "Audio Output"
        },
        {
            id: "arrow-4",
            type: "arrow",
            x: 350,
            y: 340,
            width: -100,
            height: 0,
            points: [[0, 0], [-100, 0]],
            strokeColor: "#333333"
        },
        {
            id: "description-text",
            type: "text",
            x: 100,
            y: 450,
            width: 700,
            height: 60,
            text: "Real-time voice processing pipeline:\n1. Voice input captured\n2. Transcribed to text\n3. Processed by AI\n4. Converted back to speech",
            fontSize: 16,
            fontFamily: 1,
            textAlign: "left",
            verticalAlign: "top"
        }
    ],
    appState: {
        viewBackgroundColor: "#ffffff",
        gridSize: 20,
    }
};

async function test() {
    console.log('🧪 Testing Enhanced Excalidraw Pipeline with Voice Narration');
    console.log('=' .repeat(60));
    
    try {
        // Save sample diagram
        const diagramPath = './output/test-diagram.excalidraw';
        writeFileSync(diagramPath, JSON.stringify(sampleDiagram, null, 2));
        console.log(`📝 Created test diagram: ${diagramPath}`);
        
        // Process with voice narration
        console.log('\n🚀 Processing with voice narration...\n');
        
        const result = await enhanceExcalidrawVideo(diagramPath, {
            outputDir: './output/test-enhanced',
            voice: 'af_heart',
            voiceEnabled: true,
            aiScriptEnabled: false, // Use template narration for test
            width: 1920,
            height: 1080,
            frameRate: 30
        });
        
        console.log('\n' + '=' .repeat(60));
        console.log('✅ Test completed successfully!');
        console.log('\n📊 Results:');
        console.log(`  Video: ${result.video.path}`);
        console.log(`  Duration: ${result.video.duration}ms`);
        console.log(`  Has Audio: ${result.video.hasAudio}`);
        console.log(`  Output Dir: ${result.outputDir}`);
        
        if (result.narration) {
            console.log('\n🎙️ Narration Details:');
            console.log(`  Segments: ${result.narration.audioSegments.length}`);
            console.log(`  Total Duration: ${result.narration.timeline.totalDuration}ms`);
            console.log('\n  Script Segments:');
            result.narration.script.segments.forEach((seg, i) => {
                console.log(`    ${i + 1}. "${seg.text.substring(0, 50)}..."`);
            });
        }
        
        console.log('\n💡 Next Steps:');
        console.log('  1. Check the output directory for generated files');
        console.log('  2. Play the video to see animation with narration');
        console.log('  3. Try with different voices or AI-generated scripts');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error('\n🔍 Troubleshooting:');
        console.error('  1. Ensure Local Voice AI server is running');
        console.error('  2. Check that Kokoro TTS is properly configured');
        console.error('  3. Verify Python environment and dependencies');
        console.error('  4. Make sure ffmpeg is installed');
    }
}

// Run test
test().catch(console.error);