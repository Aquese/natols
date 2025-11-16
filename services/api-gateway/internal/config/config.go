package config

import (
	"os"
)

type Config struct {
	ServerAddress      string
	JWTSecret          string
	AuthServiceURL     string
	DataServiceURL     string
	AnalysisServiceURL string
	RedisHost          string
	Environment        string
}

func LoadConfig() *Config {
	return &Config{
		ServerAddress:      getEnv("APP_HOST", "0.0.0.0") + ":" + getEnv("APP_PORT", "8080"),
		JWTSecret:          getEnv("JWT_SECRET", "your-secret-key"),
		AuthServiceURL:     getEnv("AUTH_SERVICE_URL", "http://auth-service:8081"),
		DataServiceURL:     getEnv("DATA_SERVICE_URL", "http://data-service:8082"),
		AnalysisServiceURL: getEnv("ANALYSIS_SERVICE_URL", "http://analysis-service:8083"),
		RedisHost:          getEnv("REDIS_HOST", "redis:6379"),
		Environment:        getEnv("APP_ENV", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
