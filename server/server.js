"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const js_slang_1 = require("js-slang");
const types_1 = require("js-slang/dist/types");
const utils_1 = require("./utils");
const ast_1 = require("./ast");
const SECTION = "\u00A7";
const chapter_names = {
    [`Source ${SECTION}1`]: types_1.Chapter.SOURCE_1,
    [`Source ${SECTION}2`]: types_1.Chapter.SOURCE_2,
    [`Source ${SECTION}3`]: types_1.Chapter.SOURCE_3,
    [`Source ${SECTION}4`]: types_1.Chapter.SOURCE_4
};
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
let documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let context = (0, js_slang_1.createContext)(types_1.Chapter.SOURCE_1, types_1.Variant.DEFAULT);
let astCache = new Map();
function getAST(uri) {
    if (astCache.has(uri))
        return astCache.get(uri);
    const ast = new ast_1.AST(documents.get(uri).getText(), context, uri);
    astCache.set(uri, ast);
    return ast;
}
connection.onInitialize((params) => {
    let capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true
            },
            declarationProvider: true,
            documentHighlightProvider: true,
            documentSymbolProvider: true,
            renameProvider: true
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
let documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerExample || defaultSettings));
    }
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});
// Custom request to set the language version
connection.onRequest("setLanguageVersion", (params) => {
    if (Object.keys(chapter_names).includes(params.version)) {
        context = (0, js_slang_1.createContext)(chapter_names[params.version], types_1.Variant.DEFAULT);
        astCache.clear();
        return { success: true };
    }
    else
        return { success: false };
});
// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
let timeout = undefined;
documents.onDidChangeContent(change => {
    if (timeout)
        clearTimeout(timeout);
    timeout = setTimeout(() => {
        astCache.delete(change.document.uri);
        validateTextDocument(change.document);
    }, 300);
});
async function validateTextDocument(textDocument) {
    // In this simple example we get the settings for every validate run.
    const document = documents.get(textDocument.uri);
    if (document) {
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: getAST(textDocument.uri).getDiagnostics() });
    }
}
connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VS Code
    connection.console.log('We received a file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion(async (textDocumentPosition) => {
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document)
        return [];
    return getAST(textDocumentPosition.textDocument.uri).getCompletionItems(textDocumentPosition.position);
});
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    if (item.data.parameters) {
        item.insertText = `${item.label}(${item.data.parameters.filter((x) => item.data.optional_params ? !item.data.optional_params.includes(x) : true).map((param, idx) => `\${${idx + 1}:${param}}`)})`;
        item.insertTextFormat = node_1.InsertTextFormat.Snippet;
    }
    ;
    return item;
});
// This handler provides the declaration location of the name at the location provided
connection.onDeclaration(async (params) => {
    const position = params.position;
    const result = getAST(params.textDocument.uri).findDeclaration(position);
    if (result) {
        const range = (0, utils_1.sourceLocToRange)(result);
        return {
            uri: params.textDocument.uri,
            range
        };
    }
    else {
        return null;
    }
});
connection.onDocumentHighlight((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document)
        return null;
    return getAST(params.textDocument.uri).getOccurences(params.position);
});
connection.onDocumentSymbol(async (params) => {
    return getAST(params.textDocument.uri).getDocumentSymbols();
});
connection.onRenameRequest((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document)
        return null;
    const position = params.position;
    return getAST(params.textDocument.uri).renameSymbol(position, params.newName);
});
// Make the text document manager listen on the connection
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map