// Package wish-server creates the ssh server and middlewares for serving
// a bubbletea model over ssh.
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
	cfg := GetConfig()

	srv, err := wish.NewServer(
		wish.WithAddress(fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)),
		wish.WithHostKeyPath(".ssh/term_info_ed25519"),
		wish.WithMiddleware(
			bm.Middleware(teaHandler),
			lm.Middleware(),
		),
	)

	if err != nil {
		panic("failed to create server: " + err.Error())
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		<-ctx.Done()
		stop()
	}()

	go func() {
		fmt.Printf("starting server on %s:%s\n", cfg.Host, cfg.Port)
		if err := srv.ListenAndServe(); err != nil {
			if !errors.Is(err, ssh.ErrServerClosed) {
				log.Printf("unexpected server error: %s\n", err.Error())
			}
		}
	}()

	<-ctx.Done()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	fmt.Println("shutting down server")
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("unexpected server shutdown error: %s\n", err.Error())
	}
}

func teaHandler(_ ssh.Session) (tea.Model, []tea.ProgramOption) {
	return model.NewReader(), nil
}
