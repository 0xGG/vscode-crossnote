import * as vscode from "vscode";
import * as path from "path";
import { CrossnoteTreeItem } from "../extension/TreeItem";
import { createNotesPanelWebviewPanel } from "../extension/NotesPanelWebviewPanel";
import { Message, MessageAction } from "./message";
import { OneDay } from "../util/util";
import { Notebook } from "./notebook";
import { CrossnoteSectionType } from "./section";
import { createEditorPanelWebviewPanel } from "../extension/EditorWebviewPanel";
import { Note } from "./note";

export class Crossnote {
  public notebooks: Notebook[] = [];

  private notesPanelWebviewPanel: vscode.WebviewPanel | undefined;
  private notesPanelWebviewInitialized: boolean = false;
  private editorPanelWebviewPanel: vscode.WebviewPanel | undefined;
  private editorPanelWebviewInitialized: boolean = false;

  private selectedTreeItem: CrossnoteTreeItem | undefined;
  private selectedNote: Note | undefined;

  constructor(private context: vscode.ExtensionContext) {}
  public addNotebook(name: string, dir: string): Notebook {
    let nb = this.notebooks.find((nb) => nb.dir === dir);
    if (!nb) {
      const notebook = new Notebook(name, dir);
      this.notebooks.push(notebook);
      return notebook;
    } else {
      return nb;
    }
  }

  public getNotebookByPath(path: string): Notebook | undefined {
    return this.notebooks.find((nb) => nb.dir === path);
  }

  public refreshNotesPanelWebview() {
    this.openNotesPanelWebview(this.selectedTreeItem);
  }

  private onDidReceiveMessage(message: Message) {
    switch (message.action) {
      case MessageAction.InitializedNotesPanelWebview:
        this.notesPanelWebviewInitialized = true;
        this.sendNotesToNotesPanelWebview();
        break;
      case MessageAction.InitializedEditorPanelWebview:
        this.editorPanelWebviewInitialized = true;
        this.sendNoteToEditorWebviewPanel();
        break;
      case MessageAction.OpenNote:
        this.openEditorPanelWebview(message.data);
        break;
      case MessageAction.OpenNoteIfNoNoteSelected:
        if (!this.selectedNote) {
          this.openEditorPanelWebview(message.data);
        }
        break;
      default:
        break;
    }
  }

  public openNotesPanelWebview(
    selectedTreeItem: CrossnoteTreeItem | undefined
  ) {
    if (!selectedTreeItem) {
      return;
    }
    if (!this.notesPanelWebviewPanel) {
      this.notesPanelWebviewPanel = createNotesPanelWebviewPanel(
        this.context,
        () => {
          this.notesPanelWebviewPanel = undefined;
          this.notesPanelWebviewInitialized = false;
        }
      );
      this.notesPanelWebviewPanel.webview.onDidReceiveMessage(
        this.onDidReceiveMessage.bind(this),
        undefined,
        this.context.subscriptions
      );
    } else {
      this.notesPanelWebviewPanel.reveal(vscode.ViewColumn.One);
    }

    this.selectedTreeItem = selectedTreeItem;
    this.sendNotesToNotesPanelWebview();
  }

  public openEditorPanelWebview(note: Note) {
    if (!this.editorPanelWebviewPanel) {
      this.editorPanelWebviewPanel = createEditorPanelWebviewPanel(
        this.context,
        () => {
          this.editorPanelWebviewPanel = undefined;
          this.editorPanelWebviewInitialized = false;
        }
      );
      this.editorPanelWebviewPanel.webview.onDidReceiveMessage(
        this.onDidReceiveMessage.bind(this),
        undefined,
        this.context.subscriptions
      );
    } else {
      this.editorPanelWebviewPanel.reveal(vscode.ViewColumn.Two);
    }

    this.selectedNote = note;
    this.sendNoteToEditorWebviewPanel();
  }

  private sendNotesToNotesPanelWebview() {
    if (
      !this.selectedTreeItem ||
      !this.notesPanelWebviewPanel ||
      !this.notesPanelWebviewInitialized
    ) {
      return;
    }

    let notes = this.selectedTreeItem.notebook.notes || [];
    if (
      this.selectedTreeItem.type === CrossnoteSectionType.Notes ||
      this.selectedTreeItem.type === CrossnoteSectionType.Notebook
    ) {
      // Do nothing
    } else if (this.selectedTreeItem.type === CrossnoteSectionType.Todo) {
      notes = notes.filter((note) =>
        note.markdown.match(/(\*|-|\d+\.)\s\[(\s+|x|X)\]\s/gm)
      );
    } else if (this.selectedTreeItem.type === CrossnoteSectionType.Today) {
      notes = notes.filter(
        (note) => Date.now() - note.config.modifiedAt.getTime() <= OneDay
      );
    } else if (this.selectedTreeItem.type === CrossnoteSectionType.Tagged) {
      notes = notes.filter(
        (note) => note.config.tags && note.config.tags.length > 0
      );
    } else if (this.selectedTreeItem.type === CrossnoteSectionType.Untagged) {
      notes = notes.filter(
        (note) => note.config.tags && note.config.tags.length === 0
      );
    } else if (this.selectedTreeItem.type === CrossnoteSectionType.Tag) {
      notes = notes.filter((note) => {
        const tags = note.config.tags || [];
        return tags.find(
          (tag) =>
            (tag.toLocaleLowerCase() + "/").indexOf(
              // @ts-ignore
              this.selectedTreeItem.path + "/"
            ) === 0
        );
      });
    } else if (this.selectedTreeItem.type === CrossnoteSectionType.Encrypted) {
      notes = notes.filter((note) => {
        return note.config.encryption;
      });
    } else if (this.selectedTreeItem.type === CrossnoteSectionType.Wiki) {
      // Do nothing here
    } else {
      // CrossnoteSectionType.Directory
      notes = notes.filter(
        // @ts-ignore
        (note) => note.filePath.indexOf(this.selectedTreeItem.path + "/") === 0
      );
    }

    let message: Message = {
      action: MessageAction.SendNotes,
      data: notes,
    };
    this.notesPanelWebviewPanel.webview.postMessage(message);

    message = {
      action: MessageAction.SelectedTreeItem,
      data: {
        path: this.selectedTreeItem.path,
        type: this.selectedTreeItem.type,
        notebook: {
          name: this.selectedTreeItem.notebook.name,
          dir: this.selectedTreeItem.notebook.dir,
        },
      },
    };
    this.notesPanelWebviewPanel.webview.postMessage(message);
  }

  private sendNoteToEditorWebviewPanel() {
    if (
      !this.selectedNote ||
      !this.editorPanelWebviewPanel ||
      !this.editorPanelWebviewInitialized
    ) {
      return;
    }

    let message: Message = {
      action: MessageAction.SendNote,
      data: this.selectedNote,
    };
    this.editorPanelWebviewPanel.title = path.basename(
      this.selectedNote.filePath
    );
    this.editorPanelWebviewPanel.webview.postMessage(message);
  }
}
