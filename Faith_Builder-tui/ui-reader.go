package main

import (
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/glamour"
    "github.com/charmbracelet/lipgloss"
)

func renderMaterial(mat Material, width int) string {
    var versesHeader string
    if len(mat.Expand.Verses) > 0 {
        refs := ""
        for idx, v := range mat.Expand.Verses {
            if idx > 0 {
                refs += ", "
            }
            refs += v.VerseKey
        }
        versesHeader = lipgloss.NewStyle().Foreground(lipgloss.Color("42")).Render("Linked Verses: "+refs) + "\n\n"
    } else {
        versesHeader = lipgloss.NewStyle().Foreground(lipgloss.Color("241")).Render("No verses linked.") + "\n\n"
    }

    renderer, err := glamour.NewTermRenderer(
        glamour.WithAutoStyle(),
        glamour.WithWordWrap(width-2),
    )

    renderedContent := mat.Content
    if err == nil {
        if out, renderErr := renderer.Render(mat.Content); renderErr == nil {
            renderedContent = out
        }
    }

    return versesHeader + renderedContent
}

func updateReadMaterial(m model, msg tea.Msg) (tea.Model, tea.Cmd) {
    var cmd tea.Cmd
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "esc", "q":
            m.state = stateListMaterials
            return m, nil
        }
    }
    m.viewport, cmd = m.viewport.Update(msg)
    return m, cmd
}

s += "\n\n" + lipgloss.NewStyle().Bold(true).Render("Cross References:") + "\n"
if len(m.currentXRefs) > 0 {
    for _, xref := range m.currentXRefs {
        s += fmt.Sprintf("• %s -> %s (Votes: %d)\n", xref.SourceKey, xref.TargetKey, xref.Votes)
    }
} else {
    s += "No cross-references found for this material.\n"
}