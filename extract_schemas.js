const fs = require('fs');

const data = JSON.parse(fs.readFileSync('mcp_tools.json'));
const tools = ['search_engine', 'search_engine_batch', 'web_data_reuter_news'];

for (const name of tools) {
    const t = data.tools.find(x => x.name === name);
    if (t) {
        fs.writeFileSync(name + '_schema.json', JSON.stringify(t.inputSchema, null, 2));
    }
}
