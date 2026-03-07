import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Navigate to the local server
    await page.goto('http://localhost:3000/');

    // Wait for the map and tiles to load
    await page.waitForTimeout(5000);

    // Take a screenshot
    await page.screenshot({ path: 'screenshot.png', fullPage: true });

    await browser.close();
    console.log('Screenshot saved to screenshot.png');
})();
