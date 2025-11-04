/**
 * Unit tests for ExcalidrawParser
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { ExcalidrawParser } from '../src/processing/parser.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = './tests/fixtures';

describe('ExcalidrawParser', () => {
    before(() => {
        // Create test fixtures directory
        mkdirSync(TEST_DIR, { recursive: true });

        // Create a valid test file
        const validExcalidraw = {
            type: 'excalidraw',
            version: 2,
            source: 'https://excalidraw.com',
            elements: [
                { id: '1', type: 'rectangle', x: 100, y: 100, width: 200, height: 100, created: 1000, updated: 1500 },
                { id: '2', type: 'ellipse', x: 400, y: 100, width: 150, height: 150, created: 2000, updated: 2500 },
                { id: '3', type: 'text', x: 100, y: 300, text: 'Hello', created: 3000, updated: 3500 }
            ],
            appState: {
                viewBackgroundColor: '#ffffff'
            }
        };
        writeFileSync(join(TEST_DIR, 'valid.excalidraw'), JSON.stringify(validExcalidraw, null, 2));

        // Create invalid JSON file
        writeFileSync(join(TEST_DIR, 'invalid.excalidraw'), '{ invalid json }');

        // Create file without elements array
        writeFileSync(join(TEST_DIR, 'no-elements.excalidraw'), JSON.stringify({ version: 2 }));
    });

    after(() => {
        // Clean up test fixtures
        rmSync(TEST_DIR, { recursive: true, force: true });
    });

    describe('parseFile', () => {
        it('should successfully parse a valid Excalidraw file', async () => {
            const parser = new ExcalidrawParser();
            const result = await parser.parseFile(join(TEST_DIR, 'valid.excalidraw'));

            assert.strictEqual(result.elements.length, 3, 'Should have 3 elements');
            assert.strictEqual(result.timestamps.length, 3, 'Should have 3 timestamps');
            assert.ok(result.metadata, 'Should have metadata');
            assert.strictEqual(result.metadata.version, 2, 'Should have version 2');
        });

        it('should throw error for missing file path', async () => {
            const parser = new ExcalidrawParser();
            await assert.rejects(
                async () => await parser.parseFile(),
                { message: 'File path is required' }
            );
        });

        it('should throw error for non-string file path', async () => {
            const parser = new ExcalidrawParser();
            await assert.rejects(
                async () => await parser.parseFile(123),
                { message: /File path must be a string/ }
            );
        });

        it('should throw error for non-existent file', async () => {
            const parser = new ExcalidrawParser();
            await assert.rejects(
                async () => await parser.parseFile('/nonexistent/file.excalidraw'),
                { message: /File not found/ }
            );
        });

        it('should throw error for invalid JSON', async () => {
            const parser = new ExcalidrawParser();
            await assert.rejects(
                async () => await parser.parseFile(join(TEST_DIR, 'invalid.excalidraw')),
                { message: /Invalid JSON/ }
            );
        });

        it('should throw error for missing elements array', async () => {
            const parser = new ExcalidrawParser();
            await assert.rejects(
                async () => await parser.parseFile(join(TEST_DIR, 'no-elements.excalidraw')),
                { message: /missing or invalid "elements" array/ }
            );
        });

        it('should sort elements by creation timestamp', async () => {
            const parser = new ExcalidrawParser();
            const result = await parser.parseFile(join(TEST_DIR, 'valid.excalidraw'));

            assert.strictEqual(result.elements[0].id, '1', 'First element should be id 1');
            assert.strictEqual(result.elements[1].id, '2', 'Second element should be id 2');
            assert.strictEqual(result.elements[2].id, '3', 'Third element should be id 3');
        });
    });

    describe('getAnimationDuration', () => {
        it('should calculate correct animation duration', async () => {
            const parser = new ExcalidrawParser();
            await parser.parseFile(join(TEST_DIR, 'valid.excalidraw'));

            const duration = parser.getAnimationDuration();
            assert.strictEqual(duration, 2500, 'Duration should be 2500ms (3500 - 1000)');
        });

        it('should return 0 for empty elements', () => {
            const parser = new ExcalidrawParser();
            const duration = parser.getAnimationDuration();
            assert.strictEqual(duration, 0, 'Duration should be 0 for empty elements');
        });
    });

    describe('getElementsInTimeRange', () => {
        it('should return elements within time range', async () => {
            const parser = new ExcalidrawParser();
            await parser.parseFile(join(TEST_DIR, 'valid.excalidraw'));

            const elements = parser.getElementsInTimeRange(1500, 2500);
            assert.strictEqual(elements.length, 1, 'Should have 1 element in range');
            assert.strictEqual(elements[0].id, '2', 'Should be element 2');
        });

        it('should return empty array when no elements in range', async () => {
            const parser = new ExcalidrawParser();
            await parser.parseFile(join(TEST_DIR, 'valid.excalidraw'));

            const elements = parser.getElementsInTimeRange(5000, 6000);
            assert.strictEqual(elements.length, 0, 'Should have 0 elements in range');
        });
    });

    describe('prepareForAnimation', () => {
        it('should format data for excalidraw-animate', async () => {
            const parser = new ExcalidrawParser();
            await parser.parseFile(join(TEST_DIR, 'valid.excalidraw'));

            const prepared = parser.prepareForAnimation();
            assert.strictEqual(prepared.type, 'excalidraw', 'Should have type excalidraw');
            assert.strictEqual(prepared.version, 2, 'Should have version 2');
            assert.ok(prepared.elements, 'Should have elements');
            assert.ok(prepared.appState, 'Should have appState');
        });
    });
});
