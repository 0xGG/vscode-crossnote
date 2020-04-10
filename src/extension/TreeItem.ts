import * as vscode from "vscode";
import { Notebook } from "./crossnote";

export enum CrossnoteSectionType {
  Notebook = "Notebook",
  Notes = "Notes",
  Today = "Today",
  Todo = "Todo",
  Tagged = "Tagged",
  Untagged = "Untagged",
  Conflicted = "Conflicted",
  Encrypted = "Encrypted",
  Wiki = "Wiki",
  Error = "Error",
}

export class CrossnoteTreeItem extends vscode.TreeItem {
  public notebook: Notebook;
  public type: CrossnoteSectionType;
  public path: string;
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    notebook: Notebook,
    type: CrossnoteSectionType,
    path: string
  ) {
    super(label, collapsibleState);
    this.notebook = notebook;
    this.type = type;
    this.path = path;
  }
}
