package router

import (
	"auth-service/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRouter(authHandler *handlers.AuthHandler) *gin.Engine {
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// Auth routes
	auth := r.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	return r
}
