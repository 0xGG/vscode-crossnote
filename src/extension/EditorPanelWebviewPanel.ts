import * as vscode from "vscode";
import * as path from "path";
import { getWebviewCSP } from "./WebviewConfig";
import { VSCodeCrossnoteSettings } from "./settings";

export function createEditorPanelWebviewPanel(
  context: vscode.ExtensionContext,
  onDidDispose: () => void
) {
  const panel = vscode.window.createWebviewPanel(
    "editorPanel",
    "Editor Panel",
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
    }
  );

  const cssArr = [].map((filePath) =>
    panel.webview.asWebviewUri(vscode.Uri.file(filePath))
  );

  const jsArr = [
    // mermaid
    path.join(context.extensionPath, "./public/deps/mermaid/mermaid.min.js"),
    // marked
    path.join(context.extensionPath, "./public/deps/marked/marked.min.js"),
    // plantuml-encoder
    path.join(
      context.extensionPath,
      "./public/deps/plantuml-encoder/plantuml-encoder.min.js"
    ),
    // echarts
    path.join(context.extensionPath, "./public/deps/echarts/echarts.min.js"),
    path.join(
      context.extensionPath,
      "./public/deps/echarts-gl/echarts-gl.min.js"
    ),
    // wavedrom
    path.join(context.extensionPath, "./public/deps/wavedrom/skins/default.js"),
    path.join(context.extensionPath, "./public/deps/wavedrom/wavedrom.min.js"),
    // yamljs
    path.join(context.extensionPath, "./public/deps/yamljs/yaml.min.js"),
    // prismjs
    path.join(context.extensionPath, "./public/deps/prism/prism.js"),
    // vega
    path.join(context.extensionPath, "./public/deps/vega/vega.min.js"),
    path.join(
      context.extensionPath,
      "./public/deps/vega-lite/vega-lite.min.js"
    ),
    path.join(
      context.extensionPath,
      "./public/deps/vega-embed/vega-embed.min.js"
    ),

    path.join(
      context.extensionPath,
      "./out/views/EditorPanelWebview.bundle.js"
    ),
  ].map((filePath) => panel.webview.asWebviewUri(vscode.Uri.file(filePath)));

  panel.webview.html = getWebviewContent(context, panel.webview, jsArr, cssArr);
  panel.iconPath = vscode.Uri.file(
    path.join(context.extensionPath, "media", "editNote.svg")
  );

  panel.onDidDispose(onDidDispose, null, context.subscriptions);
  return panel;
}

function getWebviewContent(
  context: vscode.ExtensionContext,
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
        name="description"
        content="Crossnote - A markdown note pwa that supports offline editing as well as git repository push&pull "
      />
      ${getWebviewCSP(webview)}
      ${cssArr
        .map((css) => `<link rel="stylesheet" href="${css}"></link>`)
        .join("\n")}
    </head>
    <body>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="root"></div>
    </body>
    <script>
      window.extensionPath = ${JSON.stringify(context.extensionPath)}
      window.crossnoteSettings = ${JSON.stringify(
        VSCodeCrossnoteSettings.getCurrentSettings()
      )}
    </script>
    ${jsArr.map((js) => `<script src=${js}></script>`).join("\n")}
  </html>
  `;
}
