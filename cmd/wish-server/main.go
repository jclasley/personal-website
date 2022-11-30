// Package wish-server contains an SSH server implementation powered by wish.
//
// The server allows a user to connect via ssh and browse my blog posts in a prettified
// markdown format.
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os/signal"
	"syscall"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/wish"
	bm "github.com/charmbracelet/wish/bubbletea"
	lm "github.com/charmbracelet/wish/logging"
	"github.com/gliderlabs/ssh"
	"github.com/jclasley/personal-website/internal/model"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		<-ctx.Done()
		stop()
	}()

	cfg := GetConfig()

	srv, err := wish.NewServer(
		wish.WithAddress(fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)),
		wish.WithHostKeyPath(".ssh/term_info_ed25519"),
		wish.WithMiddleware(bm.Middleware(bubbleteaHandler), lm.Middleware()))

	if err != nil {
		log.Printf("failed to create server: %s\n", err.Error())
		return
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil {
			if !errors.Is(err, ssh.ErrServerClosed) {
				log.Printf("unexpected server error: %s\n", err.Error())
			}
		}
	}()

	<-ctx.Done()

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	fmt.Println("shutting down server")
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("unexpected server shutdown error: %s\n", err.Error())
	}
}

func bubbleteaHandler(s ssh.Session) (tea.Model, []tea.ProgramOption) {
	m := model.NewReaderModel()
	return m, []tea.ProgramOption{tea.WithAltScreen()}
}
