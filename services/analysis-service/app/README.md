# Analysis Service

AI-powered stock analysis service using Ollama LLM and technical indicators.

## Features

- **AI Stock Analysis**: Uses Ollama (Llama2/Mistral) for intelligent stock analysis
- **Technical Analysis**: RSI, MACD, Moving Averages, Bollinger Bands
- **Sentiment Analysis**: News-based sentiment from multiple sources
- **Portfolio Analysis**: Complete portfolio health assessment
- **Stock Comparison**: Compare multiple stocks with AI insights
- **Fear & Greed Index**: Market sentiment indicator

## Prerequisites

- Python 3.11+
- Ollama installed and running (https://ollama.ai)
- Ollama model downloaded (e.g., `ollama pull llama2`)

## Installation

### 1. Install Ollama
```bash
# Linux/Mac
curl https://ollama.ai/install.sh | sh

# Windows - download from https://ollama.ai/download

# Pull a model
ollama pull llama2
# or
ollama pull mistral
```

### 2. Install Python Dependencies
```bash
cd services/analysis-service
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run the Service
```bash
# Development
uvicorn app.main:app --reload --port 8083

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8083
```

## API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with Ollama status
- `GET /models` - List available Ollama models

### Analysis
- `POST /api/v1/analysis/stock` - Analyze single stock
- `POST /api/v1/analysis/compare` - Compare multiple stocks
- `POST /api/v1/analysis/portfolio` - Analyze portfolio
- `GET /api/v1/analysis/sentiment/{symbol}` - Get sentiment analysis
- `GET /api/v1/analysis/fear-greed/{symbol}` - Get fear/greed index
- `POST /api/v1/analysis/technical/{symbol}` - Get technical analysis

## Usage Examples

### Analyze a Stock
```bash
curl -X POST http://localhost:8083/api/v1/analysis/stock \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "analysis_type": "comprehensive",
    "include_technical": true,
    "include_sentiment": true
  }'
```

### Compare Stocks
```bash
curl -X POST http://localhost:8083/api/v1/analysis/compare \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["AAPL", "GOOGL", "MSFT"],
    "criteria": ["valuation", "growth", "profitability"]
  }'
```

### Get Sentiment
```bash
curl http://localhost:8083/api/v1/analysis/sentiment/AAPL
```

## Ollama Models

Recommended models:
- **llama2**: General purpose, good balance
- **mistral**: Fast and efficient
- **codellama**: For technical analysis
- **llama2:13b**: More accurate, slower

Switch models in `.env`:
```env
OLLAMA_MODEL=mistral
```

## Docker Deployment
```bash
# Build
docker build -t natols-analysis-service .

# Run
docker run -p 8083:8083 \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  natols-analysis-service
```

## Integration with Data Service

The analysis service expects stock data from the data-service. Update endpoints to fetch real data:
```python
# In production, replace mock data with:
import httpx
response = await httpx.get(f"http://data-service:8082/api/v1/stocks/{symbol}")
stock_data = response.json()
```

## Performance Considerations

- Ollama responses can take 5-30 seconds depending on model and prompt
- Use caching for repeated analyses
- Consider smaller models (llama2:7b) for faster responses
- Use GPU acceleration if available

## Troubleshooting

### Ollama Not Found
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

### Model Not Found
```bash
# List models
ollama list

# Pull model
ollama pull llama2
```

### Slow Responses
- Use a smaller model
- Reduce MAX_ANALYSIS_LENGTH in .env
- Enable GPU if available

## License

Proprietary - Natols Project