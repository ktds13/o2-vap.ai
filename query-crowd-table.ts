import { Client } from '@opensearch-project/opensearch';

const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USER_NAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin',
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

const INDEX_NAME = process.env.INDEX_NAME || 'analytics-events';

async function getCrowdEventsTable() {
  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [
              { term: { 'eventData.moduleId.keyword': 'CROWD_COUNT' } },
              { term: { 'eventData.eventSourceType.keyword': 'live_stream' } }
            ]
          }
        },
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        size: 3
      }
    });

    const events = response.body.hits.hits.map(hit => hit._source);
    
    // Display in table format
    console.log('\n┌────────────────────────────────────────┬──────────┬───────────────────┬──────────────┐');
    console.log('│ Event ID                               │ Source ID│ Source Name       │ Source Type  │');
    console.log('├────────────────────────────────────────┼──────────┼───────────────────┼──────────────┤');
    
    events.forEach((event) => {
      const eventId = (event.eventData?.eventId || '').padEnd(38);
      const sourceId = (event.eventData?.eventSourceId || '').padEnd(8);
      const sourceName = (event.eventData?.eventSourceName || '').padEnd(17);
      const sourceType = (event.eventData?.eventSourceType || '').padEnd(12);
      
      console.log(`│ ${eventId} │ ${sourceId} │ ${sourceName} │ ${sourceType} │`);
    });
    
    console.log('└────────────────────────────────────────┴──────────┴───────────────────┴──────────────┘\n');

  } catch (error) {
    console.error('Error querying OpenSearch:', error);
    throw error;
  }
}

getCrowdEventsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Query failed:', error);
    process.exit(1);
  });
