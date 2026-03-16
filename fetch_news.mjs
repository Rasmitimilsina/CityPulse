import https from "https";
import fs from "fs";

const API_TOKEN = process.env.BRIGHTDATA_API_TOKEN || "2f07dceb-ceab-45d8-8fdb-4b4e8face482";

// ─── Strategy 1: Bright Data SERP API via their proxy ─────────────────────
// Bright Data's SERP API works as an HTTPS proxy — you send a request
// to Google (or Bing) through their proxy host, and they return the SERP results as JSON
async function fetchViaBrightDataProxy() {
    return new Promise((resolve, reject) => {
        const query = encodeURIComponent("City of Montgomery Alabama news");
        const targetUrl = `https://www.google.com/search?q=${query}&num=10&brd_json=1`;

        const options = {
            method: "CONNECT",
            hostname: "brd.superproxy.io",
            port: 22225,
            path: "www.google.com:443",
            headers: {
                "Proxy-Authorization": `Basic ${Buffer.from(`brd-customer-hl_59e5db71-zone-serp:${API_TOKEN}`).toString("base64")}`,
            },
            timeout: 20000,
        };

        // Use a simpler approach: direct HTTPS request through proxy
        const proxyReq = https.request({
            hostname: "brd.superproxy.io",
            port: 22225,
            path: targetUrl,
            method: "GET",
            headers: {
                "Proxy-Authorization": `Basic ${Buffer.from(`brd-customer-hl_59e5db71-zone-serp:${API_TOKEN}`).toString("base64")}`,
                "Host": "www.google.com",
            },
            timeout: 20000,
        }, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`Proxy returned ${res.statusCode}`));
                }
            });
        });

        proxyReq.on("timeout", () => { proxyReq.destroy(); reject(new Error("Proxy timeout")); });
        proxyReq.on("error", (e) => reject(e));
        proxyReq.end();
    });
}

// ─── Strategy 2: Google News RSS (always free, no auth needed) ────────────
async function fetchViaGoogleNewsRSS() {
    return new Promise((resolve, reject) => {
        const query = encodeURIComponent("Montgomery Alabama city news");
        const path = `/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

        const req = https.request({
            hostname: "news.google.com",
            path: path,
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
                "Accept-Language": "en-US,en;q=0.9",
            },
            timeout: 15000,
        }, (res) => {
            // Handle redirect
            if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
                const loc = res.headers.location;
                const locUrl = loc.startsWith("http") ? new URL(loc) : new URL(`https://news.google.com${loc}`);
                return https.get({
                    hostname: locUrl.hostname,
                    path: locUrl.pathname + locUrl.search,
                    headers: { "User-Agent": "Mozilla/5.0", "Accept": "*/*" },
                    timeout: 15000,
                }, (r2) => {
                    let d2 = "";
                    r2.on("data", c => d2 += c);
                    r2.on("end", () => resolve(d2));
                }).on("error", reject);
            }

            let data = "";
            res.on("data", c => { data += c; });
            res.on("end", () => {
                if (res.statusCode === 200) resolve(data);
                else reject(new Error(`RSS HTTP ${res.statusCode}`));
            });
        });

        req.on("timeout", () => { req.destroy(); reject(new Error("RSS timeout")); });
        req.on("error", reject);
        req.end();
    });
}

function decodeHtmlEntities(str) {
    // Decode HTML entities — run twice to handle double-encoded content
    const decode = (s) => s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
    return decode(decode(str));
}

function stripHtmlTags(str) {
    return str
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function parseRSSToOrganic(xmlData) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlData)) !== null && items.length < 10) {
        const itemXml = match[1];

        // Title
        const titleMatch =
            itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
            itemXml.match(/<title>([\s\S]*?)<\/title>/);

        // Real source URL: try <source url="..."> attribute first
        const sourceAttrMatch = itemXml.match(/<source[^>]+url="(https?:\/\/[^"]+)"/);

        // Fallback: try extracting non-Google link from description HTML (after decoding)
        const descRaw =
            (itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                itemXml.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "";

        const descDecoded = decodeHtmlEntities(descRaw);

        // Find real source link embedded in description HTML
        const descLinkMatch = descDecoded.match(/href="(https?:\/\/(?!news\.google)[^"]+)"/);

        // Google redirect link as last resort
        const googleLinkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);

        const link = sourceAttrMatch
            ? sourceAttrMatch[1]
            : descLinkMatch
                ? descLinkMatch[1]
                : (googleLinkMatch ? googleLinkMatch[1].trim() : "");

        // Build clean description: decode + strip tags, avoid the anchor tag mess
        const cleanDesc = stripHtmlTags(descDecoded)
            .replace(/Read more\.?/gi, "")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 220);

        if (titleMatch && link) {
            const title = decodeHtmlEntities(titleMatch[1]).trim();
            items.push({
                link,
                title,
                description: cleanDesc || "Click to read the full article."
            });
        }
    }

    return items;
}

async function main() {
    let organic = null;

    // Strategy 1: Bright Data proxy
    try {
        console.log("Attempting Bright Data proxy SERP...");
        const rawData = await fetchViaBrightDataProxy();
        const parsed = JSON.parse(rawData);
        if (parsed.organic) {
            organic = parsed.organic;
        } else if (Array.isArray(parsed)) {
            organic = parsed;
        }
        if (organic && organic.length > 0) {
            console.log(`✓ Bright Data proxy returned ${organic.length} results`);
        }
    } catch (e) {
        console.error("Bright Data proxy failed:", e.message);
    }

    // Strategy 2: Google News RSS
    if (!organic || organic.length === 0) {
        try {
            console.log("Falling back to Google News RSS...");
            const rssData = await fetchViaGoogleNewsRSS();
            organic = parseRSSToOrganic(rssData);
            if (organic && organic.length > 0) {
                console.log(`✓ Google News RSS returned ${organic.length} results`);
            } else {
                console.warn("Google News RSS returned 0 parsed items");
            }
        } catch (e) {
            console.error("Google News RSS failed:", e.message);
        }
    }

    // Strategy 3: Static fallback
    if (!organic || organic.length === 0) {
        console.log("Using built-in fallback data...");
        organic = [
            {
                link: "https://www.montgomeryal.gov/Home/Components/News/News/4800/16",
                title: "Montgomery Continues Progress on Public Safety",
                description: "Mayor Reed shared year-end public safety data, announced new recruitment and retention incentives."
            },
            {
                link: "https://www.montgomeryadvertiser.com/news/",
                title: "Local and River Region News - The Montgomery Advertiser",
                description: "Local news and events for Montgomery Alabama and the River Region."
            },
            {
                link: "https://www.wsfa.com/news/",
                title: "Montgomery, Alabama News - WSFA 12 News",
                description: "Latest local news and breaking stories from Montgomery and central Alabama."
            }
        ];
    }

    // Write in the format newsService.ts expects
    const output = {
        content: [
            {
                type: "text",
                text: JSON.stringify({ organic })
            }
        ]
    };

    fs.writeFileSync("news_results.json", JSON.stringify(output, null, 2));
    console.log(`✓ Wrote ${organic.length} news items to news_results.json`);
}

main().catch((e) => {
    console.error("Fatal error:", e.message);
    process.exit(1);
});
