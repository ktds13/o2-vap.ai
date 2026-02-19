/**
 * Sample Query Tool - Demonstrates OpenSearch queries with o2vap.management response formatting
 * 
 * This example shows how to:
 * 1. Connect to OpenSearch using environment variables
 * 2. Query analytics events with filters
 * 3. Use aggregations for grouping
 * 4. Format responses to match o2vap.management DTOs
 */

import { Client } from '@opensearch-project/opensearch';
import { formatOpensearchResponse } from '../utils/response-formatter';
import type { OpensearchResponse } from '../types/opensearch-response.types';

// Initialize OpenSearch client from environment variables
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

/**
 * Example 1: Query crowd events with date range and aggregation by source
 */
async function queryCrowdEvents() {
  console.log('\n=== Example 1: Crowd Events with Aggregation ===\n');

  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [
              { term: { 'eventData.moduleId.keyword': 'CROWD_COUNT' } },
              {
                range: {
                  'eventData.eventDateTime': {
                    gte: '2026-02-18T00:00:00Z',
                    lte: '2026-02-18T23:59:59Z',
                  },
                },
              },
            ],
          },
        },
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        size: 10,
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

    // Format response as DTO (includes full metadata and buckets)
    const dtoResponse = formatOpensearchResponse(response.body as OpensearchResponse, 'dto');
    console.log('DTO Format Response:');
    console.log(JSON.stringify(dtoResponse, null, 2));

    // Format response for UI (cleaner, just events)
    const analyticsResponse = formatOpensearchResponse(response.body as OpensearchResponse, 'analytics');
    console.log('\nAnalytics Format Response:');
    console.log(JSON.stringify(analyticsResponse, null, 2));

    return analyticsResponse;
  } catch (error) {
    console.error('Error querying crowd events:', error);
    throw error;
  }
}

/**
 * Example 2: Query vehicle events with license plate search
 */
async function queryVehicleEvents(licensePlatePattern: string = '*') {
  console.log('\n=== Example 2: Vehicle Events with License Plate Search ===\n');

  try {
    const mustClauses: any[] = [
      {
        terms: {
          'eventData.moduleId.keyword': [
            'VH_LP_RECOGNITION',
            'VH_MODEL_RECOGNITION',
            'VH_CT_RECOGNITION',
          ],
        },
      },
    ];

    // Add wildcard search if pattern provided
    if (licensePlatePattern !== '*') {
      mustClauses.push({
        wildcard: {
          'eventData.eventData.licensePlate.keyword': {
            value: `*${licensePlatePattern}*`,
            case_insensitive: true,
          },
        },
      });
    }

    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: mustClauses,
          },
        },
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        size: 20,
      },
    });

    const analyticsResponse = formatOpensearchResponse(response.body as OpensearchResponse, 'analytics');
    console.log(`Found ${analyticsResponse.Count} vehicle events`);
    console.log(JSON.stringify(analyticsResponse, null, 2));

    return analyticsResponse;
  } catch (error) {
    console.error('Error querying vehicle events:', error);
    throw error;
  }
}

/**
 * Example 3: Query facial recognition events for person tracking
 */
async function queryFacialEvents(personId?: string) {
  console.log('\n=== Example 3: Facial Recognition Events ===\n');

  try {
    const mustClauses: any[] = [
      { term: { 'eventData.moduleId.keyword': 'FACIAL_RECOGNITION' } },
    ];

    if (personId) {
      mustClauses.push({
        term: { 'eventData.eventData.personId.keyword': personId },
      });
    }

    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: mustClauses,
          },
        },
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        size: 50,
        aggs: {
          by_source: {
            terms: {
              field: 'eventData.eventSourceId.keyword',
              size: 20,
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

    const dtoResponse = formatOpensearchResponse(response.body as OpensearchResponse, 'dto');
    console.log(`Total facial events: ${dtoResponse.totalValue}`);
    console.log(`Cameras with detections: ${dtoResponse.AggsResult.length}`);
    console.log(JSON.stringify(dtoResponse, null, 2));

    return dtoResponse;
  } catch (error) {
    console.error('Error querying facial events:', error);
    throw error;
  }
}

/**
 * Example 4: Query all module types with statistics
 */
async function queryModuleStatistics() {
  console.log('\n=== Example 4: Module Statistics ===\n');

  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: { match_all: {} },
        size: 0, // We only want aggregation results
        aggs: {
          by_module: {
            terms: {
              field: 'eventData.moduleId.keyword',
              size: 20,
            },
            aggs: {
              by_status: {
                terms: {
                  field: 'eventData.status.keyword',
                  size: 10,
                },
              },
              by_source: {
                terms: {
                  field: 'eventData.eventSourceId.keyword',
                  size: 5,
                },
              },
            },
          },
        },
      },
    });

    const stats = response.body.aggregations.by_module.buckets;
    console.log('Module Statistics:');
    stats.forEach((module: any) => {
      console.log(`\n${module.key}: ${module.doc_count} events`);
      console.log('  Status breakdown:');
      module.by_status.buckets.forEach((status: any) => {
        console.log(`    ${status.key}: ${status.doc_count}`);
      });
      console.log('  Top sources:');
      module.by_source.buckets.forEach((source: any) => {
        console.log(`    ${source.key}: ${source.doc_count}`);
      });
    });

    return stats;
  } catch (error) {
    console.error('Error querying module statistics:', error);
    throw error;
  }
}

/**
 * Example 5: Query events by multiple filters (flexible search)
 */
async function queryEventsByFilters(options: {
  moduleIds?: string[];
  eventSourceIds?: string[];
  status?: 'verified' | 'unverified';
  dateRange?: { start: string; end: string };
  from?: number;
  size?: number;
}) {
  console.log('\n=== Example 5: Flexible Search with Multiple Filters ===\n');
  console.log('Search options:', JSON.stringify(options, null, 2));

  try {
    const mustClauses: any[] = [];

    // Module filter
    if (options.moduleIds && options.moduleIds.length > 0) {
      if (options.moduleIds.length === 1) {
        mustClauses.push({ term: { 'eventData.moduleId.keyword': options.moduleIds[0] } });
      } else {
        mustClauses.push({ terms: { 'eventData.moduleId.keyword': options.moduleIds } });
      }
    }

    // Source filter
    if (options.eventSourceIds && options.eventSourceIds.length > 0) {
      if (options.eventSourceIds.length === 1) {
        mustClauses.push({ term: { 'eventData.eventSourceId.keyword': options.eventSourceIds[0] } });
      } else {
        mustClauses.push({ terms: { 'eventData.eventSourceId.keyword': options.eventSourceIds } });
      }
    }

    // Status filter
    if (options.status) {
      mustClauses.push({ term: { 'eventData.status.keyword': options.status } });
    }

    // Date range filter
    if (options.dateRange) {
      mustClauses.push({
        range: {
          'eventData.eventDateTime': {
            gte: options.dateRange.start,
            lte: options.dateRange.end,
          },
        },
      });
    }

    const query = mustClauses.length > 0 ? { bool: { must: mustClauses } } : { match_all: {} };

    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query,
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        from: options.from || 0,
        size: options.size || 10,
      },
    });

    const analyticsResponse = formatOpensearchResponse(response.body as OpensearchResponse, 'analytics');
    console.log(`\nFound ${analyticsResponse.Count} events matching filters`);
    console.log(JSON.stringify(analyticsResponse, null, 2));

    return analyticsResponse;
  } catch (error) {
    console.error('Error querying events:', error);
    throw error;
  }
}

/**
 * Example 6: Get event by ID
 */
async function getEventById(eventId: string) {
  console.log(`\n=== Example 6: Get Event by ID: ${eventId} ===\n`);

  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          term: { 'eventData.eventId.keyword': eventId },
        },
        size: 1,
      },
    });

    if (response.body.hits.total.value === 0) {
      console.log('Event not found');
      return null;
    }

    const event = response.body.hits.hits[0]._source.eventData;
    console.log('Event found:');
    console.log(JSON.stringify(event, null, 2));

    return event;
  } catch (error) {
    console.error('Error getting event by ID:', error);
    throw error;
  }
}

// Main execution function
async function main() {
  console.log('=================================================');
  console.log('OpenSearch Analytics Query Examples');
  console.log('With o2vap.management Response Formatting');
  console.log('=================================================');

  try {
    // Example 1: Crowd events with aggregation
    await queryCrowdEvents();

    // Example 2: Vehicle events (uncomment and add license plate if needed)
    // await queryVehicleEvents('ABC');

    // Example 3: Facial recognition events (uncomment and add personId if needed)
    // await queryFacialEvents('PERSON_123');

    // Example 4: Module statistics
    await queryModuleStatistics();

    // Example 5: Flexible search with multiple filters
    await queryEventsByFilters({
      moduleIds: ['CROWD_COUNT', 'FACIAL_RECOGNITION'],
      status: 'verified',
      dateRange: {
        start: '2026-02-18T00:00:00Z',
        end: '2026-02-18T23:59:59Z',
      },
      size: 5,
    });

    // Example 6: Get specific event by ID (uncomment and add real ID)
    // await getEventById('your-event-id-here');

    console.log('\n=================================================');
    console.log('All examples completed successfully!');
    console.log('=================================================\n');
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

// Export functions for use in other modules
export {
  queryCrowdEvents,
  queryVehicleEvents,
  queryFacialEvents,
  queryModuleStatistics,
  queryEventsByFilters,
  getEventById,
};
