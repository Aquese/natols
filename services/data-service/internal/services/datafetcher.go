// services/data-service/internal/services/datafetcher.go
package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type DataFetcher struct {
	db      *sql.DB
	apiKey  string
	baseURL string
	client  *http.Client
}

func NewDataFetcher(db *sql.DB, apiKey string) *DataFetcher {
	return &DataFetcher{
		db:      db,
		apiKey:  apiKey,
		baseURL: "https://www.alphavantage.co/query",
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// AlphaVantageQuote represents the API response structure
type AlphaVantageQuote struct {
	GlobalQuote struct {
		Symbol           string `json:"01. symbol"`
		Price            string `json:"05. price"`
		Change           string `json:"09. change"`
		ChangePercent    string `json:"10. change percent"`
		Volume           string `json:"06. volume"`
		LatestTradingDay string `json:"07. latest trading day"`
	} `json:"Global Quote"`
}

// FetchStockQuote fetches current stock quote from Alpha Vantage
func (df *DataFetcher) FetchStockQuote(symbol string) error {
	url := fmt.Sprintf("%s?function=GLOBAL_QUOTE&symbol=%s&apikey=%s",
		df.baseURL, symbol, df.apiKey)

	resp, err := df.client.Get(url)
	if err != nil {
		return fmt.Errorf("failed to fetch data: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var quote AlphaVantageQuote
	if err := json.Unmarshal(body, &quote); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	// Parse and store the data
	return df.storeQuote(symbol, &quote)
}

// storeQuote stores the fetched quote in the database
func (df *DataFetcher) storeQuote(symbol string, quote *AlphaVantageQuote) error {
	// Parse numeric values
	var price, change, changePercent, volume float64
	fmt.Sscanf(quote.GlobalQuote.Price, "%f", &price)
	fmt.Sscanf(quote.GlobalQuote.Change, "%f", &change)

	// Remove % sign and parse
	changePercentStr := quote.GlobalQuote.ChangePercent
	if len(changePercentStr) > 0 && changePercentStr[len(changePercentStr)-1] == '%' {
		changePercentStr = changePercentStr[:len(changePercentStr)-1]
	}
	fmt.Sscanf(changePercentStr, "%f", &changePercent)
	fmt.Sscanf(quote.GlobalQuote.Volume, "%f", &volume)

	// Insert or update stock data
	_, err := df.db.Exec(`
		INSERT INTO stocks (symbol, last_price, change, change_percent, volume, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (symbol) DO UPDATE SET
			last_price = EXCLUDED.last_price,
			change = EXCLUDED.change,
			change_percent = EXCLUDED.change_percent,
			volume = EXCLUDED.volume,
			updated_at = EXCLUDED.updated_at
	`, symbol, price, change, changePercent, int64(volume), time.Now())

	return err
}

// FetchHistoricalData fetches historical price data
func (df *DataFetcher) FetchHistoricalData(symbol string, outputSize string) error {
	if outputSize == "" {
		outputSize = "compact" // 100 data points
	}

	url := fmt.Sprintf("%s?function=TIME_SERIES_DAILY&symbol=%s&outputsize=%s&apikey=%s",
		df.baseURL, symbol, outputSize, df.apiKey)

	resp, err := df.client.Get(url)
	if err != nil {
		return fmt.Errorf("failed to fetch historical data: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	timeSeries, ok := result["Time Series (Daily)"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid response format")
	}

	// Store historical data
	for dateStr, dataInterface := range timeSeries {
		data := dataInterface.(map[string]interface{})

		date, _ := time.Parse("2006-01-02", dateStr)
		var open, high, low, close, volume float64
		fmt.Sscanf(data["1. open"].(string), "%f", &open)
		fmt.Sscanf(data["2. high"].(string), "%f", &high)
		fmt.Sscanf(data["3. low"].(string), "%f", &low)
		fmt.Sscanf(data["4. close"].(string), "%f", &close)
		fmt.Sscanf(data["5. volume"].(string), "%f", &volume)

		_, err := df.db.Exec(`
			INSERT INTO stock_prices (symbol, date, open, high, low, close, volume)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (symbol, date) DO UPDATE SET
				open = EXCLUDED.open,
				high = EXCLUDED.high,
				low = EXCLUDED.low,
				close = EXCLUDED.close,
				volume = EXCLUDED.volume
		`, symbol, date, open, high, low, close, int64(volume))

		if err != nil {
			return fmt.Errorf("failed to store price data: %w", err)
		}
	}

	return nil
}

// UpdateAllStocks updates all stocks in the watchlist
func (df *DataFetcher) UpdateAllStocks() error {
	rows, err := df.db.Query(`SELECT DISTINCT symbol FROM stocks`)
	if err != nil {
		return err
	}
	defer rows.Close()

	var symbols []string
	for rows.Next() {
		var symbol string
		if err := rows.Scan(&symbol); err != nil {
			continue
		}
		symbols = append(symbols, symbol)
	}

	// Update each stock (with rate limiting for free tier)
	for _, symbol := range symbols {
		if err := df.FetchStockQuote(symbol); err != nil {
			fmt.Printf("Failed to update %s: %v\n", symbol, err)
			continue
		}
		// Alpha Vantage free tier: 5 calls per minute
		time.Sleep(12 * time.Second)
	}

	return nil
}
