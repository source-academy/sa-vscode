// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { showPanel } from "./commands/showPanel";
import { runLanguagePicker } from "./commands/language";
import { setupStatusBar } from "./statusbar/status";
import { login } from "./commands/login";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("sa-vscode.pick", () =>
      runLanguagePicker(context),
    ),
    vscode.commands.registerCommand("sa-vscode.show-panel", () =>
      showPanel(context),
    ),
    vscode.commands.registerCommand("sa-vscode.login", () => login(context)),
  );

  context.subscriptions.push(setupStatusBar(context));
  vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      vscode.window.showInformationMessage(`HANDLEING`);
      return;
      // const searchParams = new URLSearchParams(uri.query);
      // const accessToken = searchParams.get("access_token");
      // vscode.window.showInformationMessage(`Access: ${accessToken}`);
      // const refreshToken = searchParams.get("refresh_token");
      // vscode.window.showInformationMessage(`Refresh: ${refreshToken}`);

      // context.globalState.update("token", { accessToken, refreshToken });
    },
  });
}
// This method is called when your extension is deactivated
export function deactivate() {}
