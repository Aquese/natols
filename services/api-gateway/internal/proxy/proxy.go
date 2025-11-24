package proxy

import (
	"api-gateway/internal/config"
	"io"
	"net/http"
	"strings"
)

type ProxyHandler struct {
	cfg *config.Config
}

func NewProxyHandler(cfg *config.Config) *ProxyHandler {
	return &ProxyHandler{cfg: cfg}
}

func (p *ProxyHandler) ProxyToAuth(w http.ResponseWriter, r *http.Request) {
	p.proxyRequest(w, r, p.cfg.AuthServiceURL)
}

func (p *ProxyHandler) ProxyToData(w http.ResponseWriter, r *http.Request) {
	p.proxyRequest(w, r, p.cfg.DataServiceURL)
}

func (p *ProxyHandler) ProxyToAnalysis(w http.ResponseWriter, r *http.Request) {
	p.proxyRequest(w, r, p.cfg.AnalysisServiceURL)
}

func (p *ProxyHandler) proxyRequest(w http.ResponseWriter, r *http.Request, targetURL string) {
	// Strip /api prefix from the path
	path := strings.TrimPrefix(r.URL.Path, "/api")

	// Create new request to backend service
	url := targetURL + path
	if r.URL.RawQuery != "" {
		url += "?" + r.URL.RawQuery
	}

	proxyReq, err := http.NewRequest(r.Method, url, r.Body)
	if err != nil {
		http.Error(w, `{"error":"Failed to create proxy request"}`, http.StatusInternalServerError)
		return
	}

	// Copy headers
	for key, values := range r.Header {
		for _, value := range values {
			proxyReq.Header.Add(key, value)
		}
	}

	// Execute request
	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		http.Error(w, `{"error":"Backend service unavailable"}`, http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// Copy status code
	w.WriteHeader(resp.StatusCode)

	// Copy body
	io.Copy(w, resp.Body)
}
