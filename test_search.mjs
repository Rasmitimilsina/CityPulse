import fs from "fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    const token = "12f07dceb-ceab-45d8-8fdb-4b4e8face482";

    const transport = new StdioClientTransport({
        command: process.platform === 'win32' ? "npx.cmd" : "npx",
        args: ["-y", "@brightdata/mcp"],
        env: {
            ...process.env,
            BRIGHTDATA_API_TOKEN: token,
            API_TOKEN: token,
            PRO_MODE: "true"
        }
    });

    const client = new Client({
        name: "brightdata-agent",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    await client.connect(transport);

    console.log("Calling search_engine tool...");
    try {
        const result = await client.callTool({
            name: "search_engine",
            arguments: { q: "City of Montgomery, Alabama news", num: 10 }
        });
        fs.writeFileSync("search_result.json", JSON.stringify(result, null, 2));
        console.log("Search complete! Result written to search_result.json");
    } catch (e) {
        console.error("Error calling search_engine:", e.message);
    }

    transport.close();
}
main().catch(console.error);
