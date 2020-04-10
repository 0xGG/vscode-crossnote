export enum MessageAction {
  SelectedTreeItem = "SelectedTreeItem",
  InitializedNotes = "InitializedNotes",
  InitializedNotesPanelWebview = "InitializedNotesPanelWebview",
  CreateNewNote = "CreateNewNote",
}
export interface Message {
  action: MessageAction;
  data: any;
}
