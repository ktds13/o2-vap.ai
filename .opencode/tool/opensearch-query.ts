/// <reference path="../env.d.ts" />
import { Client } from '@opensearch-project/opensearch';
import { tool } from "@opencode-ai/plugin";
import DESCRIPTION from "./opensearch-query.txt";
import { formatOpensearchResponse } from '../../src/mcp-opensearch/utils/response-formatter';
import type { OpensearchResponse } from '../../src/mcp-opensearch/types/opensearch-response.types';

// Environment configuration
const OPENSEARCH_URL = process.env.OPENSEARCH_URL || 'http://localhost:9200';
const OPENSEARCH_USER_NAME = process.env.OPENSEARCH_USER_NAME || 'admin';
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD || '';
const DEFAULT_INDEX = process.env.INDEX_NAME || 'analytics-events';

// Initialize OpenSearch client (singleton)
let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({
      node: OPENSEARCH_URL,
      auth: {
        username: OPENSEARCH_USER_NAME,
        password: OPENSEARCH_PASSWORD,
      },
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  return client;
}

export default tool({
  description: DESCRIPTION,
  args: {
    query: tool.schema
      .object()
      .describe("OpenSearch query DSL as a JSON object (including query, filters, aggregations, etc.)"),
    index: tool.schema
      .string()
      .describe("Target index name")
      .default(DEFAULT_INDEX),
    format: tool.schema
      .enum(["raw", "dto", "analytics"])
      .describe("Response format: 'raw' (unformatted), 'dto' (backend format), 'analytics' (UI-friendly)")
      .default("analytics"),
  },
  async execute(args) {
    try {
      const client = getClient();
      
      // Execute the OpenSearch query
      const response = await client.search({
        index: args.index,
        body: args.query,
      });

      // Return raw response if requested
      if (args.format === "raw") {
        return JSON.stringify(response.body, null, 2);
      }

      // Format the response based on requested format
      const opensearchResponse = response.body as OpensearchResponse;
      const formatted = formatOpensearchResponse(opensearchResponse, args.format as 'dto' | 'analytics');

      return JSON.stringify(formatted, null, 2);
    } catch (error) {
      // Handle OpenSearch errors
      if (error instanceof Error) {
        throw new Error(`OpenSearch query failed: ${error.message}`);
      }
      throw new Error(`OpenSearch query failed with unknown error: ${String(error)}`);
    }
  },
});
