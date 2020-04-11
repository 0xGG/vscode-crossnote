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
  const cssArr = [
    path.join(
      context.extensionPath,
      "./public/styles/preview_themes/github-light.css"
    ),
  ].map((filePath) => panel.webview.asWebviewUri(vscode.Uri.file(filePath)));

  const jsArr = [
    path.join(context.extensionPath, "./out/views/NotesPanelWebview.bundle.js"),
  ].map((filePath) => panel.webview.asWebviewUri(vscode.Uri.file(filePath)));

  panel.webview.html = getWebviewContent(panel.webview, jsArr, cssArr);
  panel.iconPath = vscode.Uri.file(
    path.join(context.extensionPath, "media", "notes.svg")
  );

  panel.onDidDispose(onDidDispose, null, context.subscriptions);
  return panel;
}

function getWebviewContent(
  webview: vscode.Webview,
  jsArr: vscode.Uri[],
  cssArr: vscode.Uri[]
) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        http-equiv="Content-Security-Policy"
        content="img-src 'self' data: https: ${
          webview.cspSource
        }; script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.jsdelivr.net unpkg.com tessdata.projectnaptha.com gist.github.com blob: ${
    webview.cspSource
  }"
      />
      <meta
        name="description"
        content="Crossnote - A markdown note pwa that supports offline editing as well as git repository push&pull "
      />

      ${cssArr
        .map((css) => `<link rel="stylesheet" href="${css}"></link>`)
        .join("\n")}
    </head>
    <body>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="root"></div>
    </body>
    ${jsArr.map((js) => `<script src=${js}></script>`).join("\n")}
  </html>
  `;
}
