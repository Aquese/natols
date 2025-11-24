package models

import "time"

type Portfolio struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Currency    string    `json:"currency"`
	TotalValue  float64   `json:"total_value"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreatePortfolioRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Currency    string `json:"currency"`
}

type UpdatePortfolioRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type PortfolioWithHoldings struct {
	Portfolio
	Holdings []Holding `json:"holdings"`
}
