# o2-vap-ai

AI-powered skills and tools for the O2 Video Analytics Platform.

## Overview

This workspace provides OpenCode AI skills for querying and analyzing video analytics events from OpenSearch. The skills enable AI assistants to understand and execute complex analytics queries using natural language.

## Skills

### OpenSearch Analytics

**Location:** `.opencode/skill/opensearch-analytics/SKILL.md`

This skill teaches AI assistants how to query video analytics events from OpenSearch, including:

- **Search & Query**: Find events by module type, source, time range, status
- **Aggregations**: Time-series analysis, module distribution, source statistics  
- **Module-Specific**: Crowd counting, facial recognition, vehicle detection queries
- **Advanced Patterns**: Person tracking, license plate search, event trends

**Supported Analytics Modules:**
- Crowd counting & flow analysis
- Facial recognition
- Vehicle detection (license plate, model, color/type)
- Loitering detection
- Unattended object detection
- Person re-identification

## Getting Started

### Prerequisites

- Bun runtime installed
- OpenSearch 2.16+ running (from o2vap.management setup)
- Access to analytics-events index

### Setup

1. **Install dependencies:**
   ```bash
   cd d:\GW\o2-vap-ai
   bun install
   ```

2. **Configure environment:**
   ```bash
   # .env file already configured with:
   OPENSEARCH_URL=https://localhost:9200
   OPENSEARCH_USER_NAME=admin
   OPENSEARCH_PASSWORD=NETe2@sia
   INDEX_NAME=analytics-events
   ```

3. **Restart OpenCode/VS Code** to load the new skill

### Usage

The AI assistant will automatically use the opensearch-analytics skill when you ask questions like:

- "Show me facial recognition events from today"
- "What's the hourly trend for crowd counting this week?"
- "Which cameras generated the most events?"
- "Find vehicles with license plate containing ABC123"
- "Track person ID PERSON_123 across cameras in the last 4 hours"

The assistant will generate and execute OpenSearch queries based on the skill knowledge.

## Project Structure

```
o2-vap-ai/
 .opencode/
    skill/
        bun-file-io/          # File operations skill
        opensearch-analytics/  # OpenSearch query skill  NEW
            SKILL.md
 src/
    mcp-opensearch/           # Implementation helpers (TypeScript utilities)
    opensearch-examples.md    # Query examples
 .env                          # OpenSearch configuration
 package.json
 README.md
```

## Implementation Approach

This project uses **OpenCode Skills** (markdown-based knowledge) rather than MCP servers. Benefits:

-  No server process to manage
-  Simpler integration with OpenCode
-  AI directly generates and executes queries
-  Easier to update and maintain
-  Better for knowledge transfer to AI agents

The TypeScript code in `src/mcp-opensearch/` serves as reference implementations that the AI can adapt.

## Example Queries

See [src/opensearch-examples.md](src/opensearch-examples.md) for detailed query examples.

**Search recent events:**
```typescript
await client.search({
  index: 'analytics-events',
  body: {
    query: {
      bool: {
        must: [
          { term: { 'eventData.moduleId.keyword': 'FACIAL_RECOGNITION' } },
          { range: { 'eventData.eventDateTime': { gte: 'now-24h' } } }
        ]
      }
    }
  }
})
```

**Aggregate by time:**
```typescript
await client.search({
  index: 'analytics-events',
  body: {
    size: 0,
    aggs: {
      events_over_time: {
        date_histogram: {
          field: 'eventData.eventDateTime',
          calendar_interval: '1h'
        }
      }
    }
  }
})
```

## Integration with o2vap.management

The opensearch-analytics skill queries the same OpenSearch index that o2vap.management backend writes to:

- **Backend service:** `cmd/backend-apiserver/services/analytics_event_service.go`
- **Event DTOs:** `cmd/backend-apiserver/dtos/opensearch_response_dto.go`  
- **Repository:** `cmd/backend-apiserver/repositories/analytics_event_repo.go`
- **Index name:** `analytics-events`

## Development

### Running OpenSearch Locally

```bash
cd d:\GW\o2vap.management\setup
docker-compose -f docker-compose.opensearch.yml up -d
```

### Testing Queries

Use the TypeScript utilities in `src/mcp-opensearch/tools/` as reference for building queries.

### Adding New Query Patterns

Update `.opencode/skill/opensearch-analytics/SKILL.md` with new patterns. The AI will learn from the updated skill on next reload.

## Requirements

- Bun 1.3+
- OpenSearch 2.16+
- TypeScript 5+
- @opensearch-project/opensearch 3.5+

## License

ISC
