// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { setupStatusBar } from "./statusbar/status";
import { evalEditor } from "./commands/evalEditor";
import { registerAllCommands } from "./commands";
import { activateLspClient, deactivateLspClient } from "./lsp/client";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  registerAllCommands(context);

  context.subscriptions.push(setupStatusBar(context));

  activateLspClient(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
  deactivateLspClient();
}
