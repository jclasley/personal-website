package model

import tea "github.com/charmbracelet/bubbletea"

type ReaderModel struct {
	Posts []Post
}

func NewReaderModel() ReaderModel {
	// TODO: load posts from disk

	return ReaderModel{}
}

func (rm ReaderModel) Init() tea.Cmd {
	return nil
}

func (rm ReaderModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return rm, tea.Quit
		}
	}

	return rm, nil
}

func (rm ReaderModel) View() string {
	if len(rm.Posts) == 0 {
		return "No posts yet!"
	}
	return ""
}
