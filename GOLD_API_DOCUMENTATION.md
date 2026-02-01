# Live Gold Price API Documentation

## Endpoint: `/api/gold/qar`

### Description
Returns **REAL-TIME** spot gold prices in Qatari Riyal (QAR). This endpoint fetches live data from multiple sources and performs automatic currency conversion.

### Method
```
GET /api/gold/qar
```

### Authentication
No authentication required (public endpoint)

### Data Sources
1. **FreeGoldAPI.com** - Real-time gold spot prices (XAU/USD)
   - URL: https://freegoldapi.com/data/latest.json
   - Free, no API key required
   - Updates daily at 6 AM UTC
   
2. **Open Exchange Rates** - Live USD to QAR conversion
   - URL: https://open.er-api.com/v6/latest/USD
   - Free, no API key required
   - Real-time exchange rates

### Caching
- **Duration:** 60 seconds
- **Purpose:** Reduce API calls and improve response time
- **Behavior:** First request fetches fresh data, subsequent requests within 60 seconds return cached data

### Response Format

#### Success Response (200 OK)
```json
{
  "source": "FreeGoldAPI + OpenExchangeRates",
  "timestamp": "2026-02-01T16:47:15.825988+00:00",
  "ounceUSD": 5067.5,
  "usdToQar": 3.64,
  "ounceQAR": 18445.7,
  "gramQAR": 593.04,
  "goldDate": "2026-01-30"
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Data sources used for the calculation |
| `timestamp` | string (ISO 8601) | Server timestamp when data was fetched |
| `ounceUSD` | number | Gold price per troy ounce in USD |
| `usdToQar` | number | USD to QAR exchange rate |
| `ounceQAR` | number | Gold price per troy ounce in QAR |
| `gramQAR` | number | **Gold price per gram in QAR** |
| `goldDate` | string | Date of the gold price data |

### Error Responses

#### 502 Bad Gateway
Returned when external APIs are unavailable:
```json
{
  "detail": "FreeGoldAPI returned status 500"
}
```

#### 500 Internal Server Error
Returned for unexpected errors:
```json
{
  "detail": "Failed to fetch live gold prices: [error details]"
}
```

### Calculations

1. **Get Gold Price in USD**
   ```
   ounceUSD = Gold spot price from FreeGoldAPI
   ```

2. **Get USD to QAR Exchange Rate**
   ```
   usdToQar = Exchange rate from Open Exchange Rates
   ```

3. **Calculate Gold in QAR per Ounce**
   ```
   ounceQAR = ounceUSD × usdToQar
   ```

4. **Calculate Gold in QAR per Gram**
   ```
   gramQAR = ounceQAR ÷ 31.1034768
   ```
   (1 troy ounce = 31.1034768 grams)

### Usage Examples

#### cURL
```bash
curl "http://localhost:8001/api/gold/qar"
```

#### Python
```python
import requests

response = requests.get("http://localhost:8001/api/gold/qar")
data = response.json()

print(f"Gold price: {data['gramQAR']} QAR per gram")
```

#### JavaScript/TypeScript
```typescript
fetch('http://localhost:8001/api/gold/qar')
  .then(response => response.json())
  .then(data => {
    console.log(`Gold price: ${data.gramQAR} QAR per gram`);
  });
```

### Important Notes

1. **Real Data Only**: This endpoint returns actual market data, never mock/dummy data
2. **No API Keys Required**: Uses free, public APIs
3. **Cache Aware**: Returns cached data if less than 60 seconds old
4. **Error Handling**: Gracefully handles API failures with descriptive error messages
5. **Timezone**: All timestamps are in UTC

### Performance

- **First Request:** ~500-800ms (fetches from external APIs)
- **Cached Request:** ~10-20ms (returns from memory)
- **Cache Duration:** 60 seconds

### Reliability

The endpoint uses two independent, free APIs:
- If one API fails, the error is clearly reported
- No fallback to mock data
- All responses contain real market data

### Integration with App

The main app uses `/api/gold/prices/current` which internally can call this endpoint or use its own logic. This `/api/gold/qar` endpoint is available as a standalone service for:
- Direct gold price queries
- External integrations
- Testing and validation

### Testing

Test the endpoint:
```bash
# Get current gold price
curl "http://localhost:8001/api/gold/qar" | jq

# Test caching (run twice within 60 seconds)
time curl "http://localhost:8001/api/gold/qar"
time curl "http://localhost:8001/api/gold/qar"  # Should be faster
```

### Monitoring

Check backend logs to see API calls:
```bash
tail -f /var/log/supervisor/backend.out.log | grep "gold/qar"
```
