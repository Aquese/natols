# Natols

**Self-Hosted Financial Analysis Platform**

Natols is a comprehensive, self-hosted financial analysis platform that combines traditional portfolio management with AI-powered stock analysis. Built for individual deployment on dedicated servers or VMs, it provides institutional-grade financial insights without relying on external AI services.

## Overview

Natols delivers personal portfolio management and AI-driven investment analysis capabilities similar to commercial platforms like Qualtrim or Seeking Alpha, but designed for private, self-contained deployment. The platform integrates real-time market data with local AI analysis to generate actionable investment insights, all while maintaining complete data privacy and control.

### Key Features

- **Portfolio Management**: Track multiple portfolios with real-time position monitoring and performance analytics
- **AI-Powered Analysis**: Local AI integration via Ollama (llama2) for intelligent stock analysis and recommendations
- **Real-Time Market Data**: Integration with Alpha Vantage API for current stock prices and financial metrics
- **Comprehensive Analytics**: 
  - Buy/sell recommendations with confidence scoring
  - Dividend analysis and yield projections
  - Technical indicators (RSI, MACD, Moving Averages)
  - Risk assessment and volatility metrics
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Modern UI**: Responsive React TypeScript frontend with Tailwind CSS
- **Microservices Architecture**: Scalable, containerized services for easy deployment and maintenance

## Architecture

Natols uses a microservices architecture with the following components:

```
┌─────────────┐
│   Nginx     │ ← Reverse Proxy (Port 80)
└──────┬──────┘
       │
┌──────▼──────┐
│ API Gateway │ ← Request routing & authentication
└──────┬──────┘
       │
       ├─────────┬──────────┬─────────────┐
       │         │          │             │
  ┌────▼───┐ ┌──▼─────┐ ┌──▼────────┐ ┌─▼────────┐
  │  Auth  │ │  Data  │ │ Analysis  │ │   UI     │
  │Service │ │Service │ │  Service  │ │(React)   │
  └────────┘ └────┬───┘ └─────┬─────┘ └──────────┘
                  │           │
            ┌─────▼─────┐ ┌───▼────┐
            │PostgreSQL │ │ Ollama │
            └───────────┘ └────────┘
```

### Services

- **Frontend (React/TypeScript)**: Modern SPA with Zustand state management
- **API Gateway (Go)**: Request routing, rate limiting, and middleware
- **Auth Service (Go)**: User authentication and JWT token management
- **Data Service (Go)**: Portfolio and holdings CRUD operations
- **Analysis Service (Python)**: AI-powered stock analysis and market data integration
- **PostgreSQL**: Primary data store with UUID-based schemas
- **Redis**: Session caching and performance optimization
- **Ollama**: Local AI model hosting (llama2)

## Prerequisites

Before installing Natols, ensure your system has:

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Git** for repository cloning
- Minimum **8GB RAM** (16GB recommended for AI analysis)
- **20GB free disk space** for Docker images and AI models
- **Ubuntu 20.04+**, Debian 11+, or similar Linux distribution

## Installation

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/natols.git
   cd natols
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Alpha Vantage API key and other settings
   nano .env
   ```

3. **Run the automated installer**:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

4. **Access the platform**:
   - Open your browser to `http://your-server-ip`
   - Create an account and start managing your portfolios

### Manual Installation

If you prefer manual setup or need to customize the deployment:

1. **Set up environment variables**:
   ```bash
   export ALPHA_VANTAGE_API_KEY="your_api_key_here"
   export JWT_SECRET="your_secure_jwt_secret"
   export POSTGRES_PASSWORD="your_secure_db_password"
   ```

2. **Pull and start Ollama** (required for AI analysis):
   ```bash
   docker pull ollama/ollama
   docker run -d --name ollama -v ollama:/root/.ollama -p 11434:11434 ollama/ollama
   docker exec -it ollama ollama pull llama2
   ```

3. **Build and start all services**:
   ```bash
   docker-compose up -d --build
   ```

4. **Verify all services are running**:
   ```bash
   docker-compose ps
   ```

5. **Initialize the database**:
   ```bash
   docker-compose exec data-service ./migrate
   ```

## Configuration

### Environment Variables

Key environment variables in your `.env` file:

```env
# API Keys
ALPHA_VANTAGE_API_KEY=your_api_key_here

# Security
JWT_SECRET=your_secure_random_string_here
JWT_EXPIRY=24h

# Database
POSTGRES_USER=natols
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=natols

# Redis
REDIS_PASSWORD=your_redis_password

# Services
API_GATEWAY_PORT=8080
AUTH_SERVICE_PORT=8081
DATA_SERVICE_PORT=8082
ANALYSIS_SERVICE_PORT=8083
```

### Obtaining an Alpha Vantage API Key

1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free API key (supports 25 requests/day)
3. For higher usage, consider a premium tier
4. Add the key to your `.env` file

## Usage

### Creating Your First Portfolio

1. **Register an account**: Navigate to the registration page and create your user account
2. **Log in**: Use your credentials to access the dashboard
3. **Create a portfolio**: Click "New Portfolio" and give it a name
4. **Add holdings**: 
   - Click on your portfolio
   - Add stocks with ticker symbols (e.g., AAPL, GOOGL, TSLA)
   - Enter quantity and purchase price
5. **View analysis**: Click "Analyze" on any holding to get AI-powered insights

### AI Analysis Features

The Analysis Service provides comprehensive stock analysis including:

- **Investment Recommendation**: Buy, Hold, or Sell with confidence percentage
- **Price Targets**: Short-term and long-term price projections
- **Dividend Analysis**: Current yield, payout ratio, and sustainability
- **Technical Indicators**: RSI, MACD, moving averages, support/resistance levels
- **Risk Assessment**: Volatility metrics and beta calculations
- **Market Context**: Sector performance and comparative analysis

## Development

### Running in Development Mode

For active development with hot-reloading:

```bash
# Start backend services
docker-compose -f docker-compose.dev.yml up

# In a separate terminal, start the frontend
cd frontend
npm install
npm run dev
```

### Project Structure

```
natols/
├── frontend/                 # React TypeScript UI
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   └── store/           # Zustand state management
│   └── package.json
├── api-gateway/             # Go API Gateway
│   ├── main.go
│   └── middleware/
├── auth-service/            # Go Authentication Service
│   ├── main.go
│   └── handlers/
├── data-service/            # Go Data Management Service
│   ├── main.go
│   ├── handlers/
│   └── migrations/
├── analysis-service/        # Python AI Analysis Service
│   ├── app.py
│   ├── analysis.py
│   └── requirements.txt
├── docker-compose.yml       # Production orchestration
├── install.sh               # Automated installer
└── README.md
```

### Running Tests

```bash
# Backend services (Go)
cd api-gateway && go test ./...
cd auth-service && go test ./...
cd data-service && go test ./...

# Analysis service (Python)
cd analysis-service && pytest

# Frontend
cd frontend && npm test
```

## Troubleshooting

### Common Issues

**Services won't start**:
```bash
# Check service logs
docker-compose logs [service-name]

# Restart all services
docker-compose down
docker-compose up -d
```

**AI analysis not working**:
```bash
# Verify Ollama is running
docker ps | grep ollama

# Check if llama2 model is downloaded
docker exec -it ollama ollama list

# Re-pull the model if needed
docker exec -it ollama ollama pull llama2
```

**Database connection errors**:
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify database initialization
docker-compose exec postgres psql -U natols -d natols -c "\dt"
```

**Frontend can't connect to backend**:
- Verify all services are running: `docker-compose ps`
- Check nginx configuration and logs: `docker-compose logs nginx`
- Ensure firewall allows traffic on port 80

## Security Considerations

- **Change default passwords**: Update all default passwords in `.env` before deployment
- **Use HTTPS**: Configure SSL/TLS certificates for production (use Let's Encrypt)
- **Firewall configuration**: Restrict access to only necessary ports
- **Regular updates**: Keep Docker images and dependencies updated
- **API key protection**: Never commit `.env` files to version control
- **Network isolation**: Consider running on a private network or VPN

## Performance Optimization

- **Redis caching**: Enabled by default for session management and API responses
- **Database indexing**: UUID-based primary keys with optimized queries
- **AI model caching**: Ollama maintains model in memory for faster analysis
- **Rate limiting**: API Gateway implements rate limits to prevent abuse

## Backup and Recovery

```bash
# Backup database
docker-compose exec postgres pg_dump -U natols natols > backup.sql

# Backup volumes
docker run --rm -v natols_postgres_data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/postgres_backup.tar.gz /data

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U natols natols
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Alpha Vantage** for financial market data API
- **Ollama** for local AI model hosting
- **Open source community** for the excellent tools and libraries

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation in the `/docs` folder
- Review the troubleshooting section above

---

**Built with ❤️ for self-hosted financial independence**
