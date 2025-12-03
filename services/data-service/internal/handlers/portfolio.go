// services/data-service/internal/handlers/portfolio.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

type PortfolioHandler struct {
	db *sql.DB
}

func NewPortfolioHandler(db *sql.DB) *PortfolioHandler {
	return &PortfolioHandler{db: db}
}

type Portfolio struct {
	ID          string  `json:"id"`
	UserID      string  `json:"user_id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	TotalValue  float64 `json:"total_value"`
	TotalCost   float64 `json:"total_cost"`
	TotalGain   float64 `json:"total_gain"`
	GainPercent float64 `json:"gain_percent"`
}

type Holding struct {
	ID           string  `json:"id"`
	PortfolioID  string  `json:"portfolio_id"`
	Symbol       string  `json:"symbol"`
	Quantity     float64 `json:"quantity"`
	AverageCost  float64 `json:"average_cost"`
	TotalCost    float64 `json:"total_cost"`
	CurrentPrice float64 `json:"current_price"`
	MarketValue  float64 `json:"market_value"`
	Gain         float64 `json:"gain"`
	GainPercent  float64 `json:"gain_percent"`
}

func (h *PortfolioHandler) GetPortfolios(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, `{"error":"User ID not found"}`, http.StatusUnauthorized)
		return
	}

	rows, err := h.db.Query(`
		SELECT id, user_id, name, description, total_value
		FROM portfolios
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
		http.Error(w, `{"error":"Database error"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var portfolios []Portfolio
	for rows.Next() {
		var p Portfolio
		err := rows.Scan(&p.ID, &p.UserID, &p.Name, &p.Description, &p.TotalValue)
		if err != nil {
			http.Error(w, `{"error":"Error reading data"}`, http.StatusInternalServerError)
			return
		}
		h.calculatePortfolioValue(&p)
		portfolios = append(portfolios, p)
	}

	if portfolios == nil {
		portfolios = []Portfolio{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolios)
}

func (h *PortfolioHandler) GetPortfolio(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	portfolioID := vars["id"]

	var p Portfolio
	err := h.db.QueryRow(`
		SELECT id, user_id, name, description, total_value
		FROM portfolios
		WHERE id = $1
	`, portfolioID).Scan(&p.ID, &p.UserID, &p.Name, &p.Description, &p.TotalValue)

	if err == sql.ErrNoRows {
		http.Error(w, `{"error":"Portfolio not found"}`, http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, `{"error":"Database error"}`, http.StatusInternalServerError)
		return
	}

	h.calculatePortfolioValue(&p)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func (h *PortfolioHandler) CreatePortfolio(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		http.Error(w, `{"error":"User ID not found"}`, http.StatusUnauthorized)
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	var portfolioID string
	err := h.db.QueryRow(`
		INSERT INTO portfolios (user_id, name, description)
		VALUES ($1, $2, $3)
		RETURNING id
	`, userID, req.Name, req.Description).Scan(&portfolioID)

	if err != nil {
		http.Error(w, `{"error":"Failed to create portfolio"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      portfolioID,
		"message": "Portfolio created successfully",
	})
}

func (h *PortfolioHandler) GetHoldings(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	portfolioID := vars["id"]

	rows, err := h.db.Query(`
		SELECT 
			id, portfolio_id, symbol, quantity, average_cost, current_price,
			total_cost, current_value, gain_loss, gain_loss_pct
		FROM holdings
		WHERE portfolio_id = $1
		ORDER BY symbol
	`, portfolioID)

	if err != nil {
		http.Error(w, `{"error":"Database error"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var holdings []Holding
	for rows.Next() {
		var h Holding
		err := rows.Scan(
			&h.ID,
			&h.PortfolioID,
			&h.Symbol,
			&h.Quantity,
			&h.AverageCost,
			&h.CurrentPrice,
			&h.TotalCost,
			&h.MarketValue,
			&h.Gain,
			&h.GainPercent,
		)
		if err != nil {
			http.Error(w, `{"error":"Error reading data"}`, http.StatusInternalServerError)
			return
		}
		holdings = append(holdings, h)
	}

	if holdings == nil {
		holdings = []Holding{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(holdings)
}

func (h *PortfolioHandler) AddHolding(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	portfolioID := vars["id"]

	var req struct {
		Symbol   string  `json:"symbol"`
		Quantity float64 `json:"quantity"`
		Price    float64 `json:"price"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Check if holding already exists
	var existingQty, existingAvg sql.NullFloat64
	err := h.db.QueryRow(`
		SELECT quantity, average_cost FROM holdings
		WHERE portfolio_id = $1 AND symbol = $2
	`, portfolioID, req.Symbol).Scan(&existingQty, &existingAvg)

	if err == sql.ErrNoRows {
		// Create new holding with current_price set to purchase price
		_, err = h.db.Exec(`
			INSERT INTO holdings (portfolio_id, symbol, quantity, average_cost, current_price)
			VALUES ($1, $2, $3, $4, $4)
		`, portfolioID, req.Symbol, req.Quantity, req.Price)
	} else if err == nil {
		// Update existing holding
		totalCost := (existingQty.Float64 * existingAvg.Float64) + (req.Quantity * req.Price)
		newQty := existingQty.Float64 + req.Quantity
		newAvg := totalCost / newQty

		_, err = h.db.Exec(`
			UPDATE holdings
			SET quantity = $1, average_cost = $2, current_price = $2, updated_at = CURRENT_TIMESTAMP
			WHERE portfolio_id = $3 AND symbol = $4
		`, newQty, newAvg, portfolioID, req.Symbol)
	}

	if err != nil {
		http.Error(w, `{"error":"Failed to add holding"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (h *PortfolioHandler) calculatePortfolioValue(p *Portfolio) {
	rows, err := h.db.Query(`
		SELECT 
			quantity,
			average_cost,
			current_price
		FROM holdings
		WHERE portfolio_id = $1
	`, p.ID)

	if err != nil {
		return
	}
	defer rows.Close()

	var totalCost, totalValue float64
	for rows.Next() {
		var qty, avgCost, currentPrice float64
		rows.Scan(&qty, &avgCost, &currentPrice)

		totalCost += qty * avgCost
		totalValue += qty * currentPrice
	}

	p.TotalCost = totalCost
	p.TotalValue = totalValue
	p.TotalGain = totalValue - totalCost
	if totalCost > 0 {
		p.GainPercent = (p.TotalGain / totalCost) * 100
	}
}

func (h *PortfolioHandler) DeletePortfolio(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	portfolioID := vars["id"]

	_, err := h.db.Exec(`DELETE FROM portfolios WHERE id = $1`, portfolioID)
	if err != nil {
		http.Error(w, `{"error":"Failed to delete portfolio"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Portfolio deleted"})
}

func (h *PortfolioHandler) DeleteHolding(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	holdingID := vars["holding_id"]

	_, err := h.db.Exec(`DELETE FROM holdings WHERE id = $1`, holdingID)
	if err != nil {
		http.Error(w, `{"error":"Failed to delete holding"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Holding deleted"})
}
