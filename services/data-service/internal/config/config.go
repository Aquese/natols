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
		ServerAddress: getEnv("APP_HOST", "0.0.0.0") + ":" + getEnv("SERVER_PORT", "8082"),
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBUser:        getEnv("DB_USER", "natols_user"),
		DBPassword:    getEnv("DB_PASSWORD", "natols_password"),
		DBName:        getEnv("DB_NAME", "natols_db"),
		DBSSLMode:     getEnv("DB_SSLMODE", "disable"),
		StockAPIKey:   getEnv("ALPHA_VANTAGE_API_KEY", ""),
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
