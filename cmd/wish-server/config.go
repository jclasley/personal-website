package main

import (
	"log"

	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	Port string `envconfig:"PORT" default:"23234"`
	Host string `envconfig:"HOST" default:"localhost"`
}

func GetConfig() Config {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatalf("failed to process config: %s", err.Error())
	}
	return cfg
}
