// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { showPanel } from "./commands/showPanel";
import { setupTreeView } from "./view/test";
import { setupStatusBar } from "./statusbar/status";
import { registerAllCommands } from "./commands";
import { activateLspClient, deactivateLspClient } from "./lsp/client";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("Source Academy extension is now active!");
  setupTreeView();
  registerAllCommands(context);

  context.subscriptions.push(setupStatusBar(context));

  activateLspClient(context);
  vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      const searchParams = new URLSearchParams(uri.query);
      const code = searchParams.get("code");
      vscode.window.showInformationMessage(`Code: ${code}`);
      const provider = searchParams.get("provider");
      vscode.window.showInformationMessage(`Provider: ${provider}`);

      // context.globalState.update("token", {
      //   accessToken: code,
      //   refreshToken: provider,
      // });
      const url = `http://localhost:4000/v2/auth/exchange/?code=${code}&provider=${provider}`;
      showPanel(context, url);
    },
  });
}

// This method is called when your extension is deactivated
export function deactivate() {
  deactivateLspClient();
}
