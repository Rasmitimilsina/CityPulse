import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import fs from "fs";

async function main() {
    const url = "https://mcp.brightdata.com/mcp/sse?token=12f07dceb-ceab-45d8-8fdb-4b4e8face482&pro=1";

    console.log("Connecting via SSE...");
    const transport = new SSEClientTransport(new URL(url));
    const client = new Client({
        name: "brightdata-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    console.log("Connected!");

    const tools = await client.listTools();
    console.log("Tools retrieved:", tools.tools.length);
    fs.writeFileSync("mcp_tools.json", JSON.stringify(tools, null, 2));

    // Search for the relevant tool
    const searchTool = tools.tools.find(t => t.name.includes("search") || t.name.includes("news") || t.name.includes("web"));
    console.log("Relevant tool candidates:");
    tools.tools.filter(t => t.name.includes("search") || t.name.includes("news") || t.name.includes("extract")).forEach(t => console.log(t.name));

    transport.close();
}
main().catch(console.error);
