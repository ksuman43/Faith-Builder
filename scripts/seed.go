package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// Match this to your PocketBase verses schema
type VersePayload struct {
	Reference string `json:"reference"`
}

func main() {
	fmt.Println("Reading verses.json...")
	file, err := os.ReadFile("verses.json")
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		os.Exit(1)
	}

	var verses []VersePayload
	if err := json.Unmarshal(file, &verses); err != nil {
		fmt.Printf("Error parsing JSON: %v\n", err)
		os.Exit(1)
	}

	url := "http://127.0.0.1:8090/api/collections/verses/records"
	client := &http.Client{}

	for _, v := range verses {
		body, _ := json.Marshal(v)
		req, err := http.NewRequest("POST", url, bytes.NewReader(body))
		if err != nil {
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("❌ Network error inserting %s\n", v.Reference)
			continue
		}
		
		if resp.StatusCode >= 400 {
			fmt.Printf("❌ Failed to insert %s (HTTP %d)\n", v.Reference, resp.StatusCode)
		} else {
			fmt.Printf("✅ Inserted: %s\n", v.Reference)
		}
		resp.Body.Close()
	}
	fmt.Println("Import complete!")
}