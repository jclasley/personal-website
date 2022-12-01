package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"text/tabwriter"
	"time"

	"github.com/davidmdm/muxter"
)

type proxyWriter struct {
	http.ResponseWriter
	code int
}

func (p *proxyWriter) WriteHeader(code int) {
	p.code = code
	p.ResponseWriter.WriteHeader(code)
}

func (p *proxyWriter) Code() int {
	if p.code == 0 {
		return 200
	}
	return p.code
}

func Logger(dst io.Writer, composer LogComposer) muxter.Middleware {
	return func(h muxter.Handler) muxter.Handler {
		return muxter.HandlerFunc(func(w http.ResponseWriter, r *http.Request, c muxter.Context) {
			p := proxyWriter{ResponseWriter: w, code: 0}

			start := time.Now()

			h.ServeHTTPx(&p, r, c)

			fmt.Fprintln(dst, composer(LogOpts{
				Method:     r.Method,
				Path:       r.URL.Path,
				StatusCode: p.Code(),
				Duration:   time.Since(start),
			}))
		})
	}
}

type LogOpts struct {
	Method     string
	Path       string
	StatusCode int
	Duration   time.Duration
}

type LogComposer func(opts LogOpts) string

func DefaultLogComposer(opts LogOpts) string {
	// TODO: prettify

	var buf bytes.Buffer

	tw := tabwriter.NewWriter(&buf, 8, 8, 1, '\t', 0)

	body := fmt.Sprintf("[%s]\t%s\t\tcode: %d\t%s", opts.Method, opts.Path, opts.StatusCode, opts.Duration)

	if _, err := tw.Write([]byte(body)); err != nil {
		// TODO: handle
		panic(err)
	}
	if err := tw.Flush(); err != nil {
		// TODO: handle
		panic(err)
	}

	return buf.String()
}
