package main

import (
	"encoding/json"
	"os"
)

type Config struct {
	PocketbaseURL string `json:"pocketbase_url"`
}

// Global configuration variable accessible across your package
var AppConfig Config

func LoadConfig() error {
	file, err := os.Open("config.json")
	if err != nil {
		// Fallback default if config.json doesn't exist yet
		AppConfig = Config{
			PocketbaseURL: "http://127.0.0.1:8090/api/collections",
		}
		return nil
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	return decoder.Decode(&AppConfig)
}