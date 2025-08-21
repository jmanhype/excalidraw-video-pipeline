import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

async function recordSVGAnimation() {
    console.log('🎬 Recording SVG animation to prove it works...');
    
    const browser = await puppeteer.launch({ 
        headless: false, // Show browser to see it working
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Load the SVG
    await page.goto('file://' + process.cwd() + '/output/working-animation.svg');
    
    console.log('📸 Taking screenshots at different animation stages...');
    
    const screenshots = [
        { time: 0, name: 'start' },
        { time: 1000, name: 'rectangle-drawing' },
        { time: 3000, name: 'circle-drawing' },
        { time: 5000, name: 'arrow-drawing' },
        { time: 7000, name: 'text-typing' },
        { time: 9000, name: 'freedraw' },
        { time: 10500, name: 'complete' }
    ];
    
    for (const shot of screenshots) {
        // Wait for animation time
        await new Promise(resolve => setTimeout(resolve, shot.time));
        
        const screenshot = await page.screenshot({ 
            path: `output/proof-${shot.name}.png`,
            type: 'png'
        });
        console.log(`✅ Captured: ${shot.name} at ${shot.time}ms`);
        
        // Reset animation for next shot
        if (shot.time < 10500) {
            await page.reload();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log('🎯 Animation recording complete!');
    console.log('Check output/proof-*.png files to see progressive animation at each stage');
    
    await browser.close();
}

recordSVGAnimation().catch(console.error);