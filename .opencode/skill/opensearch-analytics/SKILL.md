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

## OpenSearch Connection

**IMPORTANT**: Always use environment variables from `.env` file for configuration.

```typescript
import { Client } from '@opensearch-project/opensearch';

// Environment variables are automatically loaded from .env file
const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USER_NAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD,
  },
  ssl: {
    rejectUnauthorized: false, // For dev with self-signed certs
  },
});

const INDEX_NAME = process.env.INDEX_NAME || 'analytics-events';
```

**Note**: The `.env` file in the project root contains all OpenSearch configuration. Never hardcode credentials in scripts.

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

## Event Structure

```typescript
interface AnalyticsEvent {
  analyticsEventId: string;
  analyticsTaskId: string;
  analyticsServiceId: string;
  analyticsModuleId: string; // One of the module types above
  eventSourceId: string;      // Camera/source ID
  eventSourceType: string;
  eventDateTime: string | number;
  videoTime: number;
  status: 'verified' | 'unverified';
  media: {
    url: string;
    type: string;
    thumbnail?: string;
  };
  eventData: Record<string, any>; // Module-specific data
  verifiedBy?: string;
  verifiedDateTime?: string;
  verifiedDescription?: string;
  groupTag?: string;
  eventSourceName?: string;
}
```

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

```typescript
const response = await client.search({
  index: INDEX_NAME,
  body: {
    query: {
      bool: {
        must: [
          { term: { 'eventData.moduleId.keyword': 'FACIAL_RECOGNITION' } },
          { 
            range: { 
              'eventData.eventDateTime': { 
                gte: '2026-02-18T00:00:00Z',
                lte: '2026-02-18T23:59:59Z'
              } 
            } 
          }
        ]
      }
    },
    sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
    from: 0,
    size: 10
  }
});

const events = response.body.hits.hits.map(hit => hit._source);
```

### 2. Get Event by ID

```typescript
const response = await client.search({
  index: INDEX_NAME,
  body: {
    query: {
      term: { 'eventData.analyticsEventId.keyword': eventId }
    },
    size: 1
  }
});

const event = response.body.hits.hits[0]?._source;
```

### 3. Aggregate Events by Time (Time-series)

```typescript
const response = await client.search({
  index: INDEX_NAME,
  body: {
    query: { match_all: {} },
    size: 0,
    aggs: {
      events_over_time: {
        date_histogram: {
          field: 'eventData.eventDateTime',
          calendar_interval: '1h', // or '1d', '1w', '1M'
          format: 'yyyy-MM-dd HH:mm:ss'
        }
      }
    }
  }
});

const buckets = response.body.aggregations.events_over_time.buckets;
```

### 4. Aggregate by Module Type

```typescript
const response = await client.search({
  index: INDEX_NAME,
  body: {
    query: { match_all: {} },
    size: 0,
    aggs: {
      by_module: {
        terms: {
          field: 'eventData.moduleId.keyword',
          size: 20
        },
        aggs: {
          by_status: {
            terms: {
              field: 'eventData.status.keyword',
              size: 10
            }
          }
        }
      }
    }
  }
});

const modules = response.body.aggregations.by_module.buckets;
```

### 5. Get Latest Event per Source (Camera)

```typescript
const response = await client.search({
  index: INDEX_NAME,
  body: {
    query: { match_all: {} },
    size: 0,
    aggs: {
      by_source: {
        terms: {
          field: 'eventData.eventSourceId.keyword',
          size: 50
        },
        aggs: {
          latest_event: {
            top_hits: {
              size: 1,
              sort: [{ 'eventData.eventDateTime': { order: 'desc' } }]
            }
          }
        }
      }
    }
  }
});

const sources = response.body.aggregations.by_source.buckets;
```

### 6. Query Vehicle Events with License Plate Search

```typescript
const response = await client.search({
  index: INDEX_NAME,
  body: {
    query: {
      bool: {
        must: [
          {
            terms: {
              'eventData.moduleId.keyword': [
                'VH_LP_RECOGNITION',
                'VH_MODEL_RECOGNITION',
                'VH_CT_RECOGNITION'
              ]
            }
          }
        ],
        should: [
          {
            wildcard: {
              'eventData.licensePlate.keyword': {
                value: '*ABC*',
                case_insensitive: true
              }
            }
          }
        ]
      }
    },
    sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
    size: 20
  }
});
```

### 7. Query Crowd Events with Size Filter

```typescript
const response = await client.search({
  index: INDEX_NAME,
  body: {
    query: {
      bool: {
        must: [
          { term: { 'eventData.moduleId.keyword': 'CROWD_COUNT' } },
          { range: { 'eventData.count': { gte: 10, lte: 100 } } }
        ]
      }
    },
    sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
    size: 20
  }
});
```

### 8. Track Person Across Cameras (Facial Recognition)

```typescript
const response = await client.search({
  index: INDEX_NAME,
  body: {
    query: {
      bool: {
        must: [
          { term: { 'eventData.moduleId.keyword': 'FACIAL_RECOGNITION' } },
          { term: { 'eventData.personId.keyword': 'PERSON_123' } },
          {
            range: {
              'eventData.eventDateTime': {
                gte: '2026-02-18T08:00:00Z',
                lte: '2026-02-18T12:00:00Z'
              }
            }
          }
        ]
      }
    },
    sort: [{ 'eventData.eventDateTime': { order: 'asc' } }],
    size: 100
  }
});
```

## Query Building Helpers

### Build bool query

```typescript
function buildBoolQuery(must = [], should = [], filter = [], mustNot = []) {
  const bool: any = {};
  if (must.length > 0) bool.must = must;
  if (should.length > 0) bool.should = should;
  if (filter.length > 0) bool.filter = filter;
  if (mustNot.length > 0) bool.must_not = mustNot;
  return { bool };
}
```

### Multiple filters

```typescript
const filters = [];

// Module filter
if (moduleId) {
  filters.push({ term: { 'eventData.moduleId.keyword': moduleId } });
}

// Source filter (single or multiple)
if (sourceIds) {
  const sources = Array.isArray(sourceIds) ? sourceIds : [sourceIds];
  if (sources.length === 1) {
    filters.push({ term: { 'eventData.eventSourceId.keyword': sources[0] } });
  } else {
    filters.push({ terms: { 'eventData.eventSourceId.keyword': sources } });
  }
}

// Date range
if (dateRange) {
  filters.push({
    range: {
      'eventData.eventDateTime': {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }
  });
}

// Status filter
if (status) {
  filters.push({ term: { 'eventData.status.keyword': status } });
}

const query = buildBoolQuery(filters);
```

## Best Practices

1. **Always use keyword fields** for exact matches: `.keyword` suffix
2. **Date ranges**: Use ISO 8601 format or Unix timestamps
3. **Sort by event date**: Default to descending for recent events
4. **Pagination**: Use `from` and `size` parameters
5. **Aggregations**: Set `size: 0` when you only need aggregation results
6. **Module filters**: Use `term` for single, `terms` for multiple
7. **Wildcard searches**: Use for license plates, pattern matching
8. **Error handling**: Always wrap in try-catch

## Performance Tips

- Use `_source` filtering to return only needed fields
- Set reasonable `size` limits (default 10, max 100)
- Use aggregations instead of retrieving all documents
- Add time range filters to reduce search scope
- Use `top_hits` aggregation for latest-per-group queries

## Environment Variables

**Configuration is stored in `.env` file in the project root.**

Required variables:
```env
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_USER_NAME=admin
OPENSEARCH_PASSWORD=your_password_here
INDEX_NAME=analytics-events
```

The `.env` file is already configured in this project. Environment variables are automatically loaded when running scripts with `bun run`.

## Integration with o2vap.management

This skill queries the same OpenSearch index that the Go backend writes to:
- Backend service: `cmd/backend-apiserver/services/analytics_event_service.go`
- Event DTOs: `cmd/backend-apiserver/dtos/opensearch_response_dto.go`
- Repository: `cmd/backend-apiserver/repositories/analytics_event_repo.go`

## Example: Complete Query Function

```typescript
async function searchAnalyticsEvents(options: {
  moduleId?: string | string[];
  eventSourceId?: string | string[];
  taskId?: string;
  status?: 'verified' | 'unverified';
  dateRange?: { start: string; end: string };
  from?: number;
  size?: number;
}) {
  const must = [];
  
  if (options.moduleId) {
    const modules = Array.isArray(options.moduleId) ? options.moduleId : [options.moduleId];
    if (modules.length === 1) {
      must.push({ term: { 'eventData.moduleId.keyword': modules[0] } });
    } else {
      must.push({ terms: { 'eventData.moduleId.keyword': modules } });
    }
  }
  
  if (options.eventSourceId) {
    const sources = Array.isArray(options.eventSourceId) ? options.eventSourceId : [options.eventSourceId];
    if (sources.length === 1) {
      must.push({ term: { 'eventData.eventSourceId.keyword': sources[0] } });
    } else {
      must.push({ terms: { 'eventData.eventSourceId.keyword': sources } });
    }
  }
  
  if (options.taskId) {
    must.push({ term: { 'eventData.taskId.keyword': options.taskId } });
  }
  
  if (options.status) {
    must.push({ term: { 'eventData.status.keyword': options.status } });
  }
  
  if (options.dateRange) {
    must.push({
      range: {
        'eventData.eventDateTime': {
          gte: options.dateRange.start,
          lte: options.dateRange.end
        }
      }
    });
  }
  
  const query = must.length > 0 ? { bool: { must } } : { match_all: {} };
  
  const response = await client.search({
    index: INDEX_NAME,
    body: {
      query,
      sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
      from: options.from || 0,
      size: options.size || 10
    }
  });
  
  return {
    total: response.body.hits.total.value,
    events: response.body.hits.hits.map(hit => hit._source)
  };
}
```

## Quick Reference

**Search recent events**: `moduleId` + `dateRange` in bool query
**Get by ID**: `term` query on `analyticsEventId`
**Time trends**: `date_histogram` aggregation
**Top sources**: `terms` aggregation on `eventSourceId` + `top_hits`
**Module stats**: `terms` aggregation on `moduleId`
**Vehicle search**: `wildcard` on `licensePlate.keyword`
**Person tracking**: `personId` + time range for facial events
**Loitering**: `LOITERING` module + duration filter
