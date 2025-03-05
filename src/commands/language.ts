import * as vscode from "vscode";
import { updateStatusBar } from "../statusbar/status";
import { LANGUAGES, languageToChapter } from "../utils/languages";
import { LanguageClient } from "vscode-languageclient/node";

export async function runLanguagePicker(context: vscode.ExtensionContext, client: LanguageClient) {
  const options = Object.values(LANGUAGES);

  const result = await vscode.window.showQuickPick(options, {
    placeHolder: "Select a language",
  });

  if (!result) {
    return;
  }

  await context.workspaceState.update("language", result);
  await setLanguageVersion(result, client);

  // TODO: Make status bar subscribe to state change rather than calling
  updateStatusBar(context);
}


// Function to send the version to the server
async function setLanguageVersion(version: string, client: LanguageClient) {
	if (!client) {
	  vscode.window.showErrorMessage("Language server is not running.");
	  return;
	}
	try {
	  const response = await client.sendRequest("setLanguageVersion", { version: version });
	  vscode.window.showInformationMessage(`Language version set to ${version}`);
	} catch (error) {
	  vscode.window.showErrorMessage(`Failed to set language version: ${error}`);
	}
  }