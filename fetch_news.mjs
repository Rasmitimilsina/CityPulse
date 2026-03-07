import fs from "fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    const token = process.env.BRIGHTDATA_API_TOKEN || "2f07dceb-ceab-45d8-8fdb-4b4e8face482";
    const isWin = process.platform === 'win32';
    const transport = new StdioClientTransport({
        command: isWin ? "cmd.exe" : "npx",
        args: isWin ? ["/c", `set BRIGHTDATA_API_TOKEN=${token} && set API_TOKEN=${token} && set PRO_MODE=true && npx -y @brightdata/mcp`] : ["-y", "@brightdata/mcp"],
        env: {
            ...process.env,
            BRIGHTDATA_API_TOKEN: token,
            API_TOKEN: token,
            PRO_MODE: "true"
        }
    });

    const client = new Client({ name: "brightdata-agent", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);

    try {
        const result = await client.callTool({
            name: "search_engine",
            arguments: {
                query: "City of Montgomery, Alabama news when:30d",
                engine: "google"
            }
        });
        fs.writeFileSync("news_results.json", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e.message);
    }

    transport.close();
}
main().catch(console.error);
