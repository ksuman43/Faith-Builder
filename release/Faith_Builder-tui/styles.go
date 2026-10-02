package main

import "github.com/charmbracelet/lipgloss"

var (
    titleStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("62")).Bold(true).MarginBottom(1)
    selectedStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("212")).Bold(true).PaddingLeft(2)
    normalStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("241")).PaddingLeft(4)
    successStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("42")).MarginBottom(1)
    errorStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("9")).MarginTop(1)
)