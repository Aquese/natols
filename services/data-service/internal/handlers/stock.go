// services/data-service/internal/handlers/stock.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

type StockHandler struct {
	db *sql.DB
}

func NewStockHandler(db *sql.DB) *StockHandler {
	return &StockHandler{db: db}
}

// Stock represents stock data
type Stock struct {
	Symbol        string    `json:"symbol"`
	Name          string    `json:"name"`
	LastPrice     float64   `json:"last_price"`
	Change        float64   `json:"change"`
	ChangePercent float64   `json:"change_percent"`
	Volume        int64     `json:"volume"`
	MarketCap     int64     `json:"market_cap"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// StockPrice represents historical price data
type StockPrice struct {
	ID        int       `json:"id"`
	Symbol    string    `json:"symbol"`
	Date      time.Time `json:"date"`
	Open      float64   `json:"open"`
	High      float64   `json:"high"`
	Low       float64   `json:"low"`
	Close     float64   `json:"close"`
	Volume    int64     `json:"volume"`
	CreatedAt time.Time `json:"created_at"`
}

// GetStock retrieves current stock information
func (h *StockHandler) GetStock(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	symbol := vars["symbol"]

	var stock Stock
	err := h.db.QueryRow(`
		SELECT symbol, name, last_price, change, change_percent, volume, market_cap, updated_at
		FROM stocks
		WHERE symbol = $1
	`, symbol).Scan(
		&stock.Symbol,
		&stock.Name,
		&stock.LastPrice,
		&stock.Change,
		&stock.ChangePercent,
		&stock.Volume,
		&stock.MarketCap,
		&stock.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Stock not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stock)
}

// GetStockPrices retrieves historical prices for a stock
func (h *StockHandler) GetStockPrices(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	symbol := vars["symbol"]

	// Get query parameters for date range
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	query := `
		SELECT id, symbol, date, open, high, low, close, volume, created_at
		FROM stock_prices
		WHERE symbol = $1
	`
	args := []interface{}{symbol}

	if startDate != "" {
		query += " AND date >= $2"
		args = append(args, startDate)
	}
	if endDate != "" {
		query += " AND date <= $" + string(rune(len(args)+1))
		args = append(args, endDate)
	}

	query += " ORDER BY date DESC LIMIT 365"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var prices []StockPrice
	for rows.Next() {
		var price StockPrice
		err := rows.Scan(
			&price.ID,
			&price.Symbol,
			&price.Date,
			&price.Open,
			&price.High,
			&price.Low,
			&price.Close,
			&price.Volume,
			&price.CreatedAt,
		)
		if err != nil {
			http.Error(w, "Error reading data", http.StatusInternalServerError)
			return
		}
		prices = append(prices, price)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prices)
}

// SearchStocks searches for stocks by symbol or name
func (h *StockHandler) SearchStocks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	rows, err := h.db.Query(`
		SELECT symbol, name, last_price, change, change_percent, volume, market_cap, updated_at
		FROM stocks
		WHERE symbol ILIKE $1 OR name ILIKE $1
		LIMIT 20
	`, "%"+query+"%")

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var stocks []Stock
	for rows.Next() {
		var stock Stock
		err := rows.Scan(
			&stock.Symbol,
			&stock.Name,
			&stock.LastPrice,
			&stock.Change,
			&stock.ChangePercent,
			&stock.Volume,
			&stock.MarketCap,
			&stock.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Error reading data", http.StatusInternalServerError)
			return
		}
		stocks = append(stocks, stock)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stocks)
}

// UpdateStock updates stock data (typically called by a background job)
func (h *StockHandler) UpdateStock(w http.ResponseWriter, r *http.Request) {
	var stock Stock
	if err := json.NewDecoder(r.Body).Decode(&stock); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(`
		INSERT INTO stocks (symbol, name, last_price, change, change_percent, volume, market_cap, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (symbol) DO UPDATE SET
			name = EXCLUDED.name,
			last_price = EXCLUDED.last_price,
			change = EXCLUDED.change,
			change_percent = EXCLUDED.change_percent,
			volume = EXCLUDED.volume,
			market_cap = EXCLUDED.market_cap,
			updated_at = EXCLUDED.updated_at
	`, stock.Symbol, stock.Name, stock.LastPrice, stock.Change, stock.ChangePercent, stock.Volume, stock.MarketCap, time.Now())

	if err != nil {
		http.Error(w, "Failed to update stock", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
