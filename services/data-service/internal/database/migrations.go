package database

import (
	"database/sql"
	"log"
)

func RunMigrations(db *sql.DB) error {
	migrations := []string{
		// Enable UUID extension
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

		// Create stocks table
		`CREATE TABLE IF NOT EXISTS stocks (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			symbol VARCHAR(20) UNIQUE NOT NULL,
			name VARCHAR(255) NOT NULL,
			exchange VARCHAR(50),
			currency VARCHAR(10) DEFAULT 'USD',
			type VARCHAR(20) DEFAULT 'stock',
			last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,

		// Create stock_prices table for historical data
		`CREATE TABLE IF NOT EXISTS stock_prices (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
			symbol VARCHAR(20) NOT NULL,
			date DATE NOT NULL,
			open DECIMAL(15,4),
			high DECIMAL(15,4),
			low DECIMAL(15,4),
			close DECIMAL(15,4) NOT NULL,
			volume BIGINT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(stock_id, date)
		);`,

		// Create portfolios table
		`CREATE TABLE IF NOT EXISTS portfolios (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			currency VARCHAR(10) DEFAULT 'USD',
			total_value DECIMAL(20,2) DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,

		// Create holdings table
		`CREATE TABLE IF NOT EXISTS holdings (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
			symbol VARCHAR(20) NOT NULL,
			quantity DECIMAL(15,6) NOT NULL,
			average_cost DECIMAL(15,4) NOT NULL,
			current_price DECIMAL(15,4) DEFAULT 0,
			total_cost DECIMAL(20,2) GENERATED ALWAYS AS (quantity * average_cost) STORED,
			current_value DECIMAL(20,2) GENERATED ALWAYS AS (quantity * current_price) STORED,
			gain_loss DECIMAL(20,2) GENERATED ALWAYS AS ((quantity * current_price) - (quantity * average_cost)) STORED,
			gain_loss_pct DECIMAL(10,4) GENERATED ALWAYS AS (
				CASE 
					WHEN average_cost > 0 THEN ((current_price - average_cost) / average_cost * 100)
					ELSE 0
				END
			) STORED,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(portfolio_id, symbol)
		);`,

		// Create transactions table
		`CREATE TABLE IF NOT EXISTS transactions (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			holding_id UUID REFERENCES holdings(id) ON DELETE CASCADE,
			type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
			quantity DECIMAL(15,6) NOT NULL,
			price DECIMAL(15,4) NOT NULL,
			total DECIMAL(20,2) NOT NULL,
			fees DECIMAL(10,2) DEFAULT 0,
			notes TEXT,
			date TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,

		// Create indexes
		`CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);`,
		`CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date ON stock_prices(symbol, date DESC);`,
		`CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);`,
		`CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_holding_id ON transactions(holding_id);`,

		// Create trigger to update updated_at timestamp for portfolios
		`CREATE OR REPLACE FUNCTION update_updated_at_column()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = CURRENT_TIMESTAMP;
			RETURN NEW;
		END;
		$$ language 'plpgsql';`,

		`DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;`,

		`CREATE TRIGGER update_portfolios_updated_at
		BEFORE UPDATE ON portfolios
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();`,

		`DROP TRIGGER IF EXISTS update_holdings_updated_at ON holdings;`,

		`CREATE TRIGGER update_holdings_updated_at
		BEFORE UPDATE ON holdings
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();`,
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			return err
		}
	}

	log.Println("Database migrations completed successfully")
	return nil
}
