import { readFileSync } from 'fs';
import { join } from 'path';

export class ExcalidrawParser {
    constructor() {
        this.elements = [];
        this.metadata = {};
    }

    async parseFile(filePath) {
        try {
            console.log(`📖 Parsing Excalidraw file: ${filePath}`);
            
            const fileContent = readFileSync(filePath, 'utf8');
            const excalidrawData = JSON.parse(fileContent);
            
            // Extract elements with timestamps
            this.elements = excalidrawData.elements || [];
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
            throw new Error(`Failed to parse Excalidraw file: ${error.message}`);
        }
    }
    
    getAnimationDuration() {
        if (this.elements.length === 0) return 0;
        
        const firstElement = Math.min(...this.elements.map(el => el.created || 0));
        const lastElement = Math.max(...this.elements.map(el => el.updated || el.created || 0));
        
        return lastElement - firstElement;
    }
    
    getElementsInTimeRange(startTime, endTime) {
        return this.elements.filter(el => {
            const elementTime = el.created || 0;
            return elementTime >= startTime && elementTime <= endTime;
        });
    }
    
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