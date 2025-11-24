package models

import "time"

type Holding struct {
	ID           string    `json:"id"`
	PortfolioID  string    `json:"portfolio_id"`
	Symbol       string    `json:"symbol"`
	Quantity     float64   `json:"quantity"`
	AverageCost  float64   `json:"average_cost"`
	CurrentPrice float64   `json:"current_price"`
	TotalCost    float64   `json:"total_cost"`
	CurrentValue float64   `json:"current_value"`
	GainLoss     float64   `json:"gain_loss"`
	GainLossPct  float64   `json:"gain_loss_pct"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateHoldingRequest struct {
	Symbol      string  `json:"symbol"`
	Quantity    float64 `json:"quantity"`
	AverageCost float64 `json:"average_cost"`
}

type UpdateHoldingRequest struct {
	Quantity    float64 `json:"quantity"`
	AverageCost float64 `json:"average_cost"`
}

type Transaction struct {
	ID        string    `json:"id"`
	HoldingID string    `json:"holding_id"`
	Type      string    `json:"type"` // buy, sell
	Quantity  float64   `json:"quantity"`
	Price     float64   `json:"price"`
	Total     float64   `json:"total"`
	Fees      float64   `json:"fees"`
	Notes     string    `json:"notes"`
	Date      time.Time `json:"date"`
	CreatedAt time.Time `json:"created_at"`
}
