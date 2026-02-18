# OpenSearch Analytics Query Helpers
# Utilities for querying analytics events - use with opensearch-analytics skill

Import the OpenSearch client:
```typescript
import { Client } from '@opensearch-project/opensearch'
import dotenv from 'dotenv'

dotenv.config()

export const client = new Client({
  node: process.env.OPENSEARCH_URL || 'https://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USER_NAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || '',
  },
  ssl: {
    rejectUnauthorized: false,
  },
})

export const INDEX_NAME = process.env.INDEX_NAME || 'analytics-events'
```

## Example Usage Scripts

### 1. Search Recent Facial Recognition Events
```typescript
import { client, INDEX_NAME } from './opensearch-client'

async function searchFacialEvents() {
  const response = await client.search({
    index: INDEX_NAME,
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
  
  return response.body.hits.hits.map(hit => hit._source)
}
```

### 2. Get Event Statistics by Module
```typescript
async function getModuleStats() {
  const response = await client.search({
    index: INDEX_NAME,
    body: {
      size: 0,
      aggs: {
        by_module: {
          terms: { field: 'eventData.moduleId.keyword', size: 20 }
        }
      }
    }
  })
  
  return response.body.aggregations.by_module.buckets
}
```

### 3. Track Person Across Cameras
```typescript
async function trackPerson(personId: string, startTime: string, endTime: string) {
  const response = await client.search({
    index: INDEX_NAME,
    body: {
      query: {
        bool: {
          must: [
            { term: { 'eventData.moduleId.keyword': 'FACIAL_RECOGNITION' } },
            { term: { 'eventData.personId.keyword': personId } },
            { range: { 'eventData.eventDateTime': { gte: startTime, lte: endTime } } }
          ]
        }
      },
      sort: [{ 'eventData.eventDateTime': { order: 'asc' } }],
      size: 100
    }
  })
  
  return response.body.hits.hits.map(hit => ({
    time: hit._source.eventDateTime,
    camera: hit._source.eventSourceId,
    location: hit._source.eventSourceName
  }))
}
```

### 4. Get Hourly Event Trends
```typescript
async function getHourlyTrends(days: number = 7) {
  const response = await client.search({
    index: INDEX_NAME,
    body: {
      query: {
        range: { 'eventData.eventDateTime': { gte: `now-${days}d` } }
      },
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
  
  return response.body.aggregations.events_over_time.buckets
}
```

### 5. Search Vehicle by License Plate
```typescript
async function searchVehicle(platePattern: string) {
  const response = await client.search({
    index: INDEX_NAME,
    body: {
      query: {
        bool: {
          must: [
            { term: { 'eventData.moduleId.keyword': 'VH_LP_RECOGNITION' } }
          ],
          should: [
            { wildcard: { 'eventData.licensePlate.keyword': { value: `*${platePattern}*` } } }
          ]
        }
      },
      size: 50
    }
  })
  
  return response.body.hits.hits.map(hit => hit._source)
}
```

## Run Examples

Save examples as TypeScript files and run with Bun:
```bash
bun run examples/search-events.ts
```
