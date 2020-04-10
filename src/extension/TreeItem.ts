import * as vscode from "vscode";
import { Notebook } from "../lib/notebook";
import { CrossnoteSectionType } from "../lib/section";

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
