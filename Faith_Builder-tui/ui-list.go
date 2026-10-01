package main

import (
	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
)

func updateListMaterials(m model, msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		m.successMsg = ""
		
		if m.list.FilterState() == list.Filtering {
			break
		}

		switch msg.String() {
		case "enter":
			item := m.list.SelectedItem()
			if item == nil {
				m.successMsg = "No materials available to read."
				return m, nil
			}
			if i, ok := item.(Material); ok {
				m.activeMaterial = i
				m.state = stateReadMaterial
				m.viewport.SetContent(renderMaterial(m.activeMaterial, m.viewport.Width))
				m.viewport.GotoTop()
			}
			return m, nil

		case "l", "L":
			item := m.list.SelectedItem()
			if item == nil {
				m.successMsg = "No material selected to link verses."
				return m, nil
			}
			if i, ok := item.(Material); ok {
				m.materialID = i.ID
				m.state = stateLinkVerse
				m.textInput.Focus()
				return m, textinput.Blink
			}
			return m, nil

		case "n", "N":
			if m.currentPage < m.totalPages {
				m.isLoading = true
				m.loadingText = "Loading next page..."
				return m, fetchMaterialsCmd(m.currentPage + 1)
			}
			return m, nil
		}
	}

	m.list, cmd = m.list.Update(msg)
	return m, cmd
}