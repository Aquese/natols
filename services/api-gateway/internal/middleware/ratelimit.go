package middleware

import (
	"api-gateway/internal/config"
	"net/http"
	"sync"
	"time"
)

type visitor struct {
	lastSeen time.Time
	count    int
}

var (
	visitors = make(map[string]*visitor)
	mu       sync.RWMutex
)

func RateLimiter(cfg *config.Config) func(http.Handler) http.Handler {
	// Cleanup old visitors every 5 minutes
	go cleanupVisitors()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr

			mu.Lock()
			v, exists := visitors[ip]
			if !exists {
				visitors[ip] = &visitor{lastSeen: time.Now(), count: 1}
				mu.Unlock()
				next.ServeHTTP(w, r)
				return
			}

			// Reset count if last request was more than 1 minute ago
			if time.Since(v.lastSeen) > time.Minute {
				v.count = 1
				v.lastSeen = time.Now()
				mu.Unlock()
				next.ServeHTTP(w, r)
				return
			}

			// Check rate limit (100 requests per minute)
			if v.count >= 100 {
				mu.Unlock()
				http.Error(w, `{"error":"Rate limit exceeded"}`, http.StatusTooManyRequests)
				return
			}

			v.count++
			v.lastSeen = time.Now()
			mu.Unlock()

			next.ServeHTTP(w, r)
		})
	}
}

func cleanupVisitors() {
	for {
		time.Sleep(5 * time.Minute)
		mu.Lock()
		for ip, v := range visitors {
			if time.Since(v.lastSeen) > 5*time.Minute {
				delete(visitors, ip)
			}
		}
		mu.Unlock()
	}
}
