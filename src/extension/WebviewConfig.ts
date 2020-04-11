import * as vscode from "vscode";
export function getWebviewCSP(webview: vscode.Webview) {
  return `<meta
  http-equiv="Content-Security-Policy"
  content="img-src 'self' data: https: ${webview.cspSource}; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://tessdata.projectnaptha.com https://gist.github.com blob: ${webview.cspSource}"
/>`;
}
