// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("sa-vscode.stepper", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("Please open an active editor!");
        return;
      }

      // Get text from active document and run it through the stepper
      const text = editor.document.getText();

      const panel = vscode.window.createWebviewPanel(
        "stepper",
        "Stepper",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true, // Enable scripts in the webview
        },
      );
      panel.webview.html = getWebviewContent(context, panel);

      panel.webview.onDidReceiveMessage(
        (message) => {
          // Send the stepper result to the webview
          panel.webview.postMessage(text);
        },
        undefined,
        context.subscriptions,
      );
    }),
  );
}

function getNonce(): string {
  let text: string = "";
  const possible: string =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getWebviewContent(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
) {
  // Use a nonce to whitelist which scripts can be run
  const nonce = getNonce();

  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "out", "webview.js"),
  );

  // <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src *; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cat Coding</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
    </body>
  </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
