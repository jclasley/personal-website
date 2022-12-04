package main

import "github.com/kelseyhightower/envconfig"

type Config struct {
	Host string `envconfig:"HOST" default:"localhost"`
	Port string `envconfig:"PORT" default:"23234"`
}

func GetConfig() Config {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		panic(err)
	}
	return cfg
}
