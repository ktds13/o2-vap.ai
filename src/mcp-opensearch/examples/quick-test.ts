/**
 * Quick Query Example - Test OpenSearch connection and response formatting
 * 
 * Run with: bun run src/mcp-opensearch/examples/quick-test.ts
 */

import { Client } from '@opensearch-project/opensearch';
import { formatOpensearchResponse } from '../utils/response-formatter';
import type { OpensearchResponse } from '../types/opensearch-response.types';

// Load environment variables
const OPENSEARCH_URL = process.env.OPENSEARCH_URL || 'http://localhost:9200';
const OPENSEARCH_USER_NAME = process.env.OPENSEARCH_USER_NAME || 'admin';
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD || '';
const INDEX_NAME = process.env.INDEX_NAME || 'analytics-events';

console.log('OpenSearch Configuration:');
console.log(`  URL: ${OPENSEARCH_URL}`);
console.log(`  User: ${OPENSEARCH_USER_NAME}`);
console.log(`  Index: ${INDEX_NAME}\n`);

// Initialize client
const client = new Client({
  node: OPENSEARCH_URL,
  auth: {
    username: OPENSEARCH_USER_NAME,
    password: OPENSEARCH_PASSWORD,
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    console.log('Testing OpenSearch connection...');
    const info = await client.info();
    console.log('✓ Connected to OpenSearch');
    console.log(`  Cluster: ${info.body.cluster_name}`);
    console.log(`  Version: ${info.body.version.number}\n`);
    return true;
  } catch (error) {
    console.error('✗ Failed to connect to OpenSearch:', error);
    return false;
  }
}

async function getRecentEvents() {
  console.log('Fetching recent events...\n');

  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: { match_all: {} },
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        size: 5,
      },
    });

    console.log(`Found ${response.body.hits.total.value} total events in index\n`);

    // Format as Analytics response (UI-friendly)
    const analyticsResponse = formatOpensearchResponse(
      response.body as OpensearchResponse,
      'analytics'
    );

    console.log('=== Analytics Format Response ===');
    console.log(`Count: ${analyticsResponse.Count}`);
    console.log(`Events returned: ${analyticsResponse.AnalyticsEvents.length}\n`);

    if (analyticsResponse.AnalyticsEvents.length > 0) {
      console.log('First event:');
      console.log(JSON.stringify(analyticsResponse.AnalyticsEvents[0], null, 2));
    }

    return analyticsResponse;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

async function getEventsByModule(moduleId: string) {
  console.log(`\nFetching ${moduleId} events...\n`);

  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          term: { 'eventData.moduleId.keyword': moduleId },
        },
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        size: 3,
        aggs: {
          by_source: {
            terms: {
              field: 'eventData.eventSourceId.keyword',
              size: 10,
            },
            aggs: {
              latest_events: {
                top_hits: {
                  size: 1,
                  sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
                },
              },
            },
          },
        },
      },
    });

    // Format as DTO (includes aggregations)
    const dtoResponse = formatOpensearchResponse(
      response.body as OpensearchResponse,
      'dto'
    );

    console.log('=== DTO Format Response ===');
    console.log(`Total ${moduleId} events: ${dtoResponse.totalValue}`);
    console.log(`Sources with events: ${dtoResponse.AggsResult.length}`);
    console.log(`Events in response: ${dtoResponse.HitList.length}\n`);

    if (dtoResponse.AggsResult.length > 0) {
      console.log('Aggregation by source:');
      dtoResponse.AggsResult.forEach((bucket) => {
        console.log(`  ${bucket.key}: ${bucket.doc_count} events`);
      });
    }

    return dtoResponse;
  } catch (error) {
    console.error('Error fetching module events:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('==============================================');
  console.log('OpenSearch Quick Test');
  console.log('==============================================\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n⚠ Could not connect to OpenSearch. Check your .env configuration.');
    process.exit(1);
  }

  // Get recent events
  await getRecentEvents();

  // Get events by module (try common modules)
  const modulesToTest = ['CROWD_COUNT', 'FACIAL_RECOGNITION', 'VH_LP_RECOGNITION'];
  
  for (const moduleId of modulesToTest) {
    try {
      await getEventsByModule(moduleId);
    } catch (error) {
      console.log(`No events found for module: ${moduleId}\n`);
    }
  }

  console.log('\n==============================================');
  console.log('Test completed!');
  console.log('==============================================\n');
}

// Run
if (import.meta.main) {
  main().catch(console.error);
}
