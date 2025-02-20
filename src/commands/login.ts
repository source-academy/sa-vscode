import * as vscode from "vscode";

export async function login(context: vscode.ExtensionContext) {
  vscode.env.openExternal(
    vscode.Uri.parse(
      // "http://localhost:4000/sso/auth/signin/student?target_url=http://localhost:4000/v2/auth/saml_redirect?provider=test_saml_vscode",
      "http://localhost:4000/sso/auth/signin/student?target_url=http://localhost:4000/v2/auth/saml_redirect_vscode?provider=test_saml",
    ),
  );
  // vscode.env.openExternal(vscode.Uri.parse('http://localhost:4000/sso/auth/signin/student?target_url=http://example.com'));
}
