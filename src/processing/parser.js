import { readFileSync, existsSync } from 'fs';
import { join, isAbsolute } from 'path';

/**
 * Parser for Excalidraw files that extracts elements and timestamps for animation
 * @class ExcalidrawParser
 */
export class ExcalidrawParser {
    constructor() {
        this.elements = [];
        this.metadata = {};
    }

    /**
     * Parse an Excalidraw file and extract animation data
     * @param {string} filePath - Absolute or relative path to the .excalidraw file
     * @returns {Promise<{elements: Array, timestamps: Array, metadata: Object}>} Parsed Excalidraw data
     * @throws {Error} If file doesn't exist, is invalid, or cannot be parsed
     */
    async parseFile(filePath) {
        // Input validation
        if (!filePath) {
            throw new Error('File path is required');
        }

        if (typeof filePath !== 'string') {
            throw new Error(`File path must be a string, got ${typeof filePath}`);
        }

        if (!existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        if (!filePath.endsWith('.excalidraw') && !filePath.endsWith('.json')) {
            console.warn(`⚠️  Warning: File does not have .excalidraw or .json extension: ${filePath}`);
        }

        try {
            console.log(`📖 Parsing Excalidraw file: ${filePath}`);

            const fileContent = readFileSync(filePath, 'utf8');

            // Validate JSON
            let excalidrawData;
            try {
                excalidrawData = JSON.parse(fileContent);
            } catch (jsonError) {
                throw new Error(`Invalid JSON in file: ${jsonError.message}`);
            }

            // Validate Excalidraw structure
            if (!excalidrawData || typeof excalidrawData !== 'object') {
                throw new Error('Invalid Excalidraw file: expected JSON object');
            }

            if (!Array.isArray(excalidrawData.elements)) {
                throw new Error('Invalid Excalidraw file: missing or invalid "elements" array');
            }

            // Extract elements with timestamps
            this.elements = excalidrawData.elements;
            this.metadata = {
                version: excalidrawData.version,
                source: excalidrawData.source,
                appState: excalidrawData.appState
            };

            console.log(`✓ Found ${this.elements.length} drawing elements`);

            // Sort elements by creation timestamp for animation sequence
            this.elements.sort((a, b) => (a.created || 0) - (b.created || 0));

            // Extract timestamp data for animation
            const timestamps = this.elements.map(el => ({
                id: el.id,
                type: el.type,
                created: el.created,
                updated: el.updated || el.created
            }));

            console.log(`✓ Extracted timestamps for ${timestamps.length} elements`);
            console.log(`📊 Animation duration: ${this.getAnimationDuration()}ms`);

            return {
                elements: this.elements,
                timestamps,
                metadata: this.metadata
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            } else if (error.code === 'EACCES') {
                throw new Error(`Permission denied reading file: ${filePath}`);
            } else if (error.message.startsWith('Invalid')) {
                throw error; // Re-throw validation errors as-is
            } else {
                throw new Error(`Failed to parse Excalidraw file: ${error.message}`);
            }
        }
    }
    
    /**
     * Calculate the total animation duration based on element timestamps
     * @returns {number} Animation duration in milliseconds
     */
    getAnimationDuration() {
        if (this.elements.length === 0) return 0;

        const firstElement = Math.min(...this.elements.map(el => el.created || 0));
        const lastElement = Math.max(...this.elements.map(el => el.updated || el.created || 0));

        return lastElement - firstElement;
    }

    /**
     * Get elements within a specific time range
     * @param {number} startTime - Start time in milliseconds
     * @param {number} endTime - End time in milliseconds
     * @returns {Array} Elements created within the time range
     */
    getElementsInTimeRange(startTime, endTime) {
        return this.elements.filter(el => {
            const elementTime = el.created || 0;
            return elementTime >= startTime && elementTime <= endTime;
        });
    }

    /**
     * Prepare parsed data for excalidraw-animate library
     * @returns {Object} Formatted Excalidraw data structure
     */
    prepareForAnimation() {
        // Prepare elements for excalidraw-animate
        return {
            type: "excalidraw",
            version: this.metadata.version || 2,
            source: this.metadata.source || "https://excalidraw.com",
            elements: this.elements,
            appState: this.metadata.appState || {
                gridSize: null,
                viewBackgroundColor: "#ffffff"
            }
        };
    }
}