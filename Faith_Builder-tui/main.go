package main

import (
	"fmt"
	"os"

	"github.com/charmbracelet/bubbles/key"
	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// --- Core Application Model ---
type model struct {
	state sessionState
	ready bool
	currentXRefs []CrossReference

	// Global State
	err         error
	successMsg  string
	spinner     spinner.Model
	isLoading   bool
	loadingText string

	// Material List State
	list        list.Model
	currentPage int
	totalPages  int
	materialID  string // Tracks selected material for linking

	// Read State
	viewport       viewport.Model
	activeMaterial Material // Tracks the material currently being read

	// Link Verse State
	textInput textinput.Model
	lastSearch    string
	results   []Verse
	cursor    int
	searchId  int // Tracks keystrokes for debouncing
}

func initialModel() model {
	ti := textinput.New()
	ti.Placeholder = "Search verse (e.g. Romans 8:28)..."
	ti.CharLimit = 156
	ti.Width = 40

	delegate := list.NewDefaultDelegate()
	delegate.Styles.SelectedTitle = delegate.Styles.SelectedTitle.Foreground(lipgloss.Color("212")).BorderLeftForeground(lipgloss.Color("212")).Bold(true)
	delegate.Styles.SelectedDesc = delegate.Styles.SelectedDesc.Foreground(lipgloss.Color("170")).BorderLeftForeground(lipgloss.Color("212"))
	delegate.Styles.NormalTitle = delegate.Styles.NormalTitle.Foreground(lipgloss.Color("252"))
	delegate.Styles.NormalDesc = delegate.Styles.NormalDesc.Foreground(lipgloss.Color("241"))

	matList := list.New([]list.Item{}, delegate, 0, 0)
	matList.Title = "Faith Builder Materials"
	matList.Styles.Title = lipgloss.NewStyle().Background(lipgloss.Color("62")).Foreground(lipgloss.Color("230")).Padding(0, 1).Bold(true)

	matList.AdditionalShortHelpKeys = func() []key.Binding {
		return []key.Binding{
			key.NewBinding(key.WithKeys("enter"), key.WithHelp("enter", "read material")),
			key.NewBinding(key.WithKeys("l"), key.WithHelp("l", "link verse")),
			key.NewBinding(key.WithKeys("n"), key.WithHelp("n", "load next page")),
		}
	}
	matList.AdditionalFullHelpKeys = matList.AdditionalShortHelpKeys

	s := spinner.New()
	s.Spinner = spinner.Dot
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("212"))

	return model{
		state:       stateListMaterials,
		textInput:   ti,
		list:        matList,
		currentPage: 1,
		totalPages:  1,
		spinner:     s,
		isLoading:   true,
		loadingText: "Fetching materials...",
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(textinput.Blink, m.spinner.Tick, fetchMaterialsCmd(1))
}

// --- Main Update Router ---
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		if msg.Type == tea.KeyCtrlC {
			return m, tea.Quit
		}

	case spinner.TickMsg:
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd

	case tea.WindowSizeMsg:
		h, w := msg.Height, msg.Width
		m.list.SetSize(w, h)

		if !m.ready {
			m.viewport = viewport.New(w, h-4)
			m.ready = true
		} else {
			m.viewport.Width = w
			m.viewport.Height = h - 4
		}

		if m.state == stateReadMaterial && m.activeMaterial.ID != "" {
			m.viewport.SetContent(renderMaterial(m.activeMaterial, m.viewport.Width))
		}
		return m, nil

	case materialsFetchedMsg:
		m.isLoading = false
		m.currentPage = msg.page
		m.totalPages = msg.totalPages

		var newItems []list.Item
		for _, mat := range msg.materials {
			newItems = append(newItems, mat)
		}

		if msg.page == 1 {
			cmd = m.list.SetItems(newItems)
		} else {
			existingItems := m.list.Items()
			existingItems = append(existingItems, newItems...)
			cmd = m.list.SetItems(existingItems)
		}
		return m, cmd

	case errMsg:
		m.isLoading = false
		m.err = msg.err
		return m, nil
	}

	// Delegate to specific files based on state
	switch m.state {
	case stateListMaterials:
		return updateListMaterials(m, msg)
	case stateReadMaterial:
		return updateReadMaterial(m, msg)
	case stateLinkVerse:
		return updateLinkVerse(m, msg)
	}

	return m, cmd
}

// --- Main View Router ---
func (m model) View() string {
	if m.err != nil {
		return errorStyle.Render(fmt.Sprintf("Error: %v\n\nPress Ctrl+C to quit.", m.err))
	}

	if m.isLoading {
		return fmt.Sprintf("\n\n   %s %s\n\n", m.spinner.View(), lipgloss.NewStyle().Foreground(lipgloss.Color("241")).Render(m.loadingText))
	}

	switch m.state {
	case stateListMaterials:
		if m.successMsg != "" {
			return successStyle.Render(m.successMsg) + "\n\n" + m.list.View()
		}
		return m.list.View()

	case stateReadMaterial:
		if !m.ready {
			return "\n  Initializing..."
		}
		var title string
		if i, ok := m.list.SelectedItem().(Material); ok {
			title = i.TitleText
		}
		header := lipgloss.NewStyle().Foreground(lipgloss.Color("62")).Bold(true).Render("Reading: " + title)
		footer := lipgloss.NewStyle().Foreground(lipgloss.Color("241")).Render("↑/↓: Scroll | Esc/q: Back")
		return fmt.Sprintf("%s\n\n%s\n\n%s", header, m.viewport.View(), footer)

	case stateLinkVerse:
		return viewLinkVerse(m)
	}

	return "Unknown state"
}

func main() {
	if err := LoadConfig(); err != nil {
		fmt.Printf("Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	p := tea.NewProgram(initialModel(), tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Printf("Alas, there's been an error: %v", err)
		os.Exit(1)
	}
}