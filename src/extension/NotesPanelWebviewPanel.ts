import * as vscode from "vscode";
import * as path from "path";

export function createNotesPanelWebviewPanel(
  context: vscode.ExtensionContext,
  onDidDispose: () => void
) {
  const panel = vscode.window.createWebviewPanel(
    "notesPanel",
    "Notes Panel",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );
  const jsPath = panel.webview.asWebviewUri(
    vscode.Uri.file(
      path.join(
        context.extensionPath,
        "out",
        "views",
        "NotesPanelWebview.bundle.js"
      )
    )
  );

  panel.webview.html = getWebviewContent(panel.webview, jsPath.toString());
  panel.iconPath = vscode.Uri.file(
    path.join(context.extensionPath, "media", "notes.svg")
  );

  panel.onDidDispose(onDidDispose, null, context.subscriptions);
  return panel;
}

function getWebviewContent(webview: vscode.Webview, jsPath: string) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        http-equiv="Content-Security-Policy"
        content="img-src 'self' data: https: ${webview.cspSource}; script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.jsdelivr.net unpkg.com tessdata.projectnaptha.com gist.github.com blob: ${webview.cspSource}"
      />
      <meta
        name="description"
        content="Crossnote - A markdown note pwa that supports offline editing as well as git repository push&pull "
      />
    </head>
    <body>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="root"></div>
    </body>
    <script src="${jsPath}"></script>
  </html>
  `;
}
