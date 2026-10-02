package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

func fetchMaterialsCmd(page int) tea.Cmd {
	return func() tea.Msg {
		reqURL := fmt.Sprintf("%s/materials/records?page=%d&perPage=20&expand=verses", AppConfig.PocketbaseURL, page)
		resp, err := http.Get(reqURL)
		if err != nil {
			return errMsg{err}
		}
		defer resp.Body.Close()

		var data PbMaterialResult
		if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
			return errMsg{err}
		}

		return materialsFetchedMsg{
			materials:  data.Items,
			page:       data.Page,
			totalPages: data.TotalPages,
		}
	}
}

func debounceCmd(id int, query string) tea.Cmd {
	return func() tea.Msg {
		time.Sleep(300 * time.Millisecond)
		return debounceMsg{id: id, query: query}
	}
}

func searchVerses(query string) tea.Cmd {
    return func() tea.Msg {
        // Update the filter to search the new verse_key field
        filter := fmt.Sprintf(`verse_key ~ "%s"`, query)
        reqURL := fmt.Sprintf("%s/verses/records?perPage=5&filter=%s", AppConfig.PocketbaseURL, url.QueryEscape(filter))

        resp, err := http.Get(reqURL)
        if err != nil {
            return errMsg{err}
        }
        defer resp.Body.Close()

        body, err := io.ReadAll(resp.Body)
        if err != nil {
            return errMsg{err}
        }

        var data PbListResult
        if err := json.Unmarshal(body, &data); err != nil {
            return errMsg{err}
        }

        return searchResultMsg{results: data.Items}
    }
}

func linkVerseCmd(materialID, verseID, verseKey string) tea.Cmd {
    return func() tea.Msg {
        payload := map[string]string{"verses+": verseID}
        body, err := json.Marshal(payload)
        if err != nil {
            return errMsg{err}
        }

        reqURL := fmt.Sprintf("%s/materials/records/%s", AppConfig.PocketbaseURL, materialID)
        req, err := http.NewRequest(http.MethodPatch, reqURL, bytes.NewReader(body))
        if err != nil {
            return errMsg{err}
        }
        req.Header.Set("Content-Type", "application/json")

        resp, err := http.DefaultClient.Do(req)
        if err != nil {
            return errMsg{err}
        }
        defer resp.Body.Close()

        if resp.StatusCode >= 400 {
            errBody, _ := io.ReadAll(resp.Body)
            return errMsg{fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(errBody))}
        }

        // Still passing it to verseLinkedMsg which expects verseRef
        return verseLinkedMsg{verseRef: verseKey}
    }
}