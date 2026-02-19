# Example Query Test Cases

These are example queries you can use to test the MCP server.

## 1. Simple Match All Query

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "query": {
        "match_all": {}
      },
      "size": 5
    },
    "format": "analytics"
  }
}
```

## 2. Get Latest Facial Recognition Events

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "query": {
        "term": {
          "eventData.moduleId.keyword": "FACIAL_RECOGNITION"
        }
      },
      "sort": [
        {
          "eventData.eventDateTime": {
            "order": "desc"
          }
        }
      ],
      "size": 10
    },
    "format": "analytics"
  }
}
```

## 3. Search Vehicle License Plates (Last 24h)

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "eventData.moduleId.keyword": "VH_LP_RECOGNITION"
              }
            },
            {
              "range": {
                "eventData.eventDateTime": {
                  "gte": "now-24h"
                }
              }
            }
          ]
        }
      },
      "sort": [
        {
          "eventData.eventDateTime": {
            "order": "desc"
          }
        }
      ],
      "size": 50
    },
    "format": "analytics"
  }
}
```

## 4. Aggregation by Camera (DTO Format)

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "size": 0,
      "aggs": {
        "by_source": {
          "terms": {
            "field": "eventData.eventSourceId.keyword",
            "size": 10
          },
          "aggs": {
            "latest_events": {
              "top_hits": {
                "sort": [
                  {
                    "eventData.eventDateTime": {
                      "order": "desc"
                    }
                  }
                ],
                "size": 1
              }
            }
          }
        }
      }
    },
    "format": "dto"
  }
}
```

## 5. Count Events by Module Type

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "size": 0,
      "aggs": {
        "by_module": {
          "terms": {
            "field": "eventData.moduleId.keyword",
            "size": 20
          }
        }
      }
    },
    "format": "dto"
  }
}
```

## 6. Complex Multi-Module Search

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "query": {
        "bool": {
          "should": [
            {
              "term": {
                "eventData.moduleId.keyword": "FACIAL_RECOGNITION"
              }
            },
            {
              "term": {
                "eventData.moduleId.keyword": "VH_LP_RECOGNITION"
              }
            },
            {
              "term": {
                "eventData.moduleId.keyword": "LOITERING"
              }
            }
          ],
          "minimum_should_match": 1,
          "filter": [
            {
              "range": {
                "eventData.eventDateTime": {
                  "gte": "now-7d"
                }
              }
            }
          ]
        }
      },
      "sort": [
        {
          "eventData.eventDateTime": {
            "order": "desc"
          }
        }
      ],
      "size": 20
    },
    "format": "analytics"
  }
}
```

## 7. Raw OpenSearch Response

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "query": {
        "match_all": {}
      },
      "size": 3
    },
    "format": "raw"
  }
}
```

## 8. Filter by Task and Date Range

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "eventData.taskId.keyword": "task-123"
              }
            },
            {
              "range": {
                "eventData.eventDateTime": {
                  "gte": "2026-02-01T00:00:00Z",
                  "lte": "2026-02-19T23:59:59Z"
                }
              }
            }
          ]
        }
      },
      "sort": [
        {
          "eventData.eventDateTime": {
            "order": "asc"
          }
        }
      ],
      "size": 100
    },
    "format": "analytics"
  }
}
```

## 9. Search by Verified Status

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "query": {
        "term": {
          "eventData.status.keyword": "verified"
        }
      },
      "sort": [
        {
          "eventData.eventDateTime": {
            "order": "desc"
          }
        }
      ],
      "size": 20
    },
    "format": "analytics"
  }
}
```

## 10. Crowd Events Above Threshold

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "eventData.moduleId.keyword": "CROWD_COUNT"
              }
            },
            {
              "range": {
                "eventData.eventData.crowdSize": {
                  "gte": 50
                }
              }
            }
          ]
        }
      },
      "sort": [
        {
          "eventData.eventDateTime": {
            "order": "desc"
          }
        }
      ],
      "size": 20
    },
    "format": "analytics"
  }
}
```

## Using with MCP Inspector

1. Start MCP Inspector:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

2. Open the web interface (usually http://localhost:5173)

3. Use the "Tools" tab to call `execute_opensearch_query`

4. Paste any of the arguments from above into the arguments field

5. Click "Call Tool" to execute and see the response

## Testing Connection

To verify OpenSearch is accessible, you can test with a simple match_all query:

```json
{
  "name": "execute_opensearch_query",
  "arguments": {
    "query": {
      "query": { "match_all": {} },
      "size": 1
    },
    "format": "raw"
  }
}
```

This will return the raw OpenSearch response with connection details and one document.
