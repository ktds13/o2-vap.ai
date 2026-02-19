# Quick Start Guide - OpenSearch MCP Server

## What is this?

A standalone MCP (Model Context Protocol) server that lets you query OpenSearch analytics events from any MCP-compatible client like Claude Desktop or OpenCode.

## Setup (5 minutes)

### 1. Build the Server
```bash
cd mcp-server-opensearch
npm install
npm run build
```

### 2. Configure Your MCP Client

**For OpenCode** - Edit `.opencode/opencode.jsonc`:
```jsonc
{
  "mcp": {
    "opensearch": {
      "type": "local",
      "command": ["node", "D:/GW/o2-vap.ai/mcp-server-opensearch/dist/index.js"],
      "env": {
        "OPENSEARCH_URL": "http://localhost:9200",
        "OPENSEARCH_USER_NAME": "admin",
        "OPENSEARCH_PASSWORD": "NETe2@sia",
        "INDEX_NAME": "analytics-events"
      }
    }
  }
}
```

**For Claude Desktop** - Edit `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "opensearch": {
      "command": "node",
      "args": ["D:/GW/o2-vap.ai/mcp-server-opensearch/dist/index.js"],
      "env": {
        "OPENSEARCH_URL": "http://localhost:9200",
        "OPENSEARCH_USER_NAME": "admin",
        "OPENSEARCH_PASSWORD": "NETe2@sia",
        "INDEX_NAME": "analytics-events"
      }
    }
  }
}
```

### 3. Restart Your MCP Client

Restart OpenCode or Claude Desktop to load the new server.

## Usage

Now you can query OpenSearch using natural language!

**Example prompts:**
- "Show me the latest 10 facial recognition events"
- "Find vehicle license plate events from the last 24 hours"
- "Count events by camera"
- "Get crowd counting events where crowd size is over 50"

The MCP client will automatically use the `execute_opensearch_query` tool.

## Test Manually (Optional)

```bash
# Start the server
npm start

# Or use MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Verify Connection

Ask your MCP client:
> "Query OpenSearch for the latest 5 events"

You should get a formatted response with analytics events.

## Troubleshooting

**Server not working?**
- Check OpenSearch is running: `curl http://localhost:9200`
- Verify environment variables in client config
- Check absolute path to `dist/index.js`
- Restart MCP client after config changes

**Query errors?**
- Use `.keyword` suffix for exact matches
- Check field names match your index
- Validate Query DSL syntax

## Response Formats

By default, you get clean analytics events:
```json
{
  "Count": 10,
  "AnalyticsEvents": [
    {
      "eventId": "...",
      "moduleId": "FACIAL_RECOGNITION",
      "eventDateTime": "...",
      ...
    }
  ]
}
```

You can also request:
- `"format": "dto"` - Include aggregation buckets and metadata
- `"format": "raw"` - Full OpenSearch response

## Example Queries

### Get latest events
```
Show me the latest 10 analytics events
```

### Filter by module
```
Find all facial recognition events from today
```

### Time range
```
Get vehicle license plate events from the last 24 hours
```

### Aggregation
```
Count events by camera and show the latest event from each
```

## Documentation

- **README.md** - Full documentation
- **TEST_QUERIES.md** - 10+ example queries
- **MCP_CLIENT_CONFIG.md** - Detailed client configuration
- **IMPLEMENTATION_SUMMARY.md** - Technical details

## What's Next?

Start querying! Your MCP client now has access to all your OpenSearch analytics events with automatic formatting.

## Need Help?

Check the full documentation in `README.md` or test queries in `TEST_QUERIES.md`.
