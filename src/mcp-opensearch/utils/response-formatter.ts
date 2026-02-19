/**
 * Utility functions to format OpenSearch responses to o2vap.management format
 */

import type {
  OpensearchResponse,
  OpensearchResponseDTO,
  AnalyticsEventResponse,
  AnalyticsEvent,
  SingleHit,
} from '../types/opensearch-response.types';

/**
 * Format OpenSearch response to OpensearchResponseDTO
 */
export function formatToOpensearchDTO(
  response: OpensearchResponse
): OpensearchResponseDTO {
  return {
    totalValue: response.hits.total.value,
    AggsResult: response.aggregations?.by_source?.buckets || [],
    HitList: response.hits.hits,
  };
}

/**
 * Extract AnalyticsEvent from SingleHit
 */
export function extractAnalyticsEvent(hit: SingleHit): AnalyticsEvent {
  return hit._source.eventData;
}

/**
 * Format OpenSearch response to AnalyticsEventResponse
 */
export function formatToAnalyticsEventResponse(
  response: OpensearchResponse
): AnalyticsEventResponse {
  const analyticsEvents = response.hits.hits.map(extractAnalyticsEvent);
  
  // Extract aggregation events from latest events in buckets
  const aggregationEvents: AnalyticsEvent[] = [];
  if (response.aggregations?.by_source?.buckets) {
    for (const bucket of response.aggregations.by_source.buckets) {
      const latestEvents = bucket.latest_events.hits.hits.map(extractAnalyticsEvent);
      aggregationEvents.push(...latestEvents);
    }
  }

  return {
    Count: response.hits.total.value,
    AnalyticsEvents: analyticsEvents,
    Aggregation: aggregationEvents,
  };
}

/**
 * Format raw OpenSearch response to JSON matching o2vap.management format
 */
export function formatOpensearchResponse(
  response: OpensearchResponse,
  format: 'dto' | 'analytics' = 'dto'
): OpensearchResponseDTO | AnalyticsEventResponse {
  if (format === 'analytics') {
    return formatToAnalyticsEventResponse(response);
  }
  return formatToOpensearchDTO(response);
}
