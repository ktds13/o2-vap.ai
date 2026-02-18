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

async function getEventsForSource(sourceId: string, size: number = 3) {
  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          term: { 'eventData.eventSourceId.keyword': sourceId }
        },
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        size: size
      }
    });

    const events = response.body.hits.hits.map((hit: any) => hit._source);
    const total = response.body.hits.total.value;

    console.log(`\nFound ${total} total events for source: ${sourceId}`);
    console.log(`Showing ${events.length} most recent events:\n`);

    // Display in table format
    if (events.length > 0) {
      console.table(events.map((event: any) => ({
        'Event ID': event.eventData?.analyticsEventId || event.analyticsEventId || 'N/A',
        'Module': event.eventData?.moduleId || event.analyticsModuleId || 'N/A',
        'Source': event.eventData?.eventSourceId || event.eventSourceId || 'N/A',
        'Date/Time': event.eventData?.eventDateTime || event.eventDateTime || 'N/A',
        'Status': event.eventData?.status || event.status || 'N/A',
        'Task ID': event.eventData?.taskId || event.analyticsTaskId || 'N/A'
      })));

      // Show detailed data for each event
      console.log('\nDetailed Event Data:');
      events.forEach((event: any, index: number) => {
        console.log(`\n--- Event ${index + 1} ---`);
        console.log(JSON.stringify(event, null, 2));
      });
    } else {
      console.log('No events found for this source.');
    }

    return events;
  } catch (error: any) {
    console.error('Error querying OpenSearch:', error.message);
    if (error.meta?.body) {
      console.error('OpenSearch error details:', JSON.stringify(error.meta.body, null, 2));
    }
    throw error;
  }
}

// Query for source 75
getEventsForSource('75', 3)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to query events:', error);
    process.exit(1);
  });
