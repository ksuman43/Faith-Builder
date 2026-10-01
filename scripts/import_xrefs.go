package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	pbURL       = "http://127.0.0.1:8090/api/collections"
	workerCount = 50
)

type XrefPayload struct {
	SourceVerse string `json:"source_verse"`
	TargetVerse string `json:"target_verse"`
	Votes       int    `json:"votes"`
}

type PbListResponse struct {
	TotalPages int `json:"totalPages"`
	Items      []struct {
		ID       string `json:"id"`
		VerseKey string `json:"verse_key"`
	} `json:"items"`
}

func main() {
	fmt.Println("1. Caching verses from PocketBase...")
	verseMap := buildVerseCache()
	fmt.Printf("Cached %d verses in memory.\n", len(verseMap))

	fmt.Println("2. Reading CSV file...")
	file, err := os.Open("cross_references.csv")
	if err != nil {
		panic(fmt.Errorf("failed to open CSV: %v", err))
	}
	defer file.Close()

	reader := csv.NewReader(file)
	// Skip header line
	if _, err := reader.Read(); err != nil {
		panic(err)
	}

	jobs := make(chan XrefPayload, 10000)
	var wg sync.WaitGroup

	httpClient := &http.Client{
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
		},
		Timeout: 10 * time.Second,
	}

	var successCount, failCount int
	var mu sync.Mutex

	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range jobs {
				err := postCrossReference(httpClient, job)
				
				mu.Lock()
				if err != nil {
					failCount++
					// Print the exact reason for the very first failure
					if failCount == 1 {
						fmt.Printf("\n🚨 REJECTION REASON: %v\n\n", err)
					}
				} else {
					successCount++
					if successCount%10000 == 0 {
						fmt.Printf("Inserted %d records...\n", successCount)
					}
				}
				mu.Unlock()
			}
		}()
	}

	fmt.Println("3. Processing rows and dispatching workers...")
	skipped := 0

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		fromKey := strings.ToUpper(record[0])
		toKey := strings.ToUpper(record[1])
		votesStr := record[2]

		sourceID, sourceExists := verseMap[fromKey]
		targetID, targetExists := verseMap[toKey]

		if !sourceExists || !targetExists {
			skipped++
			continue
		}

		votes, _ := strconv.Atoi(votesStr)

		jobs <- XrefPayload{
			SourceVerse: sourceID,
			TargetVerse: targetID,
			Votes:       votes,
		}
	}

	close(jobs)
	wg.Wait()

	fmt.Printf("\nDone! Success: %d | Failed: %d | Skipped (Not found in DB): %d\n", successCount, failCount, skipped)
}

func buildVerseCache() map[string]string {
	cache := make(map[string]string)
	page := 1
	totalPages := 1

	for page <= totalPages {
		reqURL := fmt.Sprintf("%s/verses/records?page=%d&perPage=500&fields=id,verse_key", pbURL, page)
		resp, err := http.Get(reqURL)
		if err != nil {
			panic(fmt.Errorf("failed to fetch verses on page %d: %v", page, err))
		}

		var data PbListResponse
		if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
			resp.Body.Close()
			panic(err)
		}
		resp.Body.Close()

		for _, item := range data.Items {
			cache[item.VerseKey] = item.ID
		}

		totalPages = data.TotalPages
		page++
	}
	return cache
}

func postCrossReference(client *http.Client, payload XrefPayload) error {
	body, _ := json.Marshal(payload)
	req, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/cross_refs/records", pbURL), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		errBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(errBody))
	}
	return nil
}