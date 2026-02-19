# MCP Server OpenSearch

A Model Context Protocol (MCP) server that provides OpenSearch query capabilities for analytics events with automatic response formatting.

## Features

- **Execute OpenSearch Queries**: Run full OpenSearch Query DSL queries
- **Multiple Response Formats**: Get results in analytics, dto, or raw format
- **Analytics Event Support**: All analytics modules (facial recognition, crowd counting, vehicle detection, etc.)
- **Automatic Formatting**: Transforms OpenSearch responses to clean analytics event objects
- **Environment-based Configuration**: Uses `.env` for OpenSearch connection settings

## Installation

```bash
cd mcp-server-opensearch
npm install
npm run build
```

## Configuration

Create a `.env` file in the project root (or use the existing one):

```env
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_USER_NAME=admin
OPENSEARCH_PASSWORD=your_password
INDEX_NAME=analytics-events
```

## Usage

### As a Standalone MCP Server

Run the server:
```bash
npm start
# or
node dist/index.js
```

The server communicates via stdio following the MCP protocol.

### With MCP Clients (e.g., Claude Desktop, OpenCode)

Add to your MCP client configuration:

**For Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "opensearch": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-opensearch/dist/index.js"],
      "env": {
        "OPENSEARCH_URL": "http://localhost:9200",
        "OPENSEARCH_USER_NAME": "admin",
        "OPENSEARCH_PASSWORD": "your_password",
        "INDEX_NAME": "analytics-events"
      }
    }
  }
}
```

**For OpenCode** (`.opencode/opencode.jsonc`):
```jsonc
{
  "mcp": {
    "opensearch": {
      "type": "local",
      "command": ["node", "/absolute/path/to/mcp-server-opensearch/dist/index.js"],
      "env": {
        "OPENSEARCH_URL": "http://localhost:9200",
        "OPENSEARCH_USER_NAME": "admin",
        "OPENSEARCH_PASSWORD": "your_password",
        "INDEX_NAME": "analytics-events"
      }
    }
  }
}
```

**Using npx** (if published to npm):
```jsonc
{
  "mcp": {
    "opensearch": {
      "type": "local",
      "command": ["npx", "mcp-server-opensearch"]
    }
  }
}
```

## Tool: execute_opensearch_query

Execute OpenSearch queries and get formatted results.

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | Object | `{}` | Full OpenSearch Query DSL object |
| `index` | String | `analytics-events` | Target index name |
| `format` | Enum | `analytics` | Response format: `analytics`, `dto`, or `raw` |

### Response Formats

#### 1. Analytics Format (Default)
Clean UI-friendly format:
```json
{
  "Count": 10,
  "AnalyticsEvents": [
    {
      "eventId": "evt-123",
      "taskId": "task-456",
      "moduleId": "FACIAL_RECOGNITION",
      "eventSourceId": "camera-01",
      "eventDateTime": "2026-02-19T10:30:00Z",
      "status": "verified",
      "media": { "url": "...", "type": "image", "mimeType": "image/jpeg" },
      "eventData": { /* module-specific data */ }
    }
  ],
  "Aggregation": []
}
```

#### 2. DTO Format
Includes metadata and aggregation buckets:
```json
{
  "totalValue": 10,
  "AggsResult": [
    {
      "key": "camera-01",
      "doc_count": 450,
      "latest_events": { /* top hits */ }
    }
  ],
  "HitList": [
    {
      "_id": "evt-123",
      "_index": "analytics-events",
      "_score": 1.0,
      "_source": { /* event data */ }
    }
  ]
}
```

#### 3. Raw Format
Complete OpenSearch response with `_shards`, `hits`, `took`, etc.

### Example Queries

#### Get Latest 10 Facial Recognition Events
```json
{
  "query": {
    "query": {
      "term": { "eventData.moduleId.keyword": "FACIAL_RECOGNITION" }
    },
    "sort": [{ "eventData.eventDateTime": { "order": "desc" } }],
    "size": 10
  },
  "format": "analytics"
}
```

#### Search Vehicle License Plates in Last 24 Hours
```json
{
  "query": {
    "query": {
      "bool": {
        "must": [
          { "term": { "eventData.moduleId.keyword": "VH_LP_RECOGNITION" } },
          { "range": { "eventData.eventDateTime": { "gte": "now-24h" } } }
        ]
      }
    }
  },
  "format": "analytics"
}
```

#### Get Event Counts by Camera
```json
{
  "query": {
    "size": 0,
    "aggs": {
      "by_source": {
        "terms": { "field": "eventData.eventSourceId.keyword", "size": 10 },
        "aggs": {
          "latest_events": {
            "top_hits": {
              "sort": [{ "eventData.eventDateTime": { "order": "desc" } }],
              "size": 1
            }
          }
        }
      }
    }
  },
  "format": "dto"
}
```

## Supported Analytics Modules

- **FACIAL_RECOGNITION** - Face recognition and matching
- **CROWD_COUNT** - People counting analytics
- **CROWD_FLOW** - Crowd movement and flow analysis
- **LOITERING** - Loitering detection
- **PERSON_RE_ID** - Person re-identification across cameras
- **UNATTENDED** - Unattended object detection
- **VH_LP_RECOGNITION** - Vehicle license plate recognition
- **VH_MODEL_RECOGNITION** - Vehicle model recognition
- **VH_CT_RECOGNITION** - Vehicle color/type recognition

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build

# Run built server
npm start
```

## Project Structure

```
mcp-server-opensearch/
├── src/
│   ├── index.ts          # Main MCP server implementation
│   ├── types.ts          # TypeScript type definitions
│   └── formatter.ts      # Response formatting utilities
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

The server provides detailed error messages:

### Connection Errors
```json
{
  "error": "OpenSearch connection failed",
  "message": "getaddrinfo ENOTFOUND localhost",
  "hint": "Check OPENSEARCH_URL, OPENSEARCH_USER_NAME, and OPENSEARCH_PASSWORD in .env file"
}
```

### Query Errors
```json
{
  "error": "OpenSearch query failed",
  "message": "Response Error",
  "details": { /* OpenSearch error details */ },
  "status": 400
}
```

## License

MIT
