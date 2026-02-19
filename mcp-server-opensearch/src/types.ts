// Analytics Event Types (from o2vap.management)

export interface AnalyticsEvent {
  eventId: string;
  taskId: string;
  serviceId: string;
  moduleId: string;
  eventSourceId: string;
  eventSourceType: string;
  eventDateTime: string | number;
  videoTime: number;
  status: 'verified' | 'unverified';
  media: {
    url: string;
    type: string;
    mimeType: string;
  };
  eventData: any;
  verifiedBy?: string;
  verifiedDateTime?: string;
  verifiedDescription?: string;
  groupTag?: string;
  eventSourceName?: string;
}

// OpenSearch Response Types

export interface SingleHit {
  _id: string;
  _index: string;
  _score: number;
  _source: {
    metadata?: {
      resultId?: string;
      alertId?: string;
    };
    eventData: AnalyticsEvent;
  };
}

export interface Bucket {
  doc_count: number;
  key: string;
  latest_events?: {
    hits: {
      hits: SingleHit[];
      max_score?: number | null;
      total?: {
        relation: string;
        value: number;
      };
    };
  };
  [key: string]: any;
}

export interface OpensearchResponse {
  _shards: {
    failed: number;
    skipped: number;
    successful: number;
    total: number;
  };
  hits: {
    hits: SingleHit[];
    max_score: number | null;
    total: {
      relation: string;
      value: number;
    };
  };
  timed_out: boolean;
  took: number;
  aggregations?: {
    [key: string]: {
      buckets?: Bucket[];
      doc_count_error_upper_bound?: number;
      sum_other_doc_count?: number;
      [key: string]: any;
    };
  };
}

// Response DTO Types

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

export type ResponseFormat = 'analytics' | 'dto' | 'raw';
