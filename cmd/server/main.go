package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path"
	"time"

	"github.com/davidmdm/muxter"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	go func() {
		<-ctx.Done()
		stop()
	}()

	srv := &http.Server{
		Addr:              ":443",
		Handler:           ServerHandler(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	if _, ok := os.LookupEnv("DEV"); ok {
		srv.Addr = ":8081"
		panic(srv.ListenAndServe())
	}

	go func() {
		fmt.Printf("starting server on port :%s\n", srv.Addr)

		if err := srv.ListenAndServeTLS("./cert.pem", "./key.pem"); err != nil {
			if !errors.Is(err, http.ErrServerClosed) {
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

func ServerHandler() http.Handler {
	mux := muxter.New()

	mux.Use(Logger(os.Stdout, DefaultLogComposer))

	mux.HandleFunc("/", serveHTML)

	return mux
}

func serveHTML(w http.ResponseWriter, r *http.Request, _ muxter.Context) {
	dir := http.FileServer(http.Dir("./out"))

	if r.URL.Path != "/" && path.Ext(r.URL.Path) == "" {
		r.URL.Path += ".html"
	}

	dir.ServeHTTP(w, r)
}
