import fetch from 'node-fetch';

async function testSSE() {
    const token = "12f07dceb-ceab-45d8-8fdb-4b4e8face482";
    const urls = [
        `https://mcp.brightdata.com/mcp/sse?token=${token}&pro=1`,
        `https://mcp.brightdata.com/sse?token=${token}&pro=1`
    ];

    for (const url of urls) {
        try {
            console.log(`Trying ${url}`);
            const res = await fetch(url);
            console.log(`Status: ${res.status}`);
            // text might be an SSE stream that doesn't end, let's just abort after 2 seconds
            const controller = new AbortController();
            const signal = controller.signal;
            setTimeout(() => controller.abort(), 2000);
            try {
                const text = await res.text({ signal });
                console.log(`Body (first 100 chars): ${text.slice(0, 100)}\n`);
            } catch (e) {
                console.log("Chunk read error or aborted");
            }
        } catch (e) {
            console.error(e);
        }
    }
}
testSSE();
