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

async function checkCrowdEventFields() {
  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          term: { 'eventData.moduleId.keyword': 'CROWD_COUNT' }
        },
        sort: [{ 'eventData.eventDateTime': { order: 'desc' } }],
        size: 1
      }
    });

    const events = response.body.hits.hits.map(hit => hit._source);
    const total = response.body.hits.total.value;

    console.log(`Found ${total} total CROWD_COUNT events.\n`);
    
    if (events.length > 0) {
      console.log('Sample event structure:');
      console.log(JSON.stringify(events[0], null, 2));
    } else {
      console.log('No CROWD_COUNT events found in the index.');
    }

  } catch (error) {
    console.error('Error querying OpenSearch:', error);
    throw error;
  }
}

checkCrowdEventFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Query failed:', error);
    process.exit(1);
  });
