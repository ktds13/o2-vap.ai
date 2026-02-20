---
name: opensearch-analytics
description: Query and analyze video analytics events from OpenSearch. Use this when working with analytics events, searching for events by module type (crowd, facial recognition, vehicle detection), aggregating event statistics, or analyzing event trends.
---

## Use this when

- Searching for analytics events (facial recognition, crowd counting, vehicle detection, etc.)
- Analyzing event trends and patterns over time
- Aggregating events by source (camera), module type, or time period
- Querying specific module data (license plates, face matches, crowd counts)
- Getting latest events from cameras or tasks
- Investigating event history or performance metrics

## CRITICAL: Query Validation

**BEFORE executing any OpenSearch query, you MUST validate that the user's prompt matches the OpenSearch index structure.**

### Validation Rules

1. **Check if the query terms match available fields** in the `eventData` or `metadata` structure (see Index Structure section below)
2. **If the user asks about fields that DON'T exist** in the schema:
   - **DO NOT execute the query**
   - Inform the user that the requested field doesn't exist in the analytics events index
   - Suggest similar or related fields that might help
3. **If the query matches the structure**: Proceed with executing the query

### Validation Examples

**Example 1: Invalid Query (Field doesn't exist)**
```
User: "Get events where camera location is 'Building A'"
Response: "The analytics-events index doesn't have a 'camera location' field. However, you can query by:
- eventSourceId (camera ID)
- eventSourceName (camera name)
- location (geo-point coordinates)
Would you like to search using one of these fields instead?"
```

**Example 2: Valid Query (Field exists)**
```
User: "Get last 3 events for source type is live_stream"
Response: [Execute query using eventData.eventSourceType.keyword = "live_stream"]
```

**Example 3: Invalid Module Type**
```
User: "Show me events for INTRUSION_DETECTION module"
Response: "The module 'INTRUSION_DETECTION' is not available in the analytics system. Available modules are:
- CROWD_COUNT, CROWD_FLOW, LOITERING
- FACIAL_RECOGNITION, PERSON_RE_ID
- VH_LP_RECOGNITION, VH_MODEL_RECOGNITION, VH_CT_RECOGNITION
- UNATTENDED
Would you like to query one of these modules instead?"
```

**Example 4: Ambiguous Terms**
```
User: "Get events with high confidence"
Response: "The term 'confidence' can refer to different fields depending on the module:
- For crowd events: eventData.eventData.confidenceScore
- For general events: eventData.confidence
- For face/vehicle detection: confidence scores in eventData.eventData
Could you specify which module or event type you're interested in, and what threshold you consider 'high'?"
```

### Validation Process

Before executing a query:
1. Parse the user's request to identify requested fields/filters
2. Check if those fields exist in the Index Structure (sections below)
3. Validate any module IDs against the available Analytics Modules list
4. Validate any field values (e.g., status must be 'verified' or 'unverified')
5. If validation fails: Explain why and suggest alternatives
6. If validation passes: Construct and execute the OpenSearch query

## How to Query

Use the `execute_opensearch_query` MCP tool to query analytics events from OpenSearch. This tool accepts OpenSearch Query DSL and returns formatted results.

**IMPORTANT**: Always use the MCP tool instead of creating TypeScript files for queries.

### Using the MCP Tool

The tool is available as: `execute_opensearch_query`

**Parameters:**
- `query` (object): OpenSearch Query DSL body (default: `{}` for match_all)
- `index` (string): Index name (default: `analytics-events` from .env)
- `format` (string): Response format - `analytics` (default), `dto`, or `raw`

**Example Usage:**

```typescript
// Simple query for all events from sourceId 75
{
  "query": {
    "term": { "eventData.eventSourceId.keyword": "75" }
  },
  "sort": [{ "eventData.eventDateTime": { "order": "desc" } }],
  "size": 100
}

// Query with aggregations
{
  "query": {
    "bool": {
      "must": [
        { "term": { "eventData.moduleId.keyword": "CROWD_COUNT" } }
      ]
    }
  },
  "size": 10,
  "aggs": {
    "by_source": {
      "terms": {
        "field": "eventData.eventSourceId.keyword",
        "size": 50
      }
    }
  }
}
```

## Tool Connection

The MCP server is configured in `.mcp.json` and automatically connects to OpenSearch using environment variables from `.env`:

```env
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_USER_NAME=admin
OPENSEARCH_PASSWORD=your_password_here
INDEX_NAME=analytics-events
```

## Analytics Modules (from o2vap.management)

| Module ID | Description |
|-----------|-------------|
| `CROWD_COUNT` | People counting analytics |
| `CROWD_FLOW` | Crowd movement and flow analysis |
| `LOITERING` | Loitering detection |
| `PERSON_RE_ID` | Person re-identification across cameras |
| `UNATTENDED` | Unattended object detection |
| `VH_LP_RECOGNITION` | Vehicle license plate recognition |
| `VH_MODEL_RECOGNITION` | Vehicle model recognition |
| `VH_CT_RECOGNITION` | Vehicle color/type recognition |
| `FACIAL_RECOGNITION` | Face recognition and matching |

## Index Structure

The `analytics-events` index has the following structure in OpenSearch:

### Top-Level Properties

```json
{
  "eventData": { /* Main event data - see below */ },
  "metadata": { /* Event metadata - see below */ }
}
```

### eventData Structure

```typescript
interface EventData {
  // Core Event Fields
  analyticsEventID: string;          // Keyword type
  analyticsTaskID: string;           // Keyword type
  eventId: string;                   // Text with keyword subfield
  taskId: string;                    // Text with keyword subfield
  serviceId: string;                 // Text with keyword subfield
  moduleId: string;                  // Text with keyword subfield
  
  // Source Information
  eventSourceId: string;             // Text with keyword subfield
  eventSourceName: string;           // Text with keyword subfield
  eventSourceType: string;           // Text with keyword subfield
  
  // Temporal Data
  eventDateTime: Date;               // Date type
  videoTime: number;                 // Long type
  
  // Status & Verification
  status: 'verified' | 'unverified'; // Keyword type
  verifiedBy?: string;               // Keyword type
  verifiedDateTime?: Date;           // Date type
  verifiedDescription?: string;      // Text type
  
  // Categorization
  tags?: string[];                   // Keyword array
  groupTag?: string;                 // Text with keyword subfield
  
  // Bounding Box
  bbox?: object;                     // Generic object type
  confidence?: number;               // Float type
  
  // Location
  location?: {                       // Geo-point type
    lat: number;
    lon: number;
  };
  
  // Media
  media?: {
    url?: string;                    // Text with keyword subfield
    type?: string;                   // Text with keyword subfield
    mimeType?: string;               // Text with keyword subfield
    imageUrl?: string;               // Text type
    videoUrl?: string;               // Text type
    thumbnailUrl?: string;           // Text type
  };
  
  // Module-Specific Event Data (dynamic)
  eventData?: {
    // Facial Recognition
    faceId?: string;                 // Text with keyword subfield
    faceBox?: {
      type?: string;                 // Text with keyword subfield
      points?: number[];             // Float array
    };
    queryId?: string;                // Text with keyword subfield
    
    // Crowd Analytics
    count?: number;                  // Long type
    ingress?: number;                // Long type
    egress?: number;                 // Long type
    confidenceScore?: number;        // Float type
    boundaryAreaIds?: string[];      // Text with keyword subfield
    isWithinArea?: boolean;          // Boolean type
    
    // Person Re-ID
    personId?: string;               // Text with keyword subfield
    personBox?: {
      type?: string;                 // Text with keyword subfield
      points?: number[];             // Float array
    };
    
    // Loitering
    loiteringDuration?: number;      // Long type
    
    // Vehicle Analytics
    vehicleId?: string;              // Text with keyword subfield
    vehicleBox?: {
      type?: string;                 // Text with keyword subfield
      points?: number[];             // Float array
    };
    vehicleType?: string;            // Text with keyword subfield
    vehicleColour?: string;          // Text with keyword subfield
    vehicleMake?: string;            // Text with keyword subfield
    vehicleModel?: string;           // Text with keyword subfield
    
    // License Plate Recognition
    licensePlateId?: string;         // Text with keyword subfield
    licensePlateNumber?: string;     // Text with keyword subfield
    licensePlateBox?: {
      type?: string;                 // Text with keyword subfield
      points?: number[];             // Float array
    };
  };
}
```

### metadata Structure

```typescript
interface Metadata {
  resultId: string;                  // Text with keyword subfield
  alertId: string;                   // Text with keyword subfield
  timestamp: Date;                   // Date type
  version: string;                   // Keyword type
}
```

### Field Type Notes

1. **Text vs Keyword**:
   - `text` fields: Full-text searchable, analyzed
   - `text` fields with `.keyword` subfield: Can do both full-text and exact match
   - `keyword` fields: Exact match only, used for filtering, sorting, aggregations

2. **Dynamic Fields**:
   - `eventData.eventData` is marked as `dynamic: true`, allowing arbitrary fields
   - This enables module-specific data without predefined schema

3. **Array Fields**:
   - `tags`: Array of keyword strings
   - Box `points`: Array of float numbers for polygon coordinates
   - `boundaryAreaIds`: Array of text strings with keyword subfield

4. **Geo-point**:
   - `location` field supports geo-spatial queries
   - Format: `{ "lat": 23.8103, "lon": 90.4125 }`

## Event Structure (Flattened)

When working with events in the application layer, the structure is flattened:

```typescript
interface AnalyticsEvent {
  eventId: string;
  taskId: string;
  serviceId: string;
  moduleId: string; // One of the module types above
  eventSourceId: string;      // Camera/source ID
  eventSourceType: string;
  eventDateTime: string | number;
  videoTime: number;
  status: 'verified' | 'unverified';
  media: {
    url: string;
    type: string;
    mimeType: string;
  };
  eventData: any; // Module-specific data
  verifiedBy?: string;
  verifiedDateTime?: string;
  verifiedDescription?: string;
  groupTag?: string;
  eventSourceName?: string;
}
```

## Response Format (o2vap.management DTOs)

The MCP tool returns results in one of three formats:

### Format Options

**1. Analytics Format (Default)** - `format: "analytics"`
```typescript
interface AnalyticsEventResponse {
  Count: number;
  AnalyticsEvents: AnalyticsEvent[];
  Aggregation: AnalyticsEvent[];
}
```

**2. DTO Format** - `format: "dto"`
```typescript
interface OpensearchResponseDTO {
  totalValue: number;
  AggsResult: Bucket[];
  HitList: SingleHit[];
}
```

**3. Raw Format** - `format: "raw"`
Returns the complete OpenSearch response unchanged.

### Format Selection Guide

- **Use 'analytics' format** (default) when:
  - You only need the event data for display
  - You want a cleaner, flattened response
  - You're building UI components
  - You want just the Count and event arrays

- **Use 'dto' format** when:
  - You need bucket information with doc counts
  - You need the full hit metadata (_id, _index, _score)
  - You're working with complex aggregation results
  - You need to match the Go backend's OpensearchResponseDTO exactly

- **Use 'raw' format** when:
  - You need the complete OpenSearch response unchanged
  - You're debugging queries or need all metadata

## Field Mappings (CRITICAL)

OpenSearch stores events with nested paths. Use these mappings for queries:

```typescript
const FIELD_MAPPINGS = {
  taskId: 'eventData.taskId.keyword',
  eventId: 'eventData.eventId.keyword',
  eventDateTime: 'eventData.eventDateTime',
  eventSourceId: 'eventData.eventSourceId.keyword',
  serviceId: 'eventData.serviceId.keyword',
  moduleId: 'eventData.moduleId.keyword',
  status: 'eventData.status.keyword',
  groupTag: 'eventData.groupTag.keyword',
  analyticsEventId: 'eventData.analyticsEventId.keyword',
};
```

## Common Query Patterns

### 1. Search Events with Filters

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "eventData.moduleId.keyword": "FACIAL_RECOGNITION" } },
        { 
          "range": { 
            "eventData.eventDateTime": { 
              "gte": "2026-02-18T00:00:00Z",
              "lte": "2026-02-18T23:59:59Z"
            } 
          } 
        }
      ]
    }
  },
  "sort": [{ "eventData.eventDateTime": { "order": "desc" } }],
  "from": 0,
  "size": 10
}
```

### 2. Get Events by Source ID

```json
{
  "query": {
    "term": { "eventData.eventSourceId.keyword": "75" }
  },
  "sort": [{ "eventData.eventDateTime": { "order": "desc" } }],
  "size": 100
}
```

### 3. Get Event by ID

```json
{
  "query": {
    "term": { "eventData.eventId.keyword": "evt-123" }
  },
  "size": 1
}
```

### 4. Aggregate Events by Time (Time-series)

```json
{
  "query": { "match_all": {} },
  "size": 0,
  "aggs": {
    "events_over_time": {
      "date_histogram": {
        "field": "eventData.eventDateTime",
        "calendar_interval": "1h",
        "format": "yyyy-MM-dd HH:mm:ss"
      }
    }
  }
}
```

### 5. Aggregate by Module Type

```json
{
  "query": { "match_all": {} },
  "size": 0,
  "aggs": {
    "by_module": {
      "terms": {
        "field": "eventData.moduleId.keyword",
        "size": 20
      },
      "aggs": {
        "by_status": {
          "terms": {
            "field": "eventData.status.keyword",
            "size": 10
          }
        }
      }
    }
  }
}
```

### 6. Get Latest Event per Source (Camera)

```json
{
  "query": { "match_all": {} },
  "size": 0,
  "aggs": {
    "by_source": {
      "terms": {
        "field": "eventData.eventSourceId.keyword",
        "size": 50
      },
      "aggs": {
        "latest_event": {
          "top_hits": {
            "size": 1,
            "sort": [{ "eventData.eventDateTime": { "order": "desc" } }]
          }
        }
      }
    }
  }
}
```

### 7. Query Vehicle Events with License Plate Search

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "terms": {
            "eventData.moduleId.keyword": [
              "VH_LP_RECOGNITION",
              "VH_MODEL_RECOGNITION",
              "VH_CT_RECOGNITION"
            ]
          }
        }
      ],
      "should": [
        {
          "wildcard": {
            "eventData.licensePlate.keyword": {
              "value": "*ABC*",
              "case_insensitive": true
            }
          }
        }
      ]
    }
  },
  "sort": [{ "eventData.eventDateTime": { "order": "desc" } }],
  "size": 20
}
```

### 8. Query Crowd Events with Size Filter

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "eventData.moduleId.keyword": "CROWD_COUNT" } },
        { "range": { "eventData.count": { "gte": 10, "lte": 100 } } }
      ]
    }
  },
  "sort": [{ "eventData.eventDateTime": { "order": "desc" } }],
  "size": 20
}
```

### 9. Track Person Across Cameras (Facial Recognition)

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "eventData.moduleId.keyword": "FACIAL_RECOGNITION" } },
        { "term": { "eventData.personId.keyword": "PERSON_123" } },
        {
          "range": {
            "eventData.eventDateTime": {
              "gte": "2026-02-18T08:00:00Z",
              "lte": "2026-02-18T12:00:00Z"
            }
          }
        }
      ]
    }
  },
  "sort": [{ "eventData.eventDateTime": { "order": "asc" } }],
  "size": 100
}
```

## Query Building Helpers

### Building Dynamic Queries

When you need to build queries dynamically based on conditions, construct the query object step by step:

```typescript
// Example: Building a dynamic query for the MCP tool
const must = [];

// Add module filter if specified
if (moduleId) {
  const modules = Array.isArray(moduleId) ? moduleId : [moduleId];
  if (modules.length === 1) {
    must.push({ term: { 'eventData.moduleId.keyword': modules[0] } });
  } else {
    must.push({ terms: { 'eventData.moduleId.keyword': modules } });
  }
}

// Add source filter if specified
if (sourceIds) {
  const sources = Array.isArray(sourceIds) ? sourceIds : [sourceIds];
  if (sources.length === 1) {
    must.push({ term: { 'eventData.eventSourceId.keyword': sources[0] } });
  } else {
    must.push({ terms: { 'eventData.eventSourceId.keyword': sources } });
  }
}

// Add date range if specified
if (dateRange) {
  must.push({
    range: {
      'eventData.eventDateTime': {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }
  });
}

// Add status filter if specified
if (status) {
  must.push({ term: { 'eventData.status.keyword': status } });
}

// Build final query
const query = must.length > 0 ? { bool: { must } } : { match_all: {} };

// Use with MCP tool
const queryBody = {
  query,
  sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
  from: 0,
  size: 10
};
```

## Performance Tips

- Set reasonable `size` limits (default 10, max 100)
- Use aggregations instead of retrieving all documents (set `size: 0` when only aggregations are needed)
- Add time range filters to reduce search scope
- Use `_source` filtering to return only needed fields: `"_source": ["eventData.eventId", "eventData.moduleId"]`
- Use `top_hits` aggregation for latest-per-group queries
- For term queries, always use `.keyword` suffix for exact matches

## Environment Variables

Configuration is stored in `.env` file in the project root:

```env
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_USER_NAME=admin
OPENSEARCH_PASSWORD=your_password_here
INDEX_NAME=analytics-events
```

## Integration with o2vap.management

This skill uses the MCP OpenSearch server (`mcp-server-opensearch`) which queries the same OpenSearch index that the Go backend writes to:
- Backend service: `cmd/backend-apiserver/services/analytics_event_service.go`
- Event DTOs: `cmd/backend-apiserver/dtos/opensearch_response_dto.go`
- Repository: `cmd/backend-apiserver/repositories/analytics_event_repo.go`
- MCP Server: `mcp-server-opensearch/src/index.ts`

## Complete Example

### Example 1: Get Events for Source ID

Call the MCP tool with:
```json
{
  "query": {
    "term": { "eventData.eventSourceId.keyword": "75" }
  },
  "sort": [{ "eventData.eventDateTime": { "order": "desc" } }],
  "size": 100
}
```

### Example 2: Get Crowd Events with Aggregations

Call the MCP tool with:
```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "eventData.moduleId.keyword": "CROWD_COUNT" } },
        {
          "range": {
            "eventData.eventDateTime": {
              "gte": "2026-02-18T00:00:00Z",
              "lte": "2026-02-18T23:59:59Z"
            }
          }
        }
      ]
    }
  },
  "sort": [{ "eventData.eventDateTime": { "order": "desc" } }],
  "size": 10,
  "aggs": {
    "by_source": {
      "terms": {
        "field": "eventData.eventSourceId.keyword",
        "size": 10
      },
      "aggs": {
        "latest_events": {
          "top_hits": {
            "size": 1,
            "sort": [{ "eventData.eventDateTime": { "order": "desc" } }]
          }
        }
      }
    }
  }
}
```

Specify format if needed:
```json
{
  "query": { "match_all": {} },
  "size": 10,
  "format": "dto"
}
```

## Quick Reference

**Search recent events**: Use `bool` query with `moduleId` + `dateRange`
**Get by source ID**: `term` query on `eventSourceId.keyword`
**Get by event ID**: `term` query on `eventId.keyword`
**Time trends**: `date_histogram` aggregation
**Top sources**: `terms` aggregation on `eventSourceId` + `top_hits`
**Module stats**: `terms` aggregation on `moduleId`
**Vehicle search**: `wildcard` on `licensePlate.keyword`
**Person tracking**: `personId` + time range for facial events
**Loitering**: `LOITERING` module + duration filter

## Example Output - Analytics Format

```json
{
  "Count": 2,
  "AnalyticsEvents": [
    {
      "eventId": "b2c3d4e5-f6a7-4890-b123-c4d5e6f7a890",
      "taskId": "e7abf7d3-73bf-4d62-9aa4-ebe369021ee9",
      "serviceId": "aa3b5845-cb95-4adb-a2f5-a91e9f9e8321",
      "moduleId": "CROWD_COUNT",
      "eventSourceId": "75",
      "eventSourceName": "Office LiveCam01",
      "eventSourceType": "live_stream",
      "eventDateTime": "2026-02-13T14:35:20.456+06:30",
      "videoTime": 0,
      "status": "UNVERIFIED",
      "media": {
        "url": "VAE_results/CROWD_COUNT/.../image.jpeg",
        "type": "image",
        "mimeType": "image/jpeg"
      },
      "eventData": [
        {
          "boundaryAreaIds": [],
          "confidenceScore": 0.85,
          "count": 38,
          "isWithinArea": true
        }
      ],
      "groupTag": "e7abf7d3-73bf-4d62-9aa4-ebe369021ee9_75_g1"
    }
  ],
  "Aggregation": []
}
```

## Example Output - DTO Format

```json
{
  "totalValue": 2,
  "AggsResult": [
    {
      "key": "75",
      "doc_count": 2,
      "latest_events": {
        "hits": {
          "hits": [
            {
              "_id": "abc123",
              "_index": "analytics-events",
              "_score": 1.0,
              "_source": {
                "metadata": {
                  "resultId": "result-123",
                  "alertId": "alert-456"
                },
                "eventData": { /* ... */ }
              }
            }
          ]
        }
      }
    }
  ],
  "HitList": [
    /* array of SingleHit objects with full metadata */
  ]
}
```
