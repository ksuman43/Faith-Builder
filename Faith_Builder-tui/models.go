package main

import "fmt"

// --- Enums ---
type sessionState int

const (
    stateListMaterials sessionState = iota
    stateReadMaterial
    stateLinkVerse
)

// --- Data Structs ---
type PbMaterialResult struct {
    Page       int        `json:"page"`
    TotalPages int        `json:"totalPages"`
    TotalItems int        `json:"totalItems"`
    Items      []Material `json:"items"`
}

type Material struct {
    ID        string `json:"id"`
    TitleText string `json:"title"`
    Content   string `json:"content"`
    Expand    struct {
        Verses []Verse `json:"verses"`
    } `json:"expand,omitempty"`
}

// Material implements list.Item
func (m Material) Title() string { return m.TitleText }
func (m Material) Description() string {
    if len(m.Expand.Verses) > 0 {
        return fmt.Sprintf("%d verses linked", len(m.Expand.Verses))
    }
    return "No verses linked"
}
func (m Material) FilterValue() string { return m.TitleText }

type PbListResult struct {
    Items []Verse `json:"items"`
}

type Verse struct {
    ID       string `json:"id"`
    VerseKey string `json:"verse_key"`
}
// --- Bubble Tea Messages ---
type materialsFetchedMsg struct {
    materials  []Material
    page       int
    totalPages int
}
type searchResultMsg struct{ results []Verse }
type verseLinkedMsg struct{ verseRef string }
type errMsg struct{ err error }
type debounceMsg struct {
    id    int
    query string
}