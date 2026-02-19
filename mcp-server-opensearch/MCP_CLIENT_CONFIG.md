# Example MCP Client Configurations

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "opensearch": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-opensearch/dist/index.js"],
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

## OpenCode Configuration

Add to `.opencode/opencode.jsonc`:

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

## Alternative: Using npx (if published)

```jsonc
{
  "mcp": {
    "opensearch": {
      "type": "local",
      "command": ["npx", "mcp-server-opensearch"],
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

## Testing the MCP Server

### 1. Manual Test (stdio)

Run the server and interact manually:

```bash
cd mcp-server-opensearch
npm run build
node dist/index.js
```

Then send MCP protocol messages via stdin. Example initialize request:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}
```

### 2. With MCP Inspector

Use the MCP Inspector tool to test your server:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This will open a web interface to interact with your MCP server.

### 3. Sample Tool Call

After connecting, call the tool:

```json
{
  "method": "tools/call",
  "params": {
    "name": "execute_opensearch_query",
    "arguments": {
      "query": {
        "query": {
          "term": {
            "eventData.moduleId.keyword": "FACIAL_RECOGNITION"
          }
        },
        "sort": [
          {
            "eventData.eventDateTime": {
              "order": "desc"
            }
          }
        ],
        "size": 5
      },
      "format": "analytics"
    }
  }
}
```

## Troubleshooting

### Server not starting
- Check that Node.js is installed: `node --version`
- Ensure dependencies are installed: `npm install`
- Verify build succeeded: `npm run build`

### Connection errors
- Verify OpenSearch is running and accessible
- Check environment variables in `.env` or MCP client config
- Test OpenSearch connection manually:
  ```bash
  curl -u admin:password http://localhost:9200
  ```

### Query errors
- Validate your Query DSL syntax
- Check field names match your index mapping
- Use keyword fields for exact matches: `.keyword` suffix

### MCP client not detecting server
- Ensure absolute paths are used in configuration
- Check that the command is executable
- Look at stderr output for server logs
- Restart your MCP client after configuration changes
