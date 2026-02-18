import { Client } from '@opensearch-project/opensearch';

const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USER_NAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'NETe2@sia',
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

const INDEX_NAME = process.env.INDEX_NAME || 'analytics-events';

async function listAvailableSources() {
  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        size: 0,
        aggs: {
          by_source: {
            terms: {
              field: 'eventData.eventSourceId.keyword',
              size: 50
            },
            aggs: {
              doc_count: {
                value_count: {
                  field: 'eventData.eventSourceId.keyword'
                }
              }
            }
          }
        }
      }
    });

    const sources = response.body.aggregations.by_source.buckets;

    console.log('\nAvailable event sources:');
    console.table(sources.map((bucket: any) => ({
      'Source ID': bucket.key,
      'Event Count': bucket.doc_count
    })));

    // Also search for sources containing "office" or "livecam"
    console.log('\n--- Searching for sources matching "office" or "livecam" ---');
    const matchResponse = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            should: [
              { wildcard: { 'eventData.eventSourceId.keyword': '*office*' } },
              { wildcard: { 'eventData.eventSourceId.keyword': '*livecam*' } }
            ],
            minimum_should_match: 1
          }
        },
        size: 5,
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }]
      }
    });

    if (matchResponse.body.hits.hits.length > 0) {
      console.log('\nFound matching events:');
      console.table(matchResponse.body.hits.hits.map((hit: any) => ({
        'Source ID': hit._source.eventData?.eventSourceId || 'N/A',
        'Module': hit._source.eventData?.moduleId || 'N/A',
        'Date/Time': hit._source.eventData?.eventDateTime || 'N/A'
      })));
    } else {
      console.log('No events found matching "office" or "livecam"');
    }

    return sources;
  } catch (error: any) {
    console.error('Error querying OpenSearch:', error.message);
    if (error.meta?.body) {
      console.error('OpenSearch error details:', JSON.stringify(error.meta.body, null, 2));
    }
    throw error;
  }
}

listAvailableSources()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to list sources:', error);
    process.exit(1);
  });
