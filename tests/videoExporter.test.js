/**
 * Unit tests for VideoExporter
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { VideoExporter } from '../src/export/videoExporter.js';
import { rmSync } from 'fs';

const TEST_OUTPUT_DIR = './tests/output';

describe('VideoExporter', () => {
    after(() => {
        // Clean up test output
        rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    });

    describe('constructor', () => {
        it('should create instance with default config', () => {
            const exporter = new VideoExporter();
            assert.ok(exporter, 'Exporter should be created');
            assert.strictEqual(exporter.config.format, 'mp4', 'Default format should be mp4');
            assert.strictEqual(exporter.config.codec, 'libx264', 'Default codec should be libx264');
            assert.strictEqual(exporter.config.crf, 18, 'Default CRF should be 18');
        });

        it('should create instance with custom config', () => {
            const config = {
                outputDir: TEST_OUTPUT_DIR,
                format: 'webm',
                codec: 'libvpx',
                crf: 23
            };
            const exporter = new VideoExporter(config);
            assert.strictEqual(exporter.config.outputDir, TEST_OUTPUT_DIR, 'Should use custom outputDir');
            assert.strictEqual(exporter.config.format, 'webm', 'Should use custom format');
            assert.strictEqual(exporter.config.codec, 'libvpx', 'Should use custom codec');
            assert.strictEqual(exporter.config.crf, 23, 'Should use custom CRF');
        });

        it('should merge custom config with defaults', () => {
            const config = { crf: 20 };
            const exporter = new VideoExporter(config);
            assert.strictEqual(exporter.config.crf, 20, 'Should use custom CRF');
            assert.strictEqual(exporter.config.codec, 'libx264', 'Should keep default codec');
        });
    });

    describe('exportVideo validation', () => {
        it('should throw error for missing animation data', async () => {
            const exporter = new VideoExporter({ outputDir: TEST_OUTPUT_DIR });
            await assert.rejects(
                async () => await exporter.exportVideo(),
                { message: 'Animation data is required' }
            );
        });

        it('should throw error for non-object animation data', async () => {
            const exporter = new VideoExporter({ outputDir: TEST_OUTPUT_DIR });
            await assert.rejects(
                async () => await exporter.exportVideo('invalid'),
                { message: /Animation data must be an object/ }
            );
        });

        it('should throw error for non-string output filename', async () => {
            const exporter = new VideoExporter({ outputDir: TEST_OUTPUT_DIR });
            const animationData = { type: 'test', frames: [], duration: 1000 };
            await assert.rejects(
                async () => await exporter.exportVideo(animationData, 123),
                { message: /Output filename must be a string/ }
            );
        });
    });

    describe('getVideoInfo validation', () => {
        it('should reject with error for missing file path', async () => {
            const exporter = new VideoExporter({ outputDir: TEST_OUTPUT_DIR });
            await assert.rejects(
                async () => await exporter.getVideoInfo(),
                { message: 'File path is required' }
            );
        });

        it('should reject with error for non-existent file', async () => {
            const exporter = new VideoExporter({ outputDir: TEST_OUTPUT_DIR });
            await assert.rejects(
                async () => await exporter.getVideoInfo('/nonexistent/video.mp4'),
                { message: /File not found/ }
            );
        });
    });
});
