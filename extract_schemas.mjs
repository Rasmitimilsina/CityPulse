import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('mcp_tools.json', 'utf-8'));
const tools = ['search_engine', 'search_engine_batch', 'web_data_reuter_news'];

for (const name of tools) {
    const t = data.tools.find(x => x.name === name);
    if (t) {
        writeFileSync(name + '_schema.json', JSON.stringify(t.inputSchema, null, 2));
    }
}
