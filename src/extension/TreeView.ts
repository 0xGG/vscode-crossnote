import * as vscode from "vscode";
import { Crossnote } from "../lib/crossnote";
import { CrossnoteTreeItem } from "./TreeItem";
import { CrossnoteSectionType } from "../lib/section";

export class CrossnoteTreeViewProvider
  implements vscode.TreeDataProvider<CrossnoteTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    CrossnoteTreeItem | undefined
  > = new vscode.EventEmitter<CrossnoteTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<
    CrossnoteTreeItem | undefined
  > = this._onDidChangeTreeData.event;

  constructor(private crossnote: Crossnote) {}

  getTreeItem(element: CrossnoteTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CrossnoteTreeItem): Promise<CrossnoteTreeItem[]> {
    if (!this.crossnote.notebooks.length) {
      vscode.window.showInformationMessage("No notebooks found");
      return [];
    }

    if (element) {
      // Open specific element
      if (element.type === CrossnoteSectionType.Notebook) {
        try {
          const notebook = element.notebook;
          await notebook.initData();
          this.crossnote.refreshNotesPanelWebview();
          const treeItems: CrossnoteTreeItem[] = [
            new CrossnoteTreeItem(
              "📅 " + "Today",
              vscode.TreeItemCollapsibleState.None,
              notebook,
              CrossnoteSectionType.Today,
              "."
            ),
            new CrossnoteTreeItem(
              "☑️ " + "Todo",
              vscode.TreeItemCollapsibleState.None,
              notebook,

              CrossnoteSectionType.Todo,
              "."
            ),
            new CrossnoteTreeItem(
              "📁 " + "Notes",
              notebook.rootDirectory?.children.length
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
              notebook,

              CrossnoteSectionType.Notes,
              "."
            ),
            new CrossnoteTreeItem(
              "🏷️ " + "Tagged",
              notebook.rootTagNode?.children.length
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
              notebook,
              CrossnoteSectionType.Tagged,
              "."
            ),
            new CrossnoteTreeItem(
              "🈚 " + "Untagged",
              vscode.TreeItemCollapsibleState.None,
              notebook,
              CrossnoteSectionType.Untagged,
              "."
            ),
            new CrossnoteTreeItem(
              "🔐 " + "Encrypted",
              vscode.TreeItemCollapsibleState.None,
              notebook,
              CrossnoteSectionType.Encrypted,
              "."
            ),
          ];
          return treeItems;
        } catch (error) {
          return [
            new CrossnoteTreeItem(
              "⚠️ " + "Failed to load",
              vscode.TreeItemCollapsibleState.None,
              element.notebook,
              CrossnoteSectionType.Error,
              "."
            ),
          ];
        }
      } else if (
        element.type === CrossnoteSectionType.Notes ||
        element.type === CrossnoteSectionType.Directory
      ) {
        const dirArr = element.path.split("/");
        let directory = element.notebook.rootDirectory;
        let children = directory?.children;
        if (element.path !== ".") {
          for (let i = 0; i < dirArr.length; i++) {
            directory = children?.find((dir) => dir.name === dirArr[i]);
            children = directory?.children;
          }
        }
        return (children || []).map((child) => {
          return new CrossnoteTreeItem(
            "📁 " + child.name,
            child.children.length
              ? vscode.TreeItemCollapsibleState.Collapsed
              : vscode.TreeItemCollapsibleState.None,
            element.notebook,
            CrossnoteSectionType.Directory,
            child.path
          );
        });
      } else if (
        element.type === CrossnoteSectionType.Tagged ||
        element.type === CrossnoteSectionType.Tag
      ) {
        const tagArr = element.path.split("/");
        let tagNode = element.notebook.rootTagNode;
        let children = tagNode?.children;
        if (element.path !== ".") {
          for (let i = 0; i < tagArr.length; i++) {
            tagNode = children?.find((tn) => tn.name === tagArr[i]);
            children = tagNode?.children;
          }
        }
        return (children || []).map((child) => {
          return new CrossnoteTreeItem(
            "🏷️ " + child.name,
            child.children.length
              ? vscode.TreeItemCollapsibleState.Collapsed
              : vscode.TreeItemCollapsibleState.None,
            element.notebook,
            CrossnoteSectionType.Tag,
            child.path
          );
        });
      } else {
        return [];
      }
    } else {
      // Read all notebooks
      return this.crossnote.notebooks.map((notebook) => {
        return new CrossnoteTreeItem(
          "📔 " + notebook.name,
          vscode.TreeItemCollapsibleState.Collapsed,
          notebook,
          CrossnoteSectionType.Notebook,
          "." // workspaceFolder.uri.fsPath
        );
      });
    }
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
