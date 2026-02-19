#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';
import { formatOpensearchResponse } from './formatter.js';
import { OpensearchResponse, ResponseFormat } from './types.js';

// Load environment variables
dotenv.config();

// OpenSearch client
let opensearchClient: Client | null = null;

function getOpensearchClient(): Client {
  if (!opensearchClient) {
    const node = process.env.OPENSEARCH_URL || 'http://localhost:9200';
    const username = process.env.OPENSEARCH_USER_NAME || 'admin';
    const password = process.env.OPENSEARCH_PASSWORD;

    if (!password) {
      throw new Error('OPENSEARCH_PASSWORD environment variable is required');
    }

    opensearchClient = new Client({
      node,
      auth: {
        username,
        password,
      },
      ssl: {
        rejectUnauthorized: false, // For dev with self-signed certs
      },
    });
  }

  return opensearchClient;
}

// Define the execute_opensearch_query tool
const EXECUTE_OPENSEARCH_QUERY_TOOL: Tool = {
  name: 'execute_opensearch_query',
  description: `Execute OpenSearch queries for analytics events and return formatted results.

Query the OpenSearch analytics-events index and transform results into analytics event format.

Use this tool to:
- Search for analytics events by module type (FACIAL_RECOGNITION, CROWD_COUNT, VH_LP_RECOGNITION, etc.)
- Query events within a specific time range
- Filter events by camera/source, task, or service
- Get aggregated analytics data
- Search for specific event IDs or metadata
- Analyze event patterns and trends

The tool accepts full OpenSearch Query DSL and returns results in one of three formats:
- "analytics": Analytics event format (AnalyticsEventResponse) - UI-friendly with clean event objects
- "dto": DTO format (OpensearchResponseDTO) - includes aggregation buckets and hit metadata
- "raw": Raw OpenSearch response - full response with _source, _id, _score, etc.

Available analytics modules:
- FACIAL_RECOGNITION: Face recognition and matching
- CROWD_COUNT: People counting analytics
- CROWD_FLOW: Crowd movement and flow analysis
- LOITERING: Loitering detection
- PERSON_RE_ID: Person re-identification across cameras
- UNATTENDED: Unattended object detection
- VH_LP_RECOGNITION: Vehicle license plate recognition
- VH_MODEL_RECOGNITION: Vehicle model recognition
- VH_CT_RECOGNITION: Vehicle color/type recognition`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'object',
        description: 'OpenSearch Query DSL object (full query body)',
        default: {},
      },
      index: {
        type: 'string',
        description: 'Index name to query',
        default: process.env.INDEX_NAME || 'analytics-events',
      },
      format: {
        type: 'string',
        enum: ['analytics', 'dto', 'raw'],
        description:
          'Response format: analytics (UI-friendly), dto (with metadata), or raw (OpenSearch response)',
        default: 'analytics',
      },
    },
    required: [],
  },
};

// Create MCP server
const server = new Server(
  {
    name: 'mcp-server-opensearch',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [EXECUTE_OPENSEARCH_QUERY_TOOL],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'execute_opensearch_query') {
    try {
      const client = getOpensearchClient();

      // Extract parameters
      const query = (args?.query as Record<string, any>) || {};
      const index = (args?.index as string) || process.env.INDEX_NAME || 'analytics-events';
      const format = (args?.format as ResponseFormat) || 'analytics';

      // Validate format
      if (!['analytics', 'dto', 'raw'].includes(format)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Invalid format',
                  message: 'Format must be one of: analytics, dto, raw',
                  received: format,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Execute OpenSearch query
      const response = await client.search({
        index,
        body: query,
      });

      // Format the response
      const formattedResponse = formatOpensearchResponse(
        response.body as OpensearchResponse,
        format
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResponse, null, 2),
          },
        ],
      };
    } catch (error: any) {
      // Handle OpenSearch errors
      if (error.meta?.body) {
        const errorBody = error.meta.body;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'OpenSearch query failed',
                  message: error.message,
                  details: errorBody.error || errorBody,
                  status: error.meta.statusCode,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      // Handle connection errors
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'OpenSearch connection failed',
                message: error.message,
                hint: 'Check OPENSEARCH_URL, OPENSEARCH_USER_NAME, and OPENSEARCH_PASSWORD in .env file',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: 'Unknown tool', tool: name }, null, 2),
      },
    ],
    isError: true,
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr (stdout is used for MCP protocol)
  console.error('MCP OpenSearch Server running on stdio');
  console.error('Environment:', {
    OPENSEARCH_URL: process.env.OPENSEARCH_URL || 'http://localhost:9200',
    OPENSEARCH_USER_NAME: process.env.OPENSEARCH_USER_NAME || 'admin',
    INDEX_NAME: process.env.INDEX_NAME || 'analytics-events',
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
