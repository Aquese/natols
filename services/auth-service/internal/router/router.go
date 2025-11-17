package router

import (
	"auth-service/internal/config"
	"auth-service/internal/handlers"
	"database/sql"
	"net/http"

	"github.com/gorilla/mux"
)

func NewRouter(cfg *config.Config, db *sql.DB) *mux.Router {
	r := mux.NewRouter()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg)

	// Health check
	r.HandleFunc("/health", authHandler.HealthCheck).Methods("GET")

	// Auth routes
	r.HandleFunc("/auth/register", authHandler.Register).Methods("POST")
	r.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	r.HandleFunc("/auth/profile", authHandler.GetProfile).Methods("GET")

	// CORS middleware
	r.Use(corsMiddleware)

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
