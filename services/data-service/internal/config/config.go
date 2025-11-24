package config

import "os"

type Config struct {
	ServerAddress string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	DBSSLMode     string
	StockAPIKey   string
	StockAPIURL   string
	Environment   string
}

func LoadConfig() *Config {
	return &Config{
		ServerAddress: getEnv("APP_HOST", "0.0.0.0") + ":" + getEnv("APP_PORT", "8082"),
		DBHost:        getEnv("POSTGRES_HOST", "localhost"),
		DBPort:        getEnv("POSTGRES_PORT", "5432"),
		DBUser:        getEnv("POSTGRES_USER", "natols"),
		DBPassword:    getEnv("POSTGRES_PASSWORD", "password"),
		DBName:        getEnv("POSTGRES_DB", "natols"),
		DBSSLMode:     getEnv("DB_SSLMODE", "disable"),
		StockAPIKey:   getEnv("STOCK_API_KEY", ""),
		StockAPIURL:   getEnv("STOCK_API_URL", "https://www.alphavantage.co/query"),
		Environment:   getEnv("APP_ENV", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
