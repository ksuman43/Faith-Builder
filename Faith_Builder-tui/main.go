package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	"github.com/charmbracelet/lipgloss"
)

var Version = "v1.2.1"

type Config struct {
	Token    string `json:"token"`
	Identity string `json:"identity"`
}

type Material struct {
	ID        string `json:"id,omitempty"`
	TitleText string `json:"title"`
	Content   string `json:"content"`
	Tags      string `json:"tags"`
	Verses    string `json:"verses"`
}

type VerseRecord struct {
	ID      string `json:"id"`
	Book    string `json:"book"`
	Chapter int    `json:"chapter"`
	Verse   int    `json:"verse"`
	Text    string `json:"text"`
}

type VerseResponse struct {
	Items []VerseRecord `json:"items"`
}

type MaterialResponse struct {
	Items []Material `json:"items"`
}

type item struct {
	title, desc string
}

func (i item) Title() string       { return i.title }
func (i item) Description() string { return i.desc }
func (i item) FilterValue() string { return i.title }

type state int

const (
	stateLogin state = iota
	stateMenu
	stateReader
	stateSearch
	stateDraft
)

type Model struct {
	state        state
	token        string
	emailInput   textinput.Model
	passInput    textinput.Model
	searchInput  textinput.Model
	draftTitle   textinput.Model
	draftVerses  textinput.Model
	draftTags    textinput.Model
	draftContent textinput.Model
	
	list         list.Model
	viewport     viewport.Model
	verses       []VerseRecord
	materials    []Material
	err          error
}

func getConfigPath() string {
	home, _ := os.UserHomeDir()
	dir := filepath.Join(home, ".config", "faith-builder")
	os.MkdirAll(dir, 0755)
	return filepath.Join(dir, "config.json")
}

func loadConfig() Config {
	var cfg Config
	data, err := os.ReadFile(getConfigPath())
	if err == nil {
		json.Unmarshal(data, &cfg)
	}
	return cfg
}

func saveConfig(cfg Config) {
	data, _ := json.Marshal(cfg)
	os.WriteFile(getConfigPath(), data, 0644)
}

func initialModel() Model {
	cfg := loadConfig()

	emailInput := textinput.New()
	emailInput.Placeholder = "admin@example.com"
	emailInput.Focus()

	passInput := textinput.New()
	passInput.Placeholder = "Password"
	passInput.EchoMode = textinput.EchoPassword

	searchInput := textinput.New()
	searchInput.Placeholder = "Search local verses (e.g. grace)"

	draftTitle := textinput.New()
	draftTitle.Placeholder = "Study Title"

	draftVerses := textinput.New()
	draftVerses.Placeholder = "Linked Verses (e.g. Romans 8:1)"

	draftTags := textinput.New()
	draftTags.Placeholder = "Tags (comma separated)"

	draftContent := textinput.New()
	draftContent.Placeholder = "Markdown content..."

	initialState := stateLogin
	if cfg.Token != "" {
		initialState = stateMenu
	}

	l := list.New([]list.Item{}, list.NewDefaultDelegate(), 0, 0)
	l.Title = "Faith Builder TUI (" + Version + ")"

	vp := viewport.New(80, 20)

	return Model{
		state:        initialState,
		token:        cfg.Token,
		emailInput:   emailInput,
		passInput:    passInput,
		searchInput:  searchInput,
		draftTitle:   draftTitle,
		draftVerses:  draftVerses,
		draftTags:    draftTags,
		draftContent: draftContent,
		list:         l,
		viewport:     vp,
	}
}

func (m Model) Init() tea.Cmd {
	return textinput.Blink
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			if m.state == stateMenu {
				return m, tea.Quit
			}
		}
	case tea.WindowSizeMsg:
		m.list.SetSize(msg.Width, msg.Height-4)
		m.viewport.Width = msg.Width
		m.viewport.Height = msg.Height - 4
	}

	switch m.state {
	case stateLogin:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			if msg.String() == "enter" {
				if m.emailInput.Focused() {
					m.emailInput.Blur()
					m.passInput.Focus()
					return m, textinput.Blink
				} else {
					payload := map[string]string{
						"identity": m.emailInput.Value(),
						"password": m.passInput.Value(),
					}
					body, _ := json.Marshal(payload)
					resp, err := http.Post("http://127.0.0.1:8090/api/collections/_superusers/auth-with-password", "application/json", bytes.NewBuffer(body))
					if err != nil {
						m.err = err
						return m, nil
					}
					defer resp.Body.Close()

					if resp.StatusCode == 200 {
						var res struct {
							Token string `json:"token"`
						}
						json.NewDecoder(resp.Body).Decode(&res)
						m.token = res.Token
						saveConfig(Config{Token: m.token, Identity: m.emailInput.Value()})
						m.state = stateMenu
						return m, nil
					} else {
						m.err = fmt.Errorf("auth failed with status: %d", resp.StatusCode)
					}
				}
			}
		}
		var cmds [2]tea.Cmd
		m.emailInput, cmds[0] = m.emailInput.Update(msg)
		m.passInput, cmds[1] = m.passInput.Update(msg)
		return m, tea.Batch(cmds[:]...)

	case stateMenu:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "s":
				m.state = stateSearch
				m.searchInput.Focus()
				return m, textinput.Blink
			case "m":
				req, _ := http.NewRequest("GET", "http://127.0.0.1:8090/api/collections/materials/records", nil)
				req.Header.Set("Authorization", m.token)
				client := &http.Client{}
				resp, err := client.Do(req)
				if err == nil {
					defer resp.Body.Close()
					var mRes MaterialResponse
					json.NewDecoder(resp.Body).Decode(&mRes)
					m.materials = mRes.Items
					var items []list.Item
					for _, mat := range m.materials {
						items = append(items, item{title: mat.TitleText, desc: mat.Tags})
					}
					m.list.SetItems(items)
				}
			case "n":
				m.state = stateDraft
				m.draftTitle.Focus()
				return m, textinput.Blink
			}
		}
		m.list, cmd = m.list.Update(msg)
		return m, cmd

	case stateSearch:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			if msg.String() == "enter" {
				query := m.searchInput.Value()
				urlStr := fmt.Sprintf("http://127.0.0.1:8090/api/collections/verses/records?filter=(text~'%s')&perPage=50", query)
				req, _ := http.NewRequest("GET", urlStr, nil)
				req.Header.Set("Authorization", m.token)
				client := &http.Client{}
				resp, err := client.Do(req)
				if err == nil {
					defer resp.Body.Close()
					var vRes VerseResponse
					json.NewDecoder(resp.Body).Decode(&vRes)
					m.verses = vRes.Items
					var items []list.Item
					for _, v := range m.verses {
						items = append(items, item{title: fmt.Sprintf("Chapter %d, Verse %d", v.Chapter, v.Verse), desc: v.Text})
					}
					m.list.SetItems(items)
					m.state = stateMenu
				}
			} else if msg.String() == "esc" {
				m.state = stateMenu
			}
		}
		m.searchInput, cmd = m.searchInput.Update(msg)
		return m, cmd

	case stateDraft:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			if msg.String() == "ctrl+s" {
				mat := Material{
					TitleText: m.draftTitle.Value(),
					Verses:    m.draftVerses.Value(),
					Tags:      m.draftTags.Value(),
					Content:   m.draftContent.Value(),
				}
				body, _ := json.Marshal(mat)
				req, _ := http.NewRequest("POST", "http://127.0.0.1:8090/api/collections/materials/records", bytes.NewBuffer(body))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Authorization", m.token)
				client := &http.Client{}
				client.Do(req)
				m.state = stateMenu
				return m, nil
			} else if msg.String() == "esc" {
				m.state = stateMenu
				return m, nil
			} else if msg.String() == "enter" || msg.String() == "tab" {
				if m.draftTitle.Focused() {
					m.draftTitle.Blur()
					m.draftVerses.Focus()
					return m, textinput.Blink
				} else if m.draftVerses.Focused() {
					m.draftVerses.Blur()
					m.draftTags.Focus()
					return m, textinput.Blink
				} else if m.draftTags.Focused() {
					m.draftTags.Blur()
					m.draftContent.Focus()
					return m, textinput.Blink
				}
			}
		}
		var cmd1, cmd2, cmd3, cmd4 tea.Cmd
		m.draftTitle, cmd1 = m.draftTitle.Update(msg)
		m.draftVerses, cmd2 = m.draftVerses.Update(msg)
		m.draftTags, cmd3 = m.draftTags.Update(msg)
		m.draftContent, cmd4 = m.draftContent.Update(msg)
		return m, tea.Batch(cmd1, cmd2, cmd3, cmd4)
	}

	return m, nil
}

func (m Model) View() string {
	switch m.state {
	case stateLogin:
		return lipgloss.NewStyle().Padding(2).Render(
			fmt.Sprintf("Faith Builder TUI (%s)\n\nAdmin Email:\n%s\n\nPassword:\n%s\n\n[Press Enter to Login]", Version, m.emailInput.View(), m.passInput.View()),
		)
	case stateMenu:
		return m.list.View() + "\n[s] Search Verses | [m] Load Materials | [n] New Study Note | [q] Quit"
	case stateSearch:
		return "Search Verses:\n" + m.searchInput.View() + "\n[Press Enter to query local PocketBase]"
	case stateDraft:
		return "New Study Note (Ctrl+S to save, Esc to cancel):\nTitle: " + m.draftTitle.View() + "\nVerses: " + m.draftVerses.View() + "\nTags: " + m.draftTags.View() + "\nContent:\n" + m.draftContent.View()
	}
	return "Loading..."
}

func main() {
	p := tea.NewProgram(initialModel(), tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Printf("Error running TUI: %v\n", err)
		os.Exit(1)
	}
}