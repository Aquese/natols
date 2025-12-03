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

	// Apply middleware
	r.Use(middleware.LoggingMiddleware)
	r.Use(middleware.CORSMiddleware)

	// Stock routes
	stocks := r.PathPrefix("/stocks").Subrouter()
	stocks.HandleFunc("", stockHandler.SearchStocks).Methods("GET")
	stocks.HandleFunc("/{symbol}", stockHandler.GetStock).Methods("GET")
	stocks.HandleFunc("/{symbol}/history", stockHandler.GetStockPrices).Methods("GET")
	stocks.HandleFunc("/{symbol}", stockHandler.UpdateStock).Methods("PUT")

	// Portfolio routes
	portfolios := r.PathPrefix("/portfolios").Subrouter()
	portfolios.HandleFunc("", portfolioHandler.GetPortfolios).Methods("GET")
	portfolios.HandleFunc("", portfolioHandler.CreatePortfolio).Methods("POST")
	portfolios.HandleFunc("/{id}", portfolioHandler.GetPortfolio).Methods("GET")
	portfolios.HandleFunc("/{id}", portfolioHandler.DeletePortfolio).Methods("DELETE")
	portfolios.HandleFunc("/{id}/holdings", portfolioHandler.GetHoldings).Methods("GET")
	portfolios.HandleFunc("/{id}/holdings", portfolioHandler.AddHolding).Methods("POST")
	portfolios.HandleFunc("/{id}/holdings/{holding_id}", portfolioHandler.DeleteHolding).Methods("DELETE")

	return r
}
