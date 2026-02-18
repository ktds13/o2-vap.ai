# Quick Start: OpenSearch Analytics Skill

##  Implementation Complete

The OpenSearch analytics skill has been created and is ready to use with OpenCode AI.

## What Was Built

### Skill-Based Approach (Not MCP Server)

Instead of building an MCP server, we created an **OpenCode Skill** - a markdown file that teaches AI assistants how to query OpenSearch analytics events.

**Location:** `.opencode/skill/opensearch-analytics/SKILL.md`

**Advantages:**
-  No server process to run or manage
-  AI directly generates and executes queries
-  Simpler integration with OpenCode
-  Easier to update and maintain
-  Works with any OpenCode-compatible AI

## How It Works

1. **AI reads the skill** - OpenCode loads the SKILL.md file
2. **User asks a question** - "Show me facial recognition events from today"
3. **AI generates query** - Creates OpenSearch DSL query based on skill knowledge
4. **AI executes query** - Runs the query using OpenSearch TypeScript client
5. **AI returns results** - Formats and presents the data

## What's Included in the Skill

### Core Knowledge
- OpenSearch connection setup
- 9 analytics module types (crowd, facial, vehicle, etc.)
- Event structure and field mappings
- Query patterns and best practices

### Query Patterns (8 examples)
1. Search events with filters
2. Get event by ID
3. Aggregate by time (time-series)
4. Aggregate by module type
5. Latest event per source/camera
6. Vehicle license plate search
7. Crowd size filtering
8. Person tracking across cameras

### Helpers & Utilities
- Bool query builder
- Filter combination patterns
- Pagination examples
- Error handling practices

## Getting Started

### 1. Verify Skill Installation

Check that the skill file exists:
```powershell
Get-Content "d:\GW\o2-vap-ai\.opencode\skill\opensearch-analytics\SKILL.md" -TotalCount 5
```

You should see the skill header with name and description.

### 2. Restart OpenCode/VS Code

The skill will be automatically loaded when OpenCode starts.

### 3. Verify OpenSearch Connection

Ensure OpenSearch is accessible:
```powershell
curl -k -u admin:NETe2@sia https://localhost:9200/analytics-events/_count
```

### 4. Try Natural Language Queries

Ask the AI questions like:

**Basic Search:**
- "Show me all facial recognition events from today"
- "Find crowd counting events in the last hour"
- "Get vehicle detection events from camera CAM001"

**Analytics:**
- "What's the hourly trend for facial recognition this week?"
- "Show me event distribution by analytics module"
- "Which cameras generated the most events today?"

**Specific Queries:**
- "Find vehicles with license plate containing ABC"
- "Track person ID PERSON_123 across cameras in the last 4 hours"
- "Show me loitering events longer than 5 minutes"

**Aggregations:**
- "Get the top 10 busiest cameras by event count"
- "Show daily event counts for the last month"
- "Break down events by module and status"

## Example Interaction

**User:** "Show me facial recognition events from the last 24 hours"

**AI will:**
1. Recognize this needs the opensearch-analytics skill
2. Generate an OpenSearch query:
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
       },
       sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
       size: 20
     }
   })
   ```
3. Execute the query
4. Format and present the results

## Testing the Skill

### Quick Test Script

Create a test file to verify the connection:

```typescript
// test-opensearch.ts
import { Client } from '@opensearch-project/opensearch';
import 'dotenv/config';

const client = new Client({
  node: process.env.OPENSEARCH_URL,
  auth: {
    username: process.env.OPENSEARCH_USER_NAME,
    password: process.env.OPENSEARCH_PASSWORD,
  },
  ssl: { rejectUnauthorized: false },
});

// Test connection
const response = await client.search({
  index: 'analytics-events',
  body: {
    query: { match_all: {} },
    size: 5
  }
});

console.log('Total events:', response.body.hits.total.value);
console.log('Sample events:', response.body.hits.hits.map(h => h._source));
```

Run with:
```bash
bun run test-opensearch.ts
```

## Troubleshooting

### Skill Not Loading
- Restart OpenCode/VS Code
- Check file location: `.opencode/skill/opensearch-analytics/SKILL.md`
- Verify file format is valid markdown with frontmatter

### Connection Issues
- Verify OpenSearch is running: `curl -k https://localhost:9200`
- Check credentials in `.env`
- Ensure index exists: `analytics-events`

### No Data Returned
- Verify events exist: `curl -k -u admin:password https://localhost:9200/analytics-events/_count`
- Check date range filters (timezone aware)
- Review field mappings in skill documentation

### AI Not Using Skill
- Ensure query is analytics-related
- Try being more specific: "Query OpenSearch for..."
- Check OpenCode skill settings

## Updating the Skill

To add new query patterns or update existing ones:

1. Edit `.opencode/skill/opensearch-analytics/SKILL.md`
2. Add new query examples in the appropriate section
3. Save the file
4. Restart OpenCode to reload

The AI will immediately learn from the updated skill.

## Next Steps

### Explore Query Patterns
Review the skill file to see all available query patterns:
```powershell
code "d:\GW\o2-vap-ai\.opencode\skill\opensearch-analytics\SKILL.md"
```

### Try Complex Queries
- Multi-module searches
- Nested aggregations
- Cross-source analysis
- Time-series visualization data

### Add Custom Patterns
Extend the skill with your own query patterns specific to your use cases.

## Reference Files

- **Skill Definition:** `.opencode/skill/opensearch-analytics/SKILL.md`
- **Query Examples:** `src/opensearch-examples.md`
- **Environment Config:** `.env`
- **TypeScript Types:** `src/mcp-opensearch/types/events.ts`
- **Query Utilities:** `src/mcp-opensearch/utils/opensearch-client.ts`

## Integration Points

### With o2vap.management
- Queries same `analytics-events` index
- Field mappings match Go backend
- Event structure mirrors DTOs

### With OpenCode AI
- Auto-loaded on startup
- Available for all AI interactions
- Can combine with other skills

## Success Criteria

- [x] Skill file created with comprehensive query patterns
- [x] Field mappings documented  
- [x] 9 analytics modules covered
- [x] 8+ query pattern examples included
- [x] Helper functions and utilities documented
- [x] Best practices and performance tips provided
- [x] Integration with o2vap.management documented

##  Ready to Use!

The skill is ready! Just restart OpenCode and start asking analytics questions in natural language.

**Happy querying! **
