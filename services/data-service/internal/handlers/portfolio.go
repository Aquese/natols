// services/data-service/internal/handlers/portfolio.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type PortfolioHandler struct {
	db *sql.DB
}

func NewPortfolioHandler(db *sql.DB) *PortfolioHandler {
	return &PortfolioHandler{db: db}
}

// Portfolio response structure
type Portfolio struct {
	ID          int     `json:"id"`
	UserID      int     `json:"user_id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	TotalValue  float64 `json:"total_value"`
	TotalCost   float64 `json:"total_cost"`
	TotalGain   float64 `json:"total_gain"`
	GainPercent float64 `json:"gain_percent"`
}

type Holding struct {
	ID           int     `json:"id"`
	PortfolioID  int     `json:"portfolio_id"`
	Symbol       string  `json:"symbol"`
	Quantity     float64 `json:"quantity"`
	AvgPrice     float64 `json:"avg_price"`
	TotalCost    float64 `json:"total_cost"`
	CurrentPrice float64 `json:"current_price"`
	MarketValue  float64 `json:"market_value"`
	Gain         float64 `json:"gain"`
	GainPercent  float64 `json:"gain_percent"`
}

// GetPortfolios retrieves all portfolios for a user
func (h *PortfolioHandler) GetPortfolios(w http.ResponseWriter, r *http.Request) {
	// In production, get user_id from JWT token
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		http.Error(w, "User ID not found", http.StatusUnauthorized)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	rows, err := h.db.Query(`
		SELECT id, user_id, name, description
		FROM portfolios
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var portfolios []Portfolio
	for rows.Next() {
		var p Portfolio
		err := rows.Scan(&p.ID, &p.UserID, &p.Name, &p.Description)
		if err != nil {
			http.Error(w, "Error reading data", http.StatusInternalServerError)
			return
		}

		// Calculate portfolio value
		h.calculatePortfolioValue(&p)
		portfolios = append(portfolios, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolios)
}

// GetPortfolio retrieves a specific portfolio
func (h *PortfolioHandler) GetPortfolio(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	portfolioID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	var p Portfolio
	err = h.db.QueryRow(`
		SELECT id, user_id, name, description
		FROM portfolios
		WHERE id = $1
	`, portfolioID).Scan(&p.ID, &p.UserID, &p.Name, &p.Description)

	if err == sql.ErrNoRows {
		http.Error(w, "Portfolio not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	h.calculatePortfolioValue(&p)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

// CreatePortfolio creates a new portfolio
func (h *PortfolioHandler) CreatePortfolio(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		http.Error(w, "User ID not found", http.StatusUnauthorized)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var portfolioID int
	err = h.db.QueryRow(`
		INSERT INTO portfolios (user_id, name, description)
		VALUES ($1, $2, $3)
		RETURNING id
	`, userID, req.Name, req.Description).Scan(&portfolioID)

	if err != nil {
		http.Error(w, "Failed to create portfolio", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      portfolioID,
		"message": "Portfolio created successfully",
	})
}

// GetHoldings retrieves all holdings for a portfolio
func (h *PortfolioHandler) GetHoldings(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	portfolioID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	rows, err := h.db.Query(`
		SELECT 
			h.id, h.portfolio_id, h.symbol, h.quantity, h.avg_price,
			s.last_price
		FROM holdings h
		LEFT JOIN stocks s ON h.symbol = s.symbol
		WHERE h.portfolio_id = $1
		ORDER BY h.symbol
	`, portfolioID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var holdings []Holding
	for rows.Next() {
		var h Holding
		var currentPrice sql.NullFloat64
		err := rows.Scan(
			&h.ID,
			&h.PortfolioID,
			&h.Symbol,
			&h.Quantity,
			&h.AvgPrice,
			&currentPrice,
		)
		if err != nil {
			http.Error(w, "Error reading data", http.StatusInternalServerError)
			return
		}

		if currentPrice.Valid {
			h.CurrentPrice = currentPrice.Float64
		}

		// Calculate values
		h.TotalCost = h.Quantity * h.AvgPrice
		h.MarketValue = h.Quantity * h.CurrentPrice
		h.Gain = h.MarketValue - h.TotalCost
		if h.TotalCost > 0 {
			h.GainPercent = (h.Gain / h.TotalCost) * 100
		}

		holdings = append(holdings, h)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(holdings)
}

// AddHolding adds or updates a holding in a portfolio
func (h *PortfolioHandler) AddHolding(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	portfolioID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Symbol   string  `json:"symbol"`
		Quantity float64 `json:"quantity"`
		Price    float64 `json:"price"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check if holding already exists
	var existingQty, existingAvg sql.NullFloat64
	err = h.db.QueryRow(`
		SELECT quantity, avg_price FROM holdings
		WHERE portfolio_id = $1 AND symbol = $2
	`, portfolioID, req.Symbol).Scan(&existingQty, &existingAvg)

	if err == sql.ErrNoRows {
		// Create new holding
		_, err = h.db.Exec(`
			INSERT INTO holdings (portfolio_id, symbol, quantity, avg_price)
			VALUES ($1, $2, $3, $4)
		`, portfolioID, req.Symbol, req.Quantity, req.Price)
	} else if err == nil {
		// Update existing holding (average price calculation)
		totalCost := (existingQty.Float64 * existingAvg.Float64) + (req.Quantity * req.Price)
		newQty := existingQty.Float64 + req.Quantity
		newAvg := totalCost / newQty

		_, err = h.db.Exec(`
			UPDATE holdings
			SET quantity = $1, avg_price = $2, updated_at = CURRENT_TIMESTAMP
			WHERE portfolio_id = $3 AND symbol = $4
		`, newQty, newAvg, portfolioID, req.Symbol)
	}

	if err != nil {
		http.Error(w, "Failed to add holding", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// Helper function to calculate portfolio value
func (h *PortfolioHandler) calculatePortfolioValue(p *Portfolio) {
	rows, err := h.db.Query(`
		SELECT 
			h.quantity,
			h.avg_price,
			COALESCE(s.last_price, 0) as current_price
		FROM holdings h
		LEFT JOIN stocks s ON h.symbol = s.symbol
		WHERE h.portfolio_id = $1
	`, p.ID)

	if err != nil {
		return
	}
	defer rows.Close()

	var totalCost, totalValue float64
	for rows.Next() {
		var qty, avgPrice, currentPrice float64
		rows.Scan(&qty, &avgPrice, &currentPrice)

		totalCost += qty * avgPrice
		totalValue += qty * currentPrice
	}

	p.TotalCost = totalCost
	p.TotalValue = totalValue
	p.TotalGain = totalValue - totalCost
	if totalCost > 0 {
		p.GainPercent = (p.TotalGain / totalCost) * 100
	}
}
