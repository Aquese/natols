package models

import "time"

type Stock struct {
	ID          string    `json:"id"`
	Symbol      string    `json:"symbol"`
	Name        string    `json:"name"`
	Exchange    string    `json:"exchange"`
	Currency    string    `json:"currency"`
	Type        string    `json:"type"` // stock, etf, crypto
	LastUpdated time.Time `json:"last_updated"`
	CreatedAt   time.Time `json:"created_at"`
}

type StockPrice struct {
	ID        string    `json:"id"`
	StockID   string    `json:"stock_id"`
	Symbol    string    `json:"symbol"`
	Date      time.Time `json:"date"`
	Open      float64   `json:"open"`
	High      float64   `json:"high"`
	Low       float64   `json:"low"`
	Close     float64   `json:"close"`
	Volume    int64     `json:"volume"`
	CreatedAt time.Time `json:"created_at"`
}

type StockQuote struct {
	Symbol        string    `json:"symbol"`
	Price         float64   `json:"price"`
	Change        float64   `json:"change"`
	ChangePercent float64   `json:"change_percent"`
	Volume        int64     `json:"volume"`
	MarketCap     float64   `json:"market_cap,omitempty"`
	PERatio       float64   `json:"pe_ratio,omitempty"`
	High52Week    float64   `json:"high_52week,omitempty"`
	Low52Week     float64   `json:"low_52week,omitempty"`
	LastUpdated   time.Time `json:"last_updated"`
}

type StockSearchRequest struct {
	Query string `json:"query"`
}

type StockHistoryRequest struct {
	Symbol    string `json:"symbol"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}
