import * as vscode from "vscode";

/**
 * Convenience function to set html content of a webview panel via JSX
 */
export function setWebviewContent(
  panel: vscode.WebviewPanel,
  bodyHtml: JSX.Element,
) {
  const fullhtml = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${panel.title}</title>
    </head>
      ${bodyHtml}
  </html>`;
  panel.webview.html = fullhtml;
}
