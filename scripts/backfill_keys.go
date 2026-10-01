package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

const (
	pbURL       = "http://127.0.0.1:8090/api/collections"
	workerCount = 20
)

type PbVerseResponse struct {
	TotalPages int `json:"totalPages"`
	Items      []struct {
		ID       string `json:"id"`
		Chapter  int    `json:"chapter"`
		Verse    int    `json:"verse"`
		VerseKey string `json:"verse_key"`
		Expand   struct {
			Book struct {
				Abbreviation string `json:"abbreviation"`
			} `json:"book"`
		} `json:"expand"`
	} `json:"items"`
}

type UpdatePayload struct {
	VerseKey string `json:"verse_key"`
}

type Job struct {
	ID       string
	VerseKey string
}

func main() {
	fmt.Println("Fetching verses and generating keys...")
	jobs := make(chan Job, 35000)
	var wg sync.WaitGroup

	// Start workers
	httpClient := &http.Client{Timeout: 10 * time.Second}
	var successCount int
	var mu sync.Mutex

	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range jobs {
				body, _ := json.Marshal(UpdatePayload{VerseKey: job.VerseKey})
				req, _ := http.NewRequest(http.MethodPatch, fmt.Sprintf("%s/verses/records/%s", pbURL, job.ID), bytes.NewReader(body))
				req.Header.Set("Content-Type", "application/json")
				
				resp, err := httpClient.Do(req)
				if err == nil && resp.StatusCode == 200 {
					mu.Lock()
					successCount++
					if successCount%5000 == 0 {
						fmt.Printf("Updated %d verses...\n", successCount)
					}
					mu.Unlock()
				}
				if resp != nil {
					resp.Body.Close()
				}
			}
		}()
	}

	// Fetch pages and dispatch jobs
	page := 1
	totalPages := 1
	dispatched := 0

	for page <= totalPages {
		reqURL := fmt.Sprintf("%s/verses/records?page=%d&perPage=500&expand=book", pbURL, page)
		resp, err := http.Get(reqURL)
		if err != nil {
			panic(err)
		}

		var data PbVerseResponse
		if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
			panic(err)
		}
		resp.Body.Close()

		for _, v := range data.Items {
			// Only update if it doesn't already have a key
			if v.VerseKey == "" && v.Expand.Book.Abbreviation != "" {
				generatedKey := strings.ToUpper(fmt.Sprintf("%s.%d.%d", v.Expand.Book.Abbreviation, v.Chapter, v.Verse))
				jobs <- Job{ID: v.ID, VerseKey: generatedKey}
				dispatched++
			}
		}

		totalPages = data.TotalPages
		page++
	}

	close(jobs)
	wg.Wait()
	fmt.Printf("\nDone! Successfully updated %d verses.\n", successCount)
}