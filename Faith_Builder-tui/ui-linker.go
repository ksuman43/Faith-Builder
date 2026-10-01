package main

import (
	"fmt"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

func updateLinkVerse(m model, msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyEsc:
			m.state = stateListMaterials
			m.textInput.Reset()
			m.results = nil
			m.cursor = 0
			return m, nil

		case tea.KeyUp, tea.KeyCtrlK:
			if m.cursor > 0 {
				m.cursor--
			}

		case tea.KeyDown, tea.KeyCtrlJ:
			if m.cursor < len(m.results)-1 {
				m.cursor++
			}

		case tea.KeyEnter:
			if len(m.results) > 0 && m.cursor >= 0 && m.cursor < len(m.results) {
				selected := m.results[m.cursor]
				m.isLoading = true
				m.loadingText = "Linking verse..."
				// Use VerseKey instead of Reference
				return m, linkVerseCmd(m.materialID, selected.ID, selected.VerseKey)
			}
			return m, nil
		}
	}

	m.textInput, cmd = m.textInput.Update(msg)

	// Trigger search if input changed
	if m.textInput.Value() != "" && m.textInput.Value() != m.lastSearch {
		m.lastSearch = m.textInput.Value()
		m.cursor = 0
		return m, tea.Batch(cmd, searchVerses(m.textInput.Value()))
	} else if m.textInput.Value() == "" {
		m.results = nil
		m.lastSearch = ""
	}

	return m, cmd
}

func viewLinkVerse(m model) string {
	s := fmt.Sprintf("\nLink Verse to Material\n\n")
	s += m.textInput.View() + "\n\n"

	if len(m.results) > 0 {
		s += lipgloss.NewStyle().Foreground(lipgloss.Color("241")).Render("Matches (Up/Down to navigate, Enter to link):") + "\n"
		for i, v := range m.results {
			cursor := " "
			style := normalStyle
			if i == m.cursor {
				cursor = ">"
				style = selectedStyle
			}
			// Render VerseKey instead of Reference
			s += style.Render(fmt.Sprintf("%s %s (ID: %s)", cursor, v.VerseKey, v.ID)) + "\n"
		}
	} else if m.textInput.Value() != "" {
		s += normalStyle.Render("No matches found.") + "\n"
	}

	s += "\n(esc to go back)\n"
	return s
}