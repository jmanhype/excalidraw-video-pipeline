/**
 * Voice Narrator Module for Excalidraw Animations
 * Integrates Kokoro TTS from Local Voice AI for generating narration
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class VoiceNarrator {
    constructor(config = {}) {
        this.config = {
            model: config.model || 'prince-canuma/Kokoro-82M',
            voice: config.voice || 'af_heart',
            sampleRate: config.sampleRate || 24000,
            outputDir: config.outputDir || './output/audio',
            pythonPath: config.pythonPath || '/Users/speed/Downloads/local-voice-ai/server/venv/bin/python',
            kokoroPath: config.kokoroPath || '/Users/speed/Downloads/local-voice-ai/server',
            ...config
        };

        // Available voices from Kokoro
        this.voices = {
            'af_heart': 'Heartfelt American Female',
            'af_sky': 'Sky American Female',
            'af_dream': 'Dreamy American Female',
            'am_adam': 'Adam American Male',
            'am_michael': 'Michael American Male'
        };

        // Ensure output directory exists
        mkdirSync(this.config.outputDir, { recursive: true });
    }

    /**
     * Generate narration for Excalidraw elements
     */
    async generateNarration(excalidrawData, scriptGenerator) {
        console.log('🎙️ Generating voice narration for animation...');
        
        try {
            // Step 1: Generate script from diagram
            const script = await this.generateScript(excalidrawData, scriptGenerator);
            console.log('📝 Script generated:', script.segments.length, 'segments');

            // Step 2: Generate audio for each segment
            const audioSegments = [];
            for (const segment of script.segments) {
                const audio = await this.generateAudioSegment(segment);
                audioSegments.push(audio);
            }

            // Step 3: Sync audio with animation timeline
            const timeline = await this.createAudioTimeline(audioSegments, script);
            
            return {
                script,
                audioSegments,
                timeline,
                totalDuration: timeline.totalDuration,
                outputDir: this.config.outputDir
            };

        } catch (error) {
            console.error('❌ Narration generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate script from Excalidraw data using AI
     */
    async generateScript(excalidrawData, scriptGenerator) {
        const elements = excalidrawData.elements || [];
        const segments = [];

        // Group elements by type and order
        const groups = this.groupElements(elements);

        // Generate narrative for each group
        for (const group of groups) {
            const narrative = await this.generateGroupNarrative(group, scriptGenerator);
            segments.push({
                id: group.id,
                text: narrative.text,
                duration: narrative.estimatedDuration,
                elements: group.elements,
                voice: narrative.voice || this.config.voice,
                timing: {
                    start: group.startTime,
                    end: group.endTime
                }
            });
        }

        return {
            segments,
            totalElements: elements.length,
            groups: groups.length
        };
    }

    /**
     * Group elements for narrative generation
     */
    groupElements(elements) {
        const groups = [];
        const sortedElements = [...elements].sort((a, b) => {
            const aTime = a.created || a.versionNonce || 0;
            const bTime = b.created || b.versionNonce || 0;
            return aTime - bTime;
        });

        // Create narrative groups based on element relationships
        let currentGroup = null;
        let groupStartTime = 0;

        sortedElements.forEach((element, index) => {
            const shouldStartNewGroup = this.shouldStartNewGroup(element, currentGroup);

            if (shouldStartNewGroup || !currentGroup) {
                if (currentGroup) {
                    currentGroup.endTime = groupStartTime + 3000; // 3 seconds per group
                    groups.push(currentGroup);
                    groupStartTime = currentGroup.endTime;
                }

                currentGroup = {
                    id: `group-${groups.length}`,
                    elements: [element],
                    type: element.type,
                    startTime: groupStartTime
                };
            } else {
                currentGroup.elements.push(element);
            }
        });

        if (currentGroup) {
            currentGroup.endTime = groupStartTime + 3000;
            groups.push(currentGroup);
        }

        return groups;
    }

    /**
     * Determine if element should start a new narrative group
     */
    shouldStartNewGroup(element, currentGroup) {
        if (!currentGroup) return true;

        // Start new group for different element types
        if (element.type !== currentGroup.type) return true;

        // Start new group if elements are far apart
        if (currentGroup.elements.length >= 3) return true;

        // Check for text elements (usually labels/descriptions)
        if (element.type === 'text') return true;

        return false;
    }

    /**
     * Generate narrative for a group of elements
     */
    async generateGroupNarrative(group, scriptGenerator) {
        const elementDescriptions = group.elements.map(el => this.describeElement(el));
        
        // Use AI to generate natural narrative
        if (scriptGenerator) {
            return await scriptGenerator.generateNarrative({
                elements: elementDescriptions,
                type: group.type,
                context: 'technical diagram explanation'
            });
        }

        // Fallback to template-based generation
        return this.generateTemplateNarrative(group, elementDescriptions);
    }

    /**
     * Template-based narrative generation (fallback)
     */
    generateTemplateNarrative(group, descriptions) {
        const templates = {
            'rectangle': 'Here we have a rectangle representing {description}',
            'arrow': 'This arrow shows the flow from {start} to {end}',
            'text': 'The text reads: {content}',
            'ellipse': 'This circle represents {description}',
            'line': 'A line connecting {points}',
            'freedraw': 'A freehand drawing illustrating {concept}'
        };

        let text = templates[group.type] || 'Next, we see {description}';
        
        // Fill in template with actual content
        if (group.type === 'text' && group.elements[0].text) {
            text = text.replace('{content}', group.elements[0].text);
        } else {
            text = text.replace('{description}', descriptions.join(', '));
        }

        // Estimate duration based on text length
        const wordsPerMinute = 150;
        const words = text.split(' ').length;
        const estimatedDuration = (words / wordsPerMinute) * 60 * 1000; // ms

        return {
            text,
            estimatedDuration,
            voice: this.selectVoiceForContent(group)
        };
    }

    /**
     * Select appropriate voice based on content
     */
    selectVoiceForContent(group) {
        // Use different voices for different content types
        if (group.type === 'text' && group.elements[0].text?.toLowerCase().includes('important')) {
            return 'am_adam'; // Use male voice for emphasis
        }
        
        if (group.type === 'freedraw') {
            return 'af_dream'; // Use dreamy voice for creative content
        }

        return this.config.voice; // Default voice
    }

    /**
     * Describe an element for narrative generation
     */
    describeElement(element) {
        const descriptions = {
            'rectangle': `a box${element.label ? ` labeled "${element.label}"` : ''}`,
            'arrow': `an arrow${element.label ? ` showing "${element.label}"` : ''}`,
            'text': element.text || 'text',
            'ellipse': `a circle${element.label ? ` representing "${element.label}"` : ''}`,
            'line': 'a connecting line',
            'freedraw': 'a sketch'
        };

        return descriptions[element.type] || element.type;
    }

    /**
     * Generate audio for a script segment using Kokoro TTS
     */
    async generateAudioSegment(segment) {
        console.log(`🔊 Generating audio: "${segment.text.substring(0, 50)}..."`);

        const audioPath = join(this.config.outputDir, `segment-${segment.id}.wav`);

        // Create Python script to use Kokoro
        const pythonScript = `
import sys
sys.path.insert(0, '${this.config.kokoroPath}')

from kokoro_worker import Worker
import json
import base64
import numpy as np
import wave

# Initialize worker
worker = Worker()
init_result = worker.initialize("${this.config.model}", "${segment.voice}")

if not init_result.get('success'):
    print(json.dumps({"error": init_result.get('error')}))
    sys.exit(1)

# Generate audio
result = worker.generate("${segment.text.replace(/"/g, '\\"')}")

if result.get('success'):
    # Decode and save audio
    audio_b64 = result['audio']
    audio_bytes = base64.b64decode(audio_b64)
    audio_int16 = np.frombuffer(audio_bytes, dtype=np.int16)
    
    # Save as WAV
    with wave.open("${audioPath}", 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(${this.config.sampleRate})
        wav_file.writeframes(audio_int16.tobytes())
    
    print(json.dumps({"success": True, "path": "${audioPath}", "duration": len(audio_int16) / ${this.config.sampleRate}}))
else:
    print(json.dumps({"error": result.get('error')}))
`;

        // Write temporary Python script
        const scriptPath = join(this.config.outputDir, `tts-${segment.id}.py`);
        writeFileSync(scriptPath, pythonScript);

        // Execute Python script
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.config.pythonPath, [scriptPath], {
                cwd: this.config.kokoroPath
            });

            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        if (result.success) {
                            resolve({
                                id: segment.id,
                                path: result.path,
                                duration: result.duration * 1000, // Convert to ms
                                text: segment.text,
                                voice: segment.voice
                            });
                        } else {
                            reject(new Error(result.error));
                        }
                    } catch (e) {
                        reject(new Error(`Failed to parse output: ${output}`));
                    }
                } else {
                    reject(new Error(`Python process failed: ${error}`));
                }
            });
        });
    }

    /**
     * Create synchronized audio timeline
     */
    async createAudioTimeline(audioSegments, script) {
        const timeline = {
            segments: [],
            totalDuration: 0
        };

        let currentTime = 0;

        for (let i = 0; i < audioSegments.length; i++) {
            const audio = audioSegments[i];
            const scriptSegment = script.segments[i];

            timeline.segments.push({
                id: audio.id,
                audioPath: audio.path,
                text: audio.text,
                voice: audio.voice,
                startTime: currentTime,
                endTime: currentTime + audio.duration,
                duration: audio.duration,
                animationSync: {
                    elements: scriptSegment.elements,
                    startFrame: Math.floor(currentTime * 30 / 1000), // 30 FPS
                    endFrame: Math.floor((currentTime + audio.duration) * 30 / 1000)
                }
            });

            currentTime += audio.duration + 500; // Add 500ms pause between segments
        }

        timeline.totalDuration = currentTime;

        // Save timeline as JSON
        const timelinePath = join(this.config.outputDir, 'audio-timeline.json');
        writeFileSync(timelinePath, JSON.stringify(timeline, null, 2));

        console.log(`⏱️ Audio timeline created: ${timeline.totalDuration}ms total`);

        return timeline;
    }

    /**
     * Merge audio segments into single file
     */
    async mergeAudioSegments(timeline) {
        console.log('🎵 Merging audio segments...');

        const outputPath = join(this.config.outputDir, 'narration-complete.wav');
        
        // Use ffmpeg to concatenate audio files
        const ffmpegCmd = `ffmpeg -i "concat:${timeline.segments.map(s => s.audioPath).join('|')}" -acodec copy ${outputPath}`;
        
        return new Promise((resolve, reject) => {
            const process = spawn('sh', ['-c', ffmpegCmd]);

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Failed to merge audio'));
                }
            });
        });
    }
}

/**
 * AI Script Generator using Llama3
 */
export class AIScriptGenerator {
    constructor(config = {}) {
        this.config = {
            ollamaUrl: config.ollamaUrl || 'http://127.0.0.1:11434/v1',
            model: config.model || 'llama3:latest',
            ...config
        };
    }

    async generateNarrative(context) {
        // Use Llama3 to generate natural narrative
        const prompt = `
Generate a natural, educational narration for the following diagram elements:
${JSON.stringify(context.elements)}

Context: ${context.context}
Type: ${context.type}

Provide a clear, concise explanation that would help someone understand what they're seeing.
Keep it under 30 words.
`;

        try {
            const response = await fetch(`${this.config.ollamaUrl}/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.config.model,
                    prompt: prompt,
                    max_tokens: 100
                })
            });

            const data = await response.json();
            const text = data.choices[0].text.trim();

            return {
                text,
                estimatedDuration: (text.split(' ').length / 150) * 60 * 1000,
                voice: 'af_heart'
            };

        } catch (error) {
            console.error('AI generation failed, using fallback:', error);
            return {
                text: context.elements.join(', '),
                estimatedDuration: 3000,
                voice: 'af_heart'
            };
        }
    }
}