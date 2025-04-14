import * as vscode from "vscode";
// Allow using JSX within this file by overriding our own createElement function
import React from "../utils/FakeReact";

import Messages, {
  MessageType,
  MessageTypeNames,
  sendToFrontend,
} from "../utils/messages";
import { LANGUAGES } from "../utils/languages";
import { setWebviewContent } from "../utils/webview";
import config from "../utils/config";
import { Editor } from "../utils/editor";
import { FRONTEND_ELEMENT_ID } from "../constants";
import { client } from "../extension";
import _ from "lodash";

let panel: vscode.WebviewPanel | null = null;
// This needs to be a reference to active
// TODO: Fix this ugly code!
export let activeEditor: Editor | null = null;

const messageQueue: MessageType[] = [];
let handling = false;

// TODO: Remove panel and handling message logic out of the commands/ directory

async function handleMessage(
  context: vscode.ExtensionContext,
  message: MessageType,
) {
  messageQueue.push(message);
  if (handling) {
    return;
  }
  handling = true;

  while (messageQueue.length > 0) {
    const message = messageQueue.shift()!;
    console.log(`${Date.now()} Beginning handleMessage: ${message.type}`);
    switch (message.type) {
      case MessageTypeNames.ExtensionPing:
        sendToFrontend(panel, Messages.ExtensionPong(null));
        break;
      case MessageTypeNames.NewEditor:
        activeEditor = await Editor.create(
          message.workspaceLocation,
          message.assessmentName,
          message.questionId,
          message.prepend,
          message.initialCode,
        );
        activeEditor.uri;
        const info = context.globalState.get("info") ?? {};
        if (activeEditor.uri) {
          // TODO: Write our own wrapper to set nested keys easily, removing lodash
          // @ts-ignore
          _.set(info, `["${activeEditor.uri}"].chapter`, message.chapter);
          const nPrependLines = message.prepend.split("\n").length;
          _.set(info, `["${activeEditor.uri}"].prepend`, nPrependLines);
          context.globalState.update("info", info);
          client.sendNotification("source/publishInfo", info);
        }

        panel?.reveal(vscode.ViewColumn.Two);
        console.log(
          `EXTENSION: NewEditor: activeEditor set to ${activeEditor.assessmentName}_${activeEditor.questionId}`,
        );
        activeEditor.onChange((editor) => {
          const workspaceLocation = editor.workspaceLocation;
          const code = editor.getText();
          if (!code) {
            return;
          }
          if (editor !== activeEditor) {
            console.log(
              `EXTENSION: Editor ${editor.assessmentName}_${editor.questionId} is no longer active, skipping onChange`,
            );
          }
          const message = Messages.Text(workspaceLocation, code);
          console.log(`Sending message: ${JSON.stringify(message)}`);
          sendToFrontend(panel, message);
        });
        break;
      // case MessageTypeNames.Text:
      //   if (!activeEditor) {
      //     console.log("ERROR: activeEditor is not set");
      //     break;
      //   }
      //   activeEditor.replace(message.code, "Text");
      //   break;
    }
    console.log(`${Date.now()} Finish handleMessage: ${message.type}`);
  }

  handling = false;
}

export async function showPanel(context: vscode.ExtensionContext) {
  let language: string | undefined = context.workspaceState.get("language");
  if (!language) {
    language = LANGUAGES.SOURCE_1;
  }

  // Get a reference to the active editor (before the focus is switched to our newly created webview)
  // firstEditor = vscode.window.activeTextEditor!;

  panel = vscode.window.createWebviewPanel(
    "source-academy-panel",
    "Source Academy",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true, // Enable scripts in the webview
      retainContextWhenHidden: true,
    },
  );

  panel.webview.onDidReceiveMessage(
    (message: MessageType) => handleMessage(context, message),
    undefined,
    context.subscriptions,
  );

  const frontendUrl = new URL("/playground", config.frontendBaseUrl).href;

  // equivalent to panel.webview.html = ...
  setWebviewContent(
    panel,
    context,
    // NOTE: This is not React code, but our FakeReact!
    <div
      // Account for some unexplainable margin
      // @ts-expect-error: Our FakeReact doesn't modify the style attribute
      style="width: 100%; height: calc(100vh - 10px)"
    >
      <iframe
        id={FRONTEND_ELEMENT_ID}
        src={frontendUrl}
        width="100%"
        height="100%"
        // @ts-ignore
        frameborder="0"
        allowfullscreen
      ></iframe>
    </div>,
  );

  panel.iconPath = vscode.Uri.joinPath(
    context.extensionUri,
    "assets",
    "icon.png",
  );
}

// TODO: Move this to a util file
export async function sendToFrontendWrapped(message: MessageType) {
  if (!panel) {
    console.error("ERROR: panel is not set");
    return;
  }
  sendToFrontend(panel, message);
}
