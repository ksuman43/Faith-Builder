package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/textarea"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// --- Configuration ---
const nltApiKey = "YOUR_NLT_API_KEY_HERE" // <-- Insert your NLT API key here
var Version = "dev"

// --- Styling ---
var (
	titleStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("86")).Bold(true).MarginBottom(1)
	modeStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("205")).Bold(true).MarginBottom(1)
	errorStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("196")).Bold(true)
	successStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("46")).Bold(true)
	helpStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("240")).MarginTop(1)
	contentBox   = lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).BorderForeground(lipgloss.Color("63")).Padding(1, 2)
)

// --- Data Structures ---
type Verse struct {
	Id        string `json:"id"`
	Reference string `json:"reference"`
	Text      string `json:"text"`
}

func (v Verse) Title() string       { return v.Reference }
func (v Verse) Description() string { return v.Text }
func (v Verse) FilterValue() string { return v.Reference }

type Material struct {
	Id        string `json:"id"`
	TitleText string `json:"title"`
	Content   string `json:"content"`
}

func (m Material) Title() string       { return m.TitleText }
func (m Material) Description() string {
	if len(m.Content) > 60 {
		return m.Content[:57] + "..."
	}
	return m.Content
}
func (m Material) FilterValue() string { return m.TitleText }

type CrossReference struct {
	Id           string `json:"id"`
	Reference    string `json:"reference"`
	RelatedVerse string `json:"related_verse"`
}

func (cr CrossReference) Title() string       { return cr.Reference }
func (cr CrossReference) Description() string { return cr.RelatedVerse }
func (cr CrossReference) FilterValue() string { return cr.Reference }

type Bookmark struct {
	Id        string `json:"id"`
	Reference string `json:"reference"`
	Text      string `json:"text"`
}

func (b Bookmark) Title() string       { return b.Reference }
func (b Bookmark) Description() string { return b.Text }
func (b Bookmark) FilterValue() string { return b.Reference }

// --- Responses ---
type PBResponse struct {
	Items []Verse `json:"items"`
}

type MaterialsResponse struct {
	Items []Material `json:"items"`
}

type CrossRefResponse struct {
	Items []CrossReference `json:"items"`
}

type BookmarksResponse struct {
	Items []Bookmark `json:"items"`
}

type AuthResponse struct {
	Token string `json:"token"`
}

type Config struct {
	Token string `json:"token"`
}

// --- Custom Messages ---
type authResultMsg struct {
	token string
	err   error
}

type searchResultMsg struct {
	results []Verse
	err     error
}

type materialsResultMsg struct {
	materials []Material
	err       error
}

type crossRefResultMsg struct {
	crossRefs []CrossReference
	err       error
}

type bookmarksResultMsg struct {
	bookmarks []Bookmark
	err       error
}

type saveResultMsg struct {
	err error
}

type bookmarkResultMsg struct {
	err error
}

// --- Config Helpers ---
func getConfigDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "."
	}
	return filepath.Join(home, ".config", "faith-builder")
}

func saveTokenToFile(token string) error {
	dir := getConfigDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	file := filepath.Join(dir, "config.json")
	data, _ := json.Marshal(Config{Token: token})
	return os.WriteFile(file, data, 0600)
}

func loadTokenFromFile() string {
	file := filepath.Join(getConfigDir(), "config.json")
	data, err := os.ReadFile(file)
	if err != nil {
		return ""
	}
	var cfg Config
	if json.Unmarshal(data, &cfg) != nil {
		return ""
	}
	return cfg.Token
}

// --- Application Model ---
type appMode int

const (
	modeLogin appMode = iota
	modeSearch
	modeEntryTitle
	modeEntryBody
	modeMaterials
	modeMaterialDetail
	modeCrossRefs
	modeBookmarks
)

type model struct {
	mode           appMode
	emailInput     textinput.Model
	passInput      textinput.Model
	searchInput    textinput.Model
	titleInput     textinput.Model
	bodyInput      textarea.Model
	resultsList    list.Model
	materialsList  list.Model
	crossRefsList  list.Model
	bookmarksList  list.Model
	selectedMat    Material
	selectedVerse  Verse
	authToken      string
	loading        bool
	err            error
	successMsg     string
}

func initialModel() model {
	savedToken := loadTokenFromFile()

	initialMode := modeLogin
	if savedToken != "" {
		initialMode = modeSearch
	}

	ei := textinput.New()
	ei.Placeholder = "Admin Email"
	ei.Width = 40
	if savedToken == "" {
		ei.Focus()
	}

	pi := textinput.New()
	pi.Placeholder = "Admin Password"
	pi.EchoMode = textinput.EchoPassword
	pi.EchoCharacter = '•'
	pi.Width = 40

	si := textinput.New()
	si.Placeholder = "Search PB (grace) or use API (nlt John 3:16)"
	si.Width = 50
	if savedToken != "" {
		si.Focus()
	}

	ti := textinput.New()
	ti.Placeholder = "Material Title (e.g., Romans 8 Study)"
	ti.Width = 50

	bi := textarea.New()
	bi.Placeholder = "Enter your study notes here..."
	bi.SetWidth(50)
	bi.SetHeight(8)

	delegate := list.NewDefaultDelegate()
	resultsList := list.New([]list.Item{}, delegate, 80, 20)
	resultsList.SetShowTitle(false)
	resultsList.SetShowStatusBar(false)
	resultsList.SetFilteringEnabled(false)

	materialsList := list.New([]list.Item{}, delegate, 80, 20)
	materialsList.SetShowTitle(false)
	materialsList.SetShowStatusBar(false)
	materialsList.SetFilteringEnabled(false)

	crossRefsList := list.New([]list.Item{}, delegate, 80, 20)
	crossRefsList.SetShowTitle(false)
	crossRefsList.SetShowStatusBar(false)
	crossRefsList.SetFilteringEnabled(false)

	bookmarksList := list.New([]list.Item{}, delegate, 80, 20)
	bookmarksList.SetShowTitle(false)
	bookmarksList.SetShowStatusBar(false)
	bookmarksList.SetFilteringEnabled(false)

	return model{
		mode:          initialMode,
		authToken:     savedToken,
		emailInput:    ei,
		passInput:     pi,
		searchInput:   si,
		titleInput:    ti,
		bodyInput:     bi,
		resultsList:   resultsList,
		materialsList: materialsList,
		crossRefsList: crossRefsList,
		bookmarksList: bookmarksList,
	}
}

func (m model) Init() tea.Cmd {
	return textinput.Blink
}

// --- Update Logic ---
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		h, v := lipgloss.NewStyle().Margin(1, 2).GetFrameSize()
		m.resultsList.SetSize(msg.Width-h, msg.Height-v-10)
		m.materialsList.SetSize(msg.Width-h, msg.Height-v-10)
		m.crossRefsList.SetSize(msg.Width-h, msg.Height-v-10)
		m.bookmarksList.SetSize(msg.Width-h, msg.Height-v-10)

	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC, tea.KeyEsc:
			if m.mode == modeMaterials || m.mode == modeMaterialDetail || m.mode == modeCrossRefs || m.mode == modeBookmarks {
				m.mode = modeSearch
				m.searchInput.Focus()
				return m, nil
			}
			return m, tea.Quit

		case tea.KeyEnter:
			if m.mode == modeLogin {
				if m.emailInput.Value() != "" && m.passInput.Value() != "" {
					m.loading = true
					m.err = nil
					return m, authenticateAdmin(m.emailInput.Value(), m.passInput.Value())
				}
			} else if m.mode == modeSearch {
				if m.searchInput.Focused() {
					query := strings.TrimSpace(m.searchInput.Value())
					if query != "" {
						m.loading = true
						m.err = nil
						m.successMsg = ""
						
						if strings.HasPrefix(strings.ToLower(query), "nlt ") {
							ref := strings.TrimSpace(query[4:])
							return m, fetchNLTVerse(ref, nltApiKey)
						}
						
						return m, searchPocketBase(query)
					}
				} else {
					if item, ok := m.resultsList.SelectedItem().(Verse); ok {
						m.titleInput.SetValue("Study: " + item.Reference)
						m.bodyInput.SetValue(item.Text + "\n\nMy Notes:\n")
						
						m.mode = modeEntryBody
						m.bodyInput.Focus()
						m.bodyInput.CursorEnd()
						return m, nil
					}
				}
			} else if m.mode == modeMaterials {
				if item, ok := m.materialsList.SelectedItem().(Material); ok {
					m.selectedMat = item
					m.mode = modeMaterialDetail
					return m, nil
				}
			} else if m.mode == modeBookmarks {
				if item, ok := m.bookmarksList.SelectedItem().(Bookmark); ok {
					m.titleInput.SetValue("Study: " + item.Reference)
					m.bodyInput.SetValue(item.Text + "\n\nMy Notes:\n")
					
					m.mode = modeEntryBody
					m.bodyInput.Focus()
					m.bodyInput.CursorEnd()
					return m, nil
				}
			}

		case tea.KeyCtrlB:
			if m.mode == modeSearch && !m.searchInput.Focused() {
				if item, ok := m.resultsList.SelectedItem().(Verse); ok {
					m.loading = true
					m.err = nil
					return m, saveBookmark(m.authToken, item.Reference, item.Text)
				}
			}

		case tea.KeyRunes:
			char := msg.String()
			if m.mode == modeSearch && !m.searchInput.Focused() {
				if char == "m" {
					m.loading = true
					m.err = nil
					m.mode = modeMaterials
					return m, fetchMaterials(m.authToken)
				} else if char == "b" {
					m.loading = true
					m.err = nil
					m.mode = modeBookmarks
					return m, fetchBookmarks(m.authToken)
				} else if char == "x" {
					if item, ok := m.resultsList.SelectedItem().(Verse); ok {
						m.selectedVerse = item
						m.loading = true
						m.err = nil
						m.mode = modeCrossRefs
						return m, fetchCrossReferences(item.Reference)
					}
				}
			} else if m.mode == modeSearch && m.searchInput.Focused() {
				if char == "m" {
					m.loading = true
					m.err = nil
					m.mode = modeMaterials
					return m, fetchMaterials(m.authToken)
				} else if char == "b" {
					m.loading = true
					m.err = nil
					m.mode = modeBookmarks
					return m, fetchBookmarks(m.authToken)
				}
			}

		case tea.KeyTab:
			m.successMsg = ""
			m.err = nil
			if m.mode == modeLogin {
				if m.emailInput.Focused() {
					m.emailInput.Blur()
					m.passInput.Focus()
				} else {
					m.passInput.Blur()
					m.emailInput.Focus()
				}
			} else if m.mode == modeSearch {
				if m.searchInput.Focused() {
					m.searchInput.Blur() 
				} else {
					m.mode = modeEntryTitle
					m.titleInput.Focus()
				}
			} else if m.mode == modeEntryTitle {
				m.mode = modeEntryBody
				m.titleInput.Blur()
				m.bodyInput.Focus()
			} else {
				m.mode = modeSearch
				m.bodyInput.Blur()
				m.searchInput.Focus()
			}
			return m, nil

		case tea.KeyCtrlS:
			if (m.mode == modeEntryTitle || m.mode == modeEntryBody) && m.titleInput.Value() != "" {
				m.loading = true
				m.err = nil
				return m, saveMaterial(m.authToken, m.titleInput.Value(), m.bodyInput.Value())
			}
		}

	case authResultMsg:
		m.loading = false
		if msg.err != nil {
			m.err = msg.err
			return m, nil
		}
		saveTokenToFile(msg.token)
		m.authToken = msg.token
		m.mode = modeSearch
		m.emailInput.Blur()
		m.passInput.Blur()
		m.searchInput.Focus()
		return m, nil

	case searchResultMsg:
		m.loading = false
		if msg.err != nil {
			m.err = msg.err
			return m, nil
		}
		items := make([]list.Item, len(msg.results))
		for i, v := range msg.results {
			items[i] = v
		}
		m.resultsList.SetItems(items)
		return m, nil

	case materialsResultMsg:
		m.loading = false
		if msg.err != nil {
			m.err = msg.err
			return m, nil
		}
		items := make([]list.Item, len(msg.materials))
		for i, mat := range msg.materials {
			items[i] = mat
		}
		m.materialsList.SetItems(items)
		return m, nil

	case crossRefResultMsg:
		m.loading = false
		if msg.err != nil {
			m.err = msg.err
			return m, nil
		}
		items := make([]list.Item, len(msg.crossRefs))
		for i, cr := range msg.crossRefs {
			items[i] = cr
		}
		m.crossRefsList.SetItems(items)
		return m, nil

	case bookmarksResultMsg:
		m.loading = false
		if msg.err != nil {
			m.err = msg.err
			return m, nil
		}
		items := make([]list.Item, len(msg.bookmarks))
		for i, b := range msg.bookmarks {
			items[i] = b
		}
		m.bookmarksList.SetItems(items)
		return m, nil

	case saveResultMsg:
		m.loading = false
		if msg.err != nil {
			m.err = msg.err
			return m, nil
		}
		m.successMsg = "Material saved successfully!"
		m.titleInput.SetValue("")
		m.bodyInput.SetValue("")
		m.mode = modeSearch
		m.bodyInput.Blur()
		m.searchInput.Focus()
		return m, nil

	case bookmarkResultMsg:
		m.loading = false
		if msg.err != nil {
			m.err = msg.err
			return m, nil
		}
		m.successMsg = "Verse bookmarked successfully!"
		return m, nil
	}

	switch m.mode {
	case modeLogin:
		if m.emailInput.Focused() {
			m.emailInput, cmd = m.emailInput.Update(msg)
		} else {
			m.passInput, cmd = m.passInput.Update(msg)
		}
	case modeSearch:
		m.searchInput, cmd = m.searchInput.Update(msg)
		cmds = append(cmds, cmd)
		var listCmd tea.Cmd
		m.resultsList, listCmd = m.resultsList.Update(msg)
		cmds = append(cmds, listCmd)
	case modeMaterials:
		var listCmd tea.Cmd
		m.materialsList, listCmd = m.materialsList.Update(msg)
		cmds = append(cmds, listCmd)
	case modeCrossRefs:
		var listCmd tea.Cmd
		m.crossRefsList, listCmd = m.crossRefsList.Update(msg)
		cmds = append(cmds, listCmd)
	case modeBookmarks:
		var listCmd tea.Cmd
		m.bookmarksList, listCmd = m.bookmarksList.Update(msg)
		cmds = append(cmds, listCmd)
	case modeEntryTitle:
		m.titleInput, cmd = m.titleInput.Update(msg)
		cmds = append(cmds, cmd)
	case modeEntryBody:
		m.bodyInput, cmd = m.bodyInput.Update(msg)
		cmds = append(cmds, cmd)
	}

	return m, tea.Batch(cmds...)
}

// --- API Commands ---
func authenticateAdmin(email, password string) tea.Cmd {
	return func() tea.Msg {
		payload, _ := json.Marshal(map[string]string{
			"identity": email,
			"password": password,
		})

		resp, err := http.Post("http://127.0.0.1:8090/api/collections/_superusers/auth-with-password", "application/json", bytes.NewBuffer(payload))
		if err != nil || resp.StatusCode != 200 {
			return authResultMsg{err: fmt.Errorf("authentication failed: invalid credentials")}
		}
		defer resp.Body.Close()

		var authResp AuthResponse
		if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
			return authResultMsg{err: fmt.Errorf("failed to parse auth response")}
		}

		return authResultMsg{token: authResp.Token}
	}
}

func searchPocketBase(query string) tea.Cmd {
	return func() tea.Msg {
		filter := fmt.Sprintf(`text ~ "%s" || reference ~ "%s"`, query, query)
		apiURL := fmt.Sprintf("http://127.0.0.1:8090/api/collections/verses/records?perPage=20&filter=%s", url.QueryEscape(filter))

		req, _ := http.NewRequest("GET", apiURL, nil)
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return searchResultMsg{err: fmt.Errorf("connection failed")}
		}
		defer resp.Body.Close()

		var pbResp PBResponse
		json.NewDecoder(resp.Body).Decode(&pbResp)
		return searchResultMsg{results: pbResp.Items}
	}
}

func fetchMaterials(token string) tea.Cmd {
	return func() tea.Msg {
		apiURL := "http://127.0.0.1:8090/api/collections/materials/records?sort=-created"
		req, _ := http.NewRequest("GET", apiURL, nil)
		req.Header.Set("Authorization", token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != 200 {
			return materialsResultMsg{err: fmt.Errorf("failed to fetch materials (check auth)")}
		}
		defer resp.Body.Close()

		var matResp MaterialsResponse
		json.NewDecoder(resp.Body).Decode(&matResp)
		return materialsResultMsg{materials: matResp.Items}
	}
}

func fetchCrossReferences(reference string) tea.Cmd {
	return func() tea.Msg {
		filter := fmt.Sprintf(`reference ~ "%s"`, reference)
		apiURL := fmt.Sprintf("http://127.0.0.1:8090/api/collections/cross_references/records?filter=%s", url.QueryEscape(filter))

		req, _ := http.NewRequest("GET", apiURL, nil)
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != 200 {
			return crossRefResultMsg{err: fmt.Errorf("failed to fetch cross-references")}
		}
		defer resp.Body.Close()

		var crResp CrossRefResponse
		json.NewDecoder(resp.Body).Decode(&crResp)
		return crossRefResultMsg{crossRefs: crResp.Items}
	}
}

func fetchBookmarks(token string) tea.Cmd {
	return func() tea.Msg {
		apiURL := "http://127.0.0.1:8090/api/collections/bookmarks/records?sort=-created"
		req, _ := http.NewRequest("GET", apiURL, nil)
		req.Header.Set("Authorization", token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != 200 {
			return bookmarksResultMsg{err: fmt.Errorf("failed to fetch bookmarks (check auth/collection)")}
		}
		defer resp.Body.Close()

		var bResp BookmarksResponse
		json.NewDecoder(resp.Body).Decode(&bResp)
		return bookmarksResultMsg{bookmarks: bResp.Items}
	}
}

func fetchNLTVerse(reference string, apiKey string) tea.Cmd {
	return func() tea.Msg {
		if apiKey == "YOUR_NLT_API_KEY_HERE" {
			return searchResultMsg{err: fmt.Errorf("missing NLT API key in main.go")}
		}

		apiURL := fmt.Sprintf("https://api.nlt.to/api/passages?ref=%s&key=%s&version=nlt", url.QueryEscape(reference), apiKey)

		req, _ := http.NewRequest("GET", apiURL, nil)
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return searchResultMsg{err: fmt.Errorf("failed to reach NLT API")}
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			return searchResultMsg{err: fmt.Errorf("NLT API returned error (check reference or API key)")}
		}

		buf := new(bytes.Buffer)
		buf.ReadFrom(resp.Body)
		rawText := buf.String()

		cleanText := html.UnescapeString(rawText)
		re := regexp.MustCompile(`<[^>]*>`)
		cleanText = re.ReplaceAllString(cleanText, "")
		cleanText = strings.TrimSpace(cleanText)

		result := Verse{
			Id:        "nlt-api",
			Reference: reference + " (NLT)",
			Text:      cleanText,
		}

		return searchResultMsg{results: []Verse{result}}
	}
}

func saveMaterial(token, title, body string) tea.Cmd {
	return func() tea.Msg {
		payload, _ := json.Marshal(map[string]string{
			"title":   title,
			"content": body,
		})

		req, _ := http.NewRequest("POST", "http://127.0.0.1:8090/api/collections/materials/records", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != 200 {
			return saveResultMsg{err: fmt.Errorf("failed to save material (check permissions)")}
		}
		defer resp.Body.Close()

		return saveResultMsg{err: nil}
	}
}

func saveBookmark(token, reference, text string) tea.Cmd {
	return func() tea.Msg {
		payload, _ := json.Marshal(map[string]string{
			"reference": reference,
			"text":      text,
		})

		req, _ := http.NewRequest("POST", "http://127.0.0.1:8090/api/collections/bookmarks/records", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != 200 {
			return bookmarkResultMsg{err: fmt.Errorf("failed to save bookmark (check if collection exists)")}
		}
		defer resp.Body.Close()

		return bookmarkResultMsg{err: nil}
	}
}

// --- View Rendering ---
func (m model) View() string {
	s := titleStyle.Render("Faith Builder CLI") + "\n"

	switch m.mode {
	case modeLogin:
		s += modeStyle.Render("Admin Authentication Required") + "\n\n"
		s += "Email:\n" + m.emailInput.View() + "\n\n"
		s += "Password:\n" + m.passInput.View() + "\n\n"
		if m.loading {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("226")).Render("Authenticating...") + "\n"
		} else if m.err != nil {
			s += errorStyle.Render(m.err.Error()) + "\n"
		}
		s += helpStyle.Render("tab: Switch Field • enter: Login • esc: Quit")

	case modeSearch:
		s += modeStyle.Render("Mode: Scripture Search") + "\n"
		s += m.searchInput.View() + "\n\n"

		if m.successMsg != "" {
			s += successStyle.Render(m.successMsg) + "\n"
		}
		if m.loading {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("226")).Render("Searching...") + "\n"
		} else if m.err != nil {
			s += errorStyle.Render(m.err.Error()) + "\n"
		} else if len(m.resultsList.Items()) > 0 {
			s += m.resultsList.View()
		} else if m.searchInput.Value() != "" && !m.loading {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("240")).Render("No verses found.") + "\n"
		}

		if m.searchInput.Focused() {
			s += helpStyle.Render("\ntab: Focus List • b: Bookmarks • m: Materials • esc: Quit")
		} else {
			s += helpStyle.Render("\ntab: Blank • b: Bookmarks • m: Materials • x: Cross-Refs • ctrl+b: Bookmark • esc: Quit")
		}

	case modeMaterials:
		s += modeStyle.Render("Mode: Saved Study Materials") + "\n"
		if m.loading {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("226")).Render("Loading materials...") + "\n"
		} else if m.err != nil {
			s += errorStyle.Render(m.err.Error()) + "\n"
		} else if len(m.materialsList.Items()) > 0 {
			s += m.materialsList.View()
		} else {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("240")).Render("No saved materials found.") + "\n"
		}
		s += helpStyle.Render("\nup/down: Scroll • enter: Read Material • esc: Back to Search")

	case modeMaterialDetail:
		s += modeStyle.Render("Reading: "+m.selectedMat.TitleText) + "\n"
		s += contentBox.Render(m.selectedMat.Content) + "\n"
		s += helpStyle.Render("\nesc: Back to Materials List")

	case modeBookmarks:
		s += modeStyle.Render("Mode: Saved Bookmarks") + "\n"
		if m.loading {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("226")).Render("Loading bookmarks...") + "\n"
		} else if m.err != nil {
			s += errorStyle.Render(m.err.Error()) + "\n"
		} else if len(m.bookmarksList.Items()) > 0 {
			s += m.bookmarksList.View()
		} else {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("240")).Render("No bookmarks found.") + "\n"
		}
		s += helpStyle.Render("\nup/down: Scroll • enter: Draft Material • esc: Back to Search")

	case modeCrossRefs:
		s += modeStyle.Render("Cross-References for: "+m.selectedVerse.Reference) + "\n"
		if m.loading {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("226")).Render("Fetching cross-references...") + "\n"
		} else if m.err != nil {
			s += errorStyle.Render(m.err.Error()) + "\n"
		} else if len(m.crossRefsList.Items()) > 0 {
			s += m.crossRefsList.View()
		} else {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("240")).Render("No cross-references found for this verse.") + "\n"
		}
		s += helpStyle.Render("\nesc: Back to Search")

	case modeEntryTitle, modeEntryBody:
		s += modeStyle.Render("Mode: Add Study Material") + "\n\n"
		s += "Title:\n" + m.titleInput.View() + "\n\n"
		s += "Content:\n" + m.bodyInput.View() + "\n"

		if m.loading {
			s += lipgloss.NewStyle().Foreground(lipgloss.Color("226")).Render("Saving to database...") + "\n"
		} else if m.err != nil {
			s += errorStyle.Render(m.err.Error()) + "\n"
		}
		s += helpStyle.Render("\ntab: Next Field/Search • ctrl+s: Save Record • esc: Quit")
	}

	return s
}

func main() {
	v := flag.Bool("v", false, "Print application version")
	version := flag.Bool("version", false, "Print application version")
	flag.Parse()

	if *v || *version {
		fmt.Printf("Faith Builder CLI version %s\n", Version)
		os.Exit(0)
	}

	p := tea.NewProgram(initialModel(), tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
}