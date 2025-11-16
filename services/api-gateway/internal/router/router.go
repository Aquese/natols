package router

import (
	"api-gateway/internal/config"
	"api-gateway/internal/middleware"
	"api-gateway/internal/proxy"
	"net/http"

	"github.com/gorilla/mux"
)

func NewRouter(cfg *config.Config) *mux.Router {
	r := mux.NewRouter()

	// Health check endpoint
	r.HandleFunc("/health", healthCheckHandler).Methods("GET")

	// Setup middleware
	r.Use(middleware.CORS)
	r.Use(middleware.Logging)
	r.Use(middleware.RateLimiter(cfg))

	// Create proxy handler
	proxyHandler := proxy.NewProxyHandler(cfg)

	// Public routes (no auth required)
	public := r.PathPrefix("/api").Subrouter()
	public.HandleFunc("/auth/register", proxyHandler.ProxyToAuth).Methods("POST")
	public.HandleFunc("/auth/login", proxyHandler.ProxyToAuth).Methods("POST")
	public.HandleFunc("/auth/refresh", proxyHandler.ProxyToAuth).Methods("POST")

	// Protected routes (auth required)
	protected := r.PathPrefix("/api").Subrouter()
	protected.Use(middleware.AuthMiddleware(cfg))

	// User routes
	protected.HandleFunc("/users/me", proxyHandler.ProxyToAuth).Methods("GET")
	protected.HandleFunc("/users/me", proxyHandler.ProxyToAuth).Methods("PUT")

	// Stock data routes
	protected.HandleFunc("/stocks", proxyHandler.ProxyToData).Methods("GET")
	protected.HandleFunc("/stocks/{symbol}", proxyHandler.ProxyToData).Methods("GET")
	protected.HandleFunc("/stocks/{symbol}/history", proxyHandler.ProxyToData).Methods("GET")

	// Portfolio routes
	protected.HandleFunc("/portfolios", proxyHandler.ProxyToData).Methods("GET", "POST")
	protected.HandleFunc("/portfolios/{id}", proxyHandler.ProxyToData).Methods("GET", "PUT", "DELETE")
	protected.HandleFunc("/portfolios/{id}/holdings", proxyHandler.ProxyToData).Methods("GET", "POST")

	// Analysis routes
	protected.HandleFunc("/analysis/generate", proxyHandler.ProxyToAnalysis).Methods("POST")
	protected.HandleFunc("/analysis/history", proxyHandler.ProxyToAnalysis).Methods("GET")
	protected.HandleFunc("/analysis/{id}", proxyHandler.ProxyToAnalysis).Methods("GET")

	return r
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy","service":"api-gateway"}`))
}
