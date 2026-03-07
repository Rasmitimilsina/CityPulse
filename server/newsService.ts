import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Keep a simple cache
let cachedNews: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION_MS = 60 * 1000; // 1 minute

export async function fetchNews() {
    const now = Date.now();
    if (cachedNews && (now - lastFetchTime < CACHE_DURATION_MS)) {
        return cachedNews;
    }

    try {
        console.log("Spawning isolated fetch_news.mjs...");
        // Run the script synchronously. Safe because it finishes in ~3 seconds and runs infrequently
        const scriptPath = path.resolve(process.cwd(), "fetch_news.mjs");
        execSync(`node ${scriptPath}`, { stdio: 'inherit' });

        const resultsPath = path.resolve(process.cwd(), "news_results.json");
        if (fs.existsSync(resultsPath)) {
            const rawData = fs.readFileSync(resultsPath, "utf-8");
            const result = JSON.parse(rawData);

            if (result && Array.isArray(result.content) && result.content.length > 0) {
                const textResponse = result.content[0].text;
                if (typeof textResponse === 'string') {
                    const parsed = JSON.parse(textResponse);
                    if (parsed.organic) {
                        cachedNews = parsed.organic;
                        lastFetchTime = now;
                        return cachedNews;
                    }
                }
            }
        }
    } catch (e: any) {
        console.error("Error executing fetch_news.mjs:", e.message);
    }

    if (!cachedNews || cachedNews.length === 0) {
        console.log("Returning fallback data due to fetch error.");
        cachedNews = [
            {
                "link": "https://www.montgomeryadvertiser.com/news/",
                "title": "Local and River Region News - The Montgomery Advertiser",
                "description": "Local news and events for Montgomery Alabama and the River Region brought to you by The Montgomery Advertiser."
            },
            {
                "link": "https://www.wsfa.com/2025/10/08/montgomery-suspends-downtown-entertainment-district-following-mass-shooting/",
                "title": "Montgomery suspends downtown entertainment district ...",
                "description": "The Montgomery City Council voted unanimously Tuesday night to suspend the downtown entertainment district following recent events."
            }
        ];
    }

    return cachedNews || [];
}
