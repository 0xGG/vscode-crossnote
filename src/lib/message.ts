import { Note } from "./note";
import { SelectedSection } from "./section";
import { TagNode } from "./notebook";

export enum MessageAction {
  SelectedSection = "SelectedSection",
  SetSelectedSection = "SetSelectedSection",
  SelectedNote = "SelectedNote",
  SendNotes = "SendNotes",
  InitializedNotesPanelWebview = "InitializedNotesPanelWebview",
  InitializedEditorPanelWebview = "InitializedEditorPanelWebview",
  CreateNewNote = "CreateNewNote",
  CreatedNewNote = "CreatedNewNote",
  OpenNote = "OpenNote",
  OpenNoteIfNoNoteSelected = "OpenNoteIfNoNoteSelected",
  SendNote = "SendNote",
  UpdateNote = "UpdateNote",
  UpdatedNote = "UpdatedNote",
  SendNotebookTagNode = "SendNotebookTagNode",
  DeleteNote = "DeleteNote",
  ChangeNoteFilePath = "ChangeNoteFilePath",
  DuplicateNote = "DuplicateNote",
  OpenURL = "OpenURL",
}

export interface SendNotesMessage {
  action: MessageAction.SendNotes;
  data: Note[];
}

export interface SelectedSectionMessage {
  action: MessageAction.SelectedSection;
  data: SelectedSection;
}

export interface SetSelectedSectionMessage {
  action: MessageAction.SetSelectedSection;
  data: SelectedSection;
}

export interface SelectedNoteMessage {
  action: MessageAction.SelectedNote;
  data: Note;
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

export interface CreatedNewNoteMessage {
  action: MessageAction.CreatedNewNote;
  data: Note;
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

export interface UpdateNoteMessage {
  action: MessageAction.UpdateNote;
  data: {
    note: Note;
    markdown: string;
    password: string;
  };
}

export interface UpdatedNoteMessage {
  action: MessageAction.UpdatedNote;
  data: Note;
}

export interface SendNotebookTagNodeMessage {
  action: MessageAction.SendNotebookTagNode;
  data: TagNode | undefined;
}

export interface DeleteNoteMessage {
  action: MessageAction.DeleteNote;
  data: Note;
}

export interface ChangeNoteFilePathMessage {
  action: MessageAction.ChangeNoteFilePath;
  data: {
    note: Note;
    newFilePath: string;
  };
}

export interface DuplicateNoteMessage {
  action: MessageAction.DuplicateNote;
  data: Note;
}

export interface OpenURLMessage {
  action: MessageAction.OpenURL;
  data: {
    note: Note;
    url: string;
  };
}

export type Message =
  | SendNotesMessage
  | SelectedSectionMessage
  | SetSelectedSectionMessage
  | SelectedNoteMessage
  | InitializedNotesPanelWebviewMessage
  | InitializedEditorPanelWebviewMessage
  | CreateNewNoteMessage
  | CreatedNewNoteMessage
  | OpenNoteMessage
  | OpenNoteIfNoNoteSelected
  | SendNoteMessage
  | UpdateNoteMessage
  | UpdatedNoteMessage
  | SendNotebookTagNodeMessage
  | DeleteNoteMessage
  | ChangeNoteFilePathMessage
  | DuplicateNoteMessage
  | OpenURLMessage;
