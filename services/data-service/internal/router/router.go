// services/data-service/internal/router/router.go
package router

import (
	"database/sql"
	"net/http"

	"github.com/Aquese/natols/data-service/internal/config"
	"github.com/Aquese/natols/data-service/internal/handlers"
	"github.com/Aquese/natols/data-service/internal/middleware"
	"github.com/gorilla/mux"
)

func NewRouter(cfg *config.Config, db *sql.DB) *mux.Router {
	r := mux.NewRouter()

	// Health check
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy"}`))
	}).Methods("GET")

	// Initialize handlers
	stockHandler := handlers.NewStockHandler(db)
	portfolioHandler := handlers.NewPortfolioHandler(db)

	// API v1 routes
	api := r.PathPrefix("/api/v1").Subrouter()

	// Apply middleware
	api.Use(middleware.LoggingMiddleware)
	api.Use(middleware.CORSMiddleware)

	// Stock routes
	stocks := api.PathPrefix("/stocks").Subrouter()
	stocks.HandleFunc("", stockHandler.SearchStocks).Methods("GET")
	stocks.HandleFunc("/{symbol}", stockHandler.GetStock).Methods("GET")
	stocks.HandleFunc("/{symbol}/prices", stockHandler.GetStockPrices).Methods("GET")
	stocks.HandleFunc("/{symbol}", stockHandler.UpdateStock).Methods("PUT")

	// Portfolio routes (require authentication in production)
	portfolios := api.PathPrefix("/portfolios").Subrouter()
	portfolios.HandleFunc("", portfolioHandler.GetPortfolios).Methods("GET")
	portfolios.HandleFunc("", portfolioHandler.CreatePortfolio).Methods("POST")
	portfolios.HandleFunc("/{id}", portfolioHandler.GetPortfolio).Methods("GET")
	portfolios.HandleFunc("/{id}/holdings", portfolioHandler.GetHoldings).Methods("GET")
	portfolios.HandleFunc("/{id}/holdings", portfolioHandler.AddHolding).Methods("POST")

	return r
}
