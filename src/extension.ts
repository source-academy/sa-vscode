// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { showPanel } from "./commands/showPanel";
import { setupTreeView } from "./view/test";
import { setupStatusBar } from "./statusbar/status";
import { registerAllCommands } from "./commands";
import { activateLspClient, deactivateLspClient } from "./lsp/client";
import { LanguageClient } from "vscode-languageclient/node";

// TODO: Don't expose this object directly, create an interface via a wrapper class
export let client: LanguageClient;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("Source Academy extension is now active!");
  setupTreeView();
  registerAllCommands(context);

  context.subscriptions.push(setupStatusBar(context));

  client = activateLspClient(context);

  // const info = {
  //   "file:///home/heyzec/.sourceacademy/playground_1.js": { chapter: 4 },
  // };
  const info = context.globalState.get("info") ?? {};

  client.sendNotification("source/publishInfo", info);

  // TODO: Split this handler into subhandlers, and them its own folder in src/uriHandlers
  vscode.window.registerUriHandler({
    // Use handleUri: (uri) => {},
    handleUri(uri: vscode.Uri) {
      switch (uri.path) {
        case "/sso":
          {
            const searchParams = new URLSearchParams(uri.query);
            const code = searchParams.get("code");
            const provider = searchParams.get("provider");
            vscode.window.showInformationMessage("Authenticating...");
            const url = `http://localhost:4000/v2/auth/exchange/?code=${code}&provider=${provider}`;
            showPanel(context, url);
          }
          break;
        case "/sharelink":
          {
            const hash = uri.fragment;
            const url = `http://localhost:8000/playground${hash}`;
            showPanel(context, url);
          }
          break;
        default:
          vscode.window.showErrorMessage(
            `Unrecognized path in deeplink: ${uri.path}`,
          );
          return;
      }
    },
  });
}

// This method is called when your extension is deactivated
export function deactivate() {
  deactivateLspClient();
}
