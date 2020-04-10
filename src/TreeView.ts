import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

enum CrossnoteSectionType {
  Notebook = "Notebook",
  Notes = "Notes",
  Today = "Today",
  Todo = "Todo",
  Tagged = "Tagged",
  Untagged = "Untagged",
  Directory = "Directory",
  Tag = "Tag",
  Conflicted = "Conflicted",
  Encrypted = "Encrypted",
  Wiki = "Wiki",
}

class CrossnoteTreeItem extends vscode.TreeItem {
  public type: CrossnoteSectionType;
  public path?: string;
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    type: CrossnoteSectionType,
    path?: string
  ) {
    super(label, collapsibleState);
    this.type = type;
    this.path = path;
  }
}

export class CrossnoteTreeViewProvider
  implements vscode.TreeDataProvider<CrossnoteTreeItem> {
  constructor(
    private workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined
  ) {
    console.log(this.workspaceFolders);
  }

  getTreeItem(element: CrossnoteTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CrossnoteTreeItem): Thenable<CrossnoteTreeItem[]> {
    if (!this.workspaceFolders || !this.workspaceFolders.length) {
      vscode.window.showInformationMessage("Empty");
      return Promise.resolve([]);
    }
    if (element) {
      // Open specific element
      if (element.type === CrossnoteSectionType.Notebook) {
        const treeItems: CrossnoteTreeItem[] = [
          new CrossnoteTreeItem(
            "🗓 " + "Today",
            vscode.TreeItemCollapsibleState.None,
            CrossnoteSectionType.Today,
            "."
          ),
          new CrossnoteTreeItem(
            "☑️ " + "Todo",
            vscode.TreeItemCollapsibleState.None,
            CrossnoteSectionType.Todo,
            "."
          ),
          new CrossnoteTreeItem(
            "🗂️ " + "Notes",
            vscode.TreeItemCollapsibleState.Collapsed,
            CrossnoteSectionType.Notes,
            "."
          ),
          new CrossnoteTreeItem(
            "🏷️ " + "Tagged",
            vscode.TreeItemCollapsibleState.Collapsed,
            CrossnoteSectionType.Tagged,
            "."
          ),
          new CrossnoteTreeItem(
            "🈚 " + "Untagged",
            vscode.TreeItemCollapsibleState.None,
            CrossnoteSectionType.Untagged,
            "."
          ),
          new CrossnoteTreeItem(
            "🔐 " + "Encrypted",
            vscode.TreeItemCollapsibleState.None,
            CrossnoteSectionType.Encrypted,
            "."
          ),
        ];
        return Promise.resolve(treeItems);
      }
      return Promise.resolve([]);
    } else {
      // Read all notebooks
      const treeItems: CrossnoteTreeItem[] = this.workspaceFolders.map(
        (workspaceFolder) => {
          const treeItem = new CrossnoteTreeItem(
            "📔 " + workspaceFolder.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            CrossnoteSectionType.Notebook,
            "."
          );
          return treeItem;
        }
      );

      return Promise.resolve(treeItems);
    }
  }
}
