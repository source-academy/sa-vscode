import * as vscode from "vscode";
import { runLanguagePicker } from "./language";
import { evalEditor } from "./evalEditor";
import { showPanel } from "./showPanel";
import { login } from "./login";

const EXTENSION_ID = "source-academy";

/**
 * The commands to be registered to the extension.
 * The keys must match the suffix of the command ID in package.json, under contributes.commands.
 */
const commands = (context: vscode.ExtensionContext) => ({
  pick: () => runLanguagePicker(context),
  "show-panel": () => showPanel(context),
  login: () => login(context),
  "eval-editor": () => evalEditor(context),
});

/**
 * Register commands defined under src/commands to the extension.
 */
export function registerAllCommands(context: vscode.ExtensionContext) {
  Object.entries(commands(context)).forEach(([commandIdSuffix, handler]) => {
    // Register the command
    const disposable = vscode.commands.registerCommand(
      `${EXTENSION_ID}.${commandIdSuffix}`,
      handler,
    );
    // Setup disposal on extension deactivation by adding it to subscriptions
    context.subscriptions.push(disposable);
  });
}
