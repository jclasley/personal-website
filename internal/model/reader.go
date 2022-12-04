package model

import tea "github.com/charmbracelet/bubbletea"

type ReaderModel struct {
}

func NewReader() ReaderModel {
	return ReaderModel{}
}

func (m ReaderModel) Init() tea.Cmd {
	return nil
}

func (m ReaderModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		}
	}

	return m, nil
}

func (m ReaderModel) View() string {
	return "Model!!"
}
