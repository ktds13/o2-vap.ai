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

async function getPOICam02Events() {
  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [
              { term: { 'eventData.moduleId.keyword': 'CROWD_COUNT' } },
              { term: { 'eventData.eventSourceType.keyword': 'live_stream' } },
              { term: { 'eventData.eventSourceName.keyword': 'POI Cam02' } }
            ]
          }
        },
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        size: 100
      }
    });

    const events = response.body.hits.hits.map(hit => hit._source);
    const total = response.body.hits.total.value;
    
    console.log(`\nFound ${total} events from POI Cam02\n`);
    
    // Display in table format
    console.log('┌────────────────────────────────────────┬──────────┬───────────────────┬──────────────┬─────────────────────────┐');
    console.log('│ Event ID                               │ Source ID│ Source Name       │ Source Type  │ Event Date/Time         │');
    console.log('├────────────────────────────────────────┼──────────┼───────────────────┼──────────────┼─────────────────────────┤');
    
    events.forEach((event) => {
      const eventId = (event.eventData?.eventId || '').padEnd(38);
      const sourceId = (event.eventData?.eventSourceId || '').padEnd(8);
      const sourceName = (event.eventData?.eventSourceName || '').padEnd(17);
      const sourceType = (event.eventData?.eventSourceType || '').padEnd(12);
      const dateTime = (event.eventData?.eventDateTime || '').substring(0, 23).padEnd(23);
      
      console.log(`│ ${eventId} │ ${sourceId} │ ${sourceName} │ ${sourceType} │ ${dateTime} │`);
    });
    
    console.log('└────────────────────────────────────────┴──────────┴───────────────────┴──────────────┴─────────────────────────┘\n');

  } catch (error) {
    console.error('Error querying OpenSearch:', error);
    throw error;
  }
}

getPOICam02Events()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Query failed:', error);
    process.exit(1);
  });
