// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CrossnoteTreeViewProvider } from "./extension/TreeView";
import { Crossnote } from "./lib/crossnote";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const crossnote = new Crossnote(context);
  const treeViewProvider = new CrossnoteTreeViewProvider(
    crossnote,
    vscode.workspace.workspaceFolders
  );
  const treeView = vscode.window.createTreeView("crossnoteTreeView", {
    treeDataProvider: treeViewProvider,
  });
  context.subscriptions.push(
    vscode.commands.registerCommand("crossnote.refreshTreeView", () => {
      treeViewProvider.refresh();
    })
  );
  treeView.onDidChangeSelection((e) => {
    if (e.selection.length) {
      crossnote.openNotesPanelWebview(e.selection[0]);
    }
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
