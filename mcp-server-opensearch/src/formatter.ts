import {
  OpensearchResponse,
  OpensearchResponseDTO,
  AnalyticsEventResponse,
  ResponseFormat,
  Bucket,
  AnalyticsEvent,
} from './types.js';

/**
 * Format OpenSearch response into different output formats
 */
export function formatOpensearchResponse(
  response: OpensearchResponse,
  format: ResponseFormat
): OpensearchResponseDTO | AnalyticsEventResponse | OpensearchResponse {
  if (format === 'raw') {
    return response;
  }

  const totalValue = response.hits.total.value;
  const hits = response.hits.hits || [];
  const aggregations = response.aggregations || {};

  // Extract aggregation buckets from any aggregation field
  let buckets: Bucket[] = [];
  for (const key in aggregations) {
    if (aggregations[key]?.buckets) {
      buckets = aggregations[key].buckets;
      break;
    }
  }

  if (format === 'dto') {
    return {
      totalValue,
      AggsResult: buckets,
      HitList: hits,
    };
  }

  // Format as analytics events (clean format for UI)
  const analyticsEvents: AnalyticsEvent[] = hits.map((hit) => hit._source.eventData);

  // Extract aggregation events (from top_hits in buckets)
  const aggregationEvents: AnalyticsEvent[] = [];
  for (const bucket of buckets) {
    if (bucket.latest_events?.hits?.hits) {
      for (const hit of bucket.latest_events.hits.hits) {
        aggregationEvents.push(hit._source.eventData);
      }
    }
  }

  return {
    Count: totalValue,
    AnalyticsEvents: analyticsEvents,
    Aggregation: aggregationEvents,
  };
}
