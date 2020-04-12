// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CrossnoteTreeViewProvider } from "./extension/TreeView";
import { Crossnote } from "./lib/crossnote";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const crossnote = new Crossnote(context);
  vscode.workspace.workspaceFolders?.forEach((workspaceFolder) => {
    crossnote.addNotebook(workspaceFolder.name, workspaceFolder.uri.fsPath);
  });

  const treeViewProvider = new CrossnoteTreeViewProvider(crossnote);
  const treeView = vscode.window.createTreeView("crossnoteTreeView", {
    treeDataProvider: treeViewProvider,
  });
  context.subscriptions.push(
    vscode.commands.registerCommand("crossnote.refreshTreeView", () => {
      treeViewProvider.refresh();
    })
  );
  vscode.workspace.onDidChangeWorkspaceFolders((e) => {
    e.added.forEach((workspaceFolder) => {
      crossnote.addNotebook(workspaceFolder.name, workspaceFolder.uri.fsPath);
    });
    e.removed.forEach((workspaceFolder) => {
      crossnote.removeNotebook(workspaceFolder.uri.fsPath);
    });
    treeViewProvider.refresh();
  });
  treeView.onDidChangeSelection((e) => {
    if (e.selection.length) {
      crossnote.openNotesPanelWebview(e.selection[0]);
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("crossnote.openNoteInEditor", () => {
      console.log("Open note");
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
