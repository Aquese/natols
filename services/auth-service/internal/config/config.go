package config

import (
	"os"
)

type Config struct {
	ServerPort  string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBSSLMode   string
	JWTSecret   string
	JWTExpiry   string
	Environment string
}

func LoadConfig() *Config {
	return &Config{
		ServerPort:  getEnv("SERVER_PORT", "8081"),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "natols_user"),
		DBPassword:  getEnv("DB_PASSWORD", "natols_password"),
		DBName:      getEnv("DB_NAME", "natols_db"),
		DBSSLMode:   getEnv("DB_SSLMODE", "disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-this"),
		JWTExpiry:   getEnv("JWT_EXPIRY", "24h"),
		Environment: getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
