import { Client } from '@opensearch-project/opensearch';

const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USER_NAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin',
  },
  ssl: {
    rejectUnauthorized: false, // For dev with self-signed certs
  },
});

const INDEX_NAME = process.env.INDEX_NAME || 'analytics-events';

async function getLatestCrowdCountEvents() {
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
        size: 10
      }
    });

    const events = response.body.hits.hits.map(hit => hit._source);
    const total = response.body.hits.total.value;

    console.log(`Found ${total} total CROWD_COUNT events with sourceType=live_stream. Showing latest 10:\n`);
    
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`  Event ID: ${event.eventData?.analyticsEventId || event.eventData?.eventId}`);
      console.log(`  Date/Time: ${event.eventData?.eventDateTime}`);
      console.log(`  Source: ${event.eventData?.eventSourceName || event.eventData?.eventSourceId} (ID: ${event.eventData?.eventSourceId})`);
      console.log(`  Source Type: ${event.eventData?.eventSourceType}`);
      console.log(`  Status: ${event.eventData?.status}`);
      console.log(`  Task ID: ${event.eventData?.taskId}`);
      
      // Display crowd count data (nested in eventData.eventData array)
      if (event.eventData?.eventData && Array.isArray(event.eventData.eventData)) {
        console.log(`  Crowd Data:`);
        event.eventData.eventData.forEach((data, i) => {
          console.log(`    - Count: ${data.count}, Confidence: ${data.confidenceScore}, Areas: ${data.boundaryAreaIds?.length || 0}`);
        });
      }
      console.log('');
    });

    return events;
  } catch (error) {
    console.error('Error querying OpenSearch:', error);
    throw error;
  }
}

// Run the query
getLatestCrowdCountEvents()
  .then(() => {
    console.log('Query completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Query failed:', error);
    process.exit(1);
  });
