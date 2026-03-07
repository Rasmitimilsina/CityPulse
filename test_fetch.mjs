import fetch from 'node-fetch'; // wait, node 18+ has global fetch

async function test() {
    const url1 = "https://mcp.brightdata.com/mcp?token=12f07dceb-ceab-45d8-8fdb-4b4e8face482&pro=1";
    const url2 = "https://mcp.brightdata.com/mcp?token=1 2f07dceb-ceab-45d8-8fdb-4b4e8face482 &pro=1";
    const url3 = "https://mcp.brightdata.com/mcp?token=2f07dceb-ceab-45d8-8fdb-4b4e8face482&pro=1";

    for (const url of [url1, url2, url3]) {
        try {
            const res = await fetch(url);
            const text = await res.text();
            console.log(`URL: ${url}`);
            console.log(`Status: ${res.status}`);
            console.log(`Body: ${text}\n`);
        } catch (e) {
            console.error(e);
        }
    }
}
test();
