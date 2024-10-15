import {
  Message,
  MessageType,
  TextMessage,
  WebviewStartedMessage,
} from "../utils/messages";

const FRONTEND_ELEMENT_ID = "frontend";

console.log("INDX");

// This function is provided by vscode extension
// @ts-expect-error: Cannot find name 'acquireVsCodeApi'.ts(2304)
const vscode = acquireVsCodeApi();
const message: WebviewStartedMessage = {
  type: MessageType.WebviewStartedMessage,
};
vscode.postMessage(message);

function handleTextUpdatedMessage(message: TextMessage) {
  const iframe: HTMLIFrameElement = document.getElementById(
    FRONTEND_ELEMENT_ID,
  ) as HTMLIFrameElement;
  const contentWindow = iframe.contentWindow;
  if (!contentWindow) {
    return;
  }
  // TODO: Don't use '*'
  console.log("POsting message to iframe");
  contentWindow.postMessage(message.code, "*");
}

function messageListener(event: MessageEvent) {
  const message: Message = event.data;
  switch (message.type) {
    case MessageType.TextMessage:
      handleTextUpdatedMessage(message as TextMessage);
      break;
  }
}
window.addEventListener("message", messageListener);
