/**
 * OpenSearch Response Types
 * Based on o2vap.management DTOs structure
 */

export interface Shards {
  failed: number;
  skipped: number;
  successful: number;
  total: number;
}

export interface MetaData {
  resultId: string;
  alertId: string;
}

export interface Media {
  mimeType: string;
  type: string;
  url: string;
}

export interface AnalyticsEvent {
  eventId: string;
  taskId: string;
  serviceId: string;
  moduleId: string;
  eventSourceId: string;
  eventSourceType: string;
  eventDateTime: any;
  videoTime: number;
  status: string;
  media: Media;
  eventData: any;
  verifiedBy: string;
  verifiedDateTime: string;
  verifiedDescription: string;
  groupTag: string;
  eventSourceName: string;
}

export interface Source {
  metadata: MetaData;
  eventData: AnalyticsEvent;
}

export interface SingleHit {
  _id: string;
  _index: string;
  _score: number;
  _source: Source;
}

export interface HitTotal {
  relation: string;
  value: number;
}

export interface Hits {
  hits: SingleHit[];
  max_score: number;
  total: HitTotal;
}

export interface LatestHits {
  hits: Hits;
}

export interface Bucket {
  doc_count: number;
  key: string;
  latest_events: LatestHits;
}

export interface GroupByList {
  buckets: Bucket[];
  doc_count_error_upper_bound: number;
  sum_other_doc_count: number;
}

export interface OpensearchResponse {
  _shards: Shards;
  hits: Hits;
  timed_out: boolean;
  took: number;
  aggregations?: {
    by_source: GroupByList;
  };
}

// Formatted Response DTOs

export interface OpensearchResponseDTO {
  totalValue: number;
  AggsResult: Bucket[];
  HitList: SingleHit[];
}

export interface AnalyticsEventResponse {
  Count: number;
  AnalyticsEvents: AnalyticsEvent[];
  Aggregation: AnalyticsEvent[];
}

export interface ChannelDTO {
  // Define channel structure as needed
  [key: string]: any;
}

export interface AnalyticsEventGroupTagResponse {
  EventsResponse: AnalyticsEventResponse;
  Channels: ChannelDTO[];
}
