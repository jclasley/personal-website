package model

import "time"

type Post struct {
	Title     string
	Body      string
	CreatedAt time.Time
}
