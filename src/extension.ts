// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "helloworld-sample" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.helloWorld", () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World!");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.testWebview", () => {
      const panel = vscode.window.createWebviewPanel(
        "testWebview",
        "Test Webview",
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
            "EditorPanel.bundle.js"
          )
        )
      );
      console.log(jsPath.toString());
      panel.webview.html = getWebviewContent(panel.webview, jsPath.toString());

      panel.onDidDispose(() => {}, null, context.subscriptions);
    })
  );
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

// this method is called when your extension is deactivated
export function deactivate() {}
