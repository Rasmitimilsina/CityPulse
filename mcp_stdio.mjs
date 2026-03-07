import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";

async function main() {
    const token = "12f07dceb-ceab-45d8-8fdb-4b4e8face482";

    console.log("Connecting via Stdio...");
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
    console.log("Connected successfully to Bright Data MCP server!");

    const tools = await client.listTools();
    console.log("Tools retrieved:", tools.tools.length);
    fs.writeFileSync("mcp_tools.json", JSON.stringify(tools, null, 2));

    const relevantTools = tools.tools.filter(t => t.name.includes("search") || t.name.includes("news") || t.name.includes("extract") || t.name.includes("web"));
    console.log("Relevant Tool names:");
    relevantTools.forEach(t => console.log(t.name));

    transport.close();
}
main().catch(console.error);
