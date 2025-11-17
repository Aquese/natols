package config

import (
	"os"
	"time"
)

type Config struct {
	ServerAddress string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	JWTSecret     string
	JWTExpiry     time.Duration
	Environment   string
}

func LoadConfig() *Config {
	jwtExpiry := getEnv("JWT_EXPIRY", "24h")
	duration, err := time.ParseDuration(jwtExpiry)
	if err != nil {
		duration = 24 * time.Hour
	}

	return &Config{
		ServerAddress: getEnv("APP_HOST", "0.0.0.0") + ":" + getEnv("APP_PORT", "8081"),
		DBHost:        getEnv("POSTGRES_HOST", "localhost"),
		DBPort:        getEnv("POSTGRES_PORT", "5432"),
		DBUser:        getEnv("POSTGRES_USER", "natols"),
		DBPassword:    getEnv("POSTGRES_PASSWORD", "password"),
		DBName:        getEnv("POSTGRES_DB", "natols"),
		JWTSecret:     getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		JWTExpiry:     duration,
		Environment:   getEnv("APP_ENV", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
