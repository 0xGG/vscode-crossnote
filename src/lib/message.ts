import { Note } from "./note";
import { SelectedSection } from "./section";

export enum MessageAction {
  SelectedTreeItem = "SelectedTreeItem",
  SendNotes = "SendNotes",
  InitializedNotesPanelWebview = "InitializedNotesPanelWebview",
  InitializedEditorPanelWebview = "InitializedEditorPanelWebview",
  CreateNewNote = "CreateNewNote",
  OpenNote = "OpenNote",
  OpenNoteIfNoNoteSelected = "OpenNoteIfNoNoteSelected",
  SendNote = "SendNote",
}

export interface SendNotesMessage {
  action: MessageAction.SendNotes;
  data: Note[];
}

export interface SelectedTreeItemMessage {
  action: MessageAction.SelectedTreeItem;
  data: SelectedSection;
}

export interface InitializedNotesPanelWebviewMessage {
  action: MessageAction.InitializedNotesPanelWebview;
  data: any;
}

export interface InitializedEditorPanelWebviewMessage {
  action: MessageAction.InitializedEditorPanelWebview;
  data: any;
}

export interface CreateNewNoteMessage {
  action: MessageAction.CreateNewNote;
  data: SelectedSection;
}

export interface OpenNoteMessage {
  action: MessageAction.OpenNote;
  data: Note;
}

export interface OpenNoteIfNoNoteSelected {
  action: MessageAction.OpenNoteIfNoNoteSelected;
  data: Note;
}

export interface SendNoteMessage {
  action: MessageAction.SendNote;
  data: Note;
}

export type Message =
  | SendNotesMessage
  | SelectedTreeItemMessage
  | InitializedNotesPanelWebviewMessage
  | InitializedEditorPanelWebviewMessage
  | CreateNewNoteMessage
  | OpenNoteMessage
  | OpenNoteIfNoNoteSelected
  | SendNoteMessage;
