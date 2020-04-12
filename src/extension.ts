// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CrossnoteTreeViewProvider } from "./extension/TreeView";
import { Crossnote } from "./lib/crossnote";

export function isMarkdownFile(document: vscode.TextDocument) {
  return (
    document.languageId === "markdown" &&
    document.uri.scheme !== "markdown-preview-enhanced"
  ); // prevent processing of own documents
}

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
  crossnote.bindTreeViewRefresh(() => {
    treeViewProvider.refresh();
  });
  context.subscriptions.push(
    vscode.commands.registerCommand("crossnote.refreshTreeView", () => {
      treeViewProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders((e) => {
      e.added.forEach((workspaceFolder) => {
        crossnote.addNotebook(workspaceFolder.name, workspaceFolder.uri.fsPath);
      });
      e.removed.forEach((workspaceFolder) => {
        crossnote.removeNotebook(workspaceFolder.uri.fsPath);
      });
      treeViewProvider.refresh();
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (isMarkdownFile(document)) {
        crossnote.updateNoteMarkdownIfNecessary(document.uri);
      }
    })
  );
  context.subscriptions.push(
    treeView.onDidChangeSelection((e) => {
      if (e.selection.length) {
        crossnote.openNotesPanelWebview(e.selection[0]);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "crossnote.openNoteInEditor",
      (uri?: vscode.Uri) => {
        let resource = uri;
        if (!(resource instanceof vscode.Uri)) {
          if (vscode.window.activeTextEditor) {
            // we are relaxed and don't check for markdown files
            resource = vscode.window.activeTextEditor.document.uri;
          }
        }
        if (resource) {
          crossnote.openNoteByPath(resource.fsPath);
        }
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
