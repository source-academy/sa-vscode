"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletionItems = getCompletionItems;
const name_extractor_1 = require("js-slang/dist/name-extractor");
const utils_1 = require("js-slang/dist/parser/utils");
const vscode_languageserver_1 = require("vscode-languageserver");
const types_1 = require("./types");
const utils_2 = require("./utils");
const utils_3 = require("./utils");
async function getCompletionItems(text, pos, context) {
    const [program, comments] = (0, utils_1.parseWithComments)(text);
    // This implementation in js-slang only gets the program names thats in the scope of the cursor location
    // However, one issue is that any imported names dont contain information of which module they are from
    // along with other info like function parameters. So we remove the imported names and they are added back
    // when we concat the module docs, and change their item.data.type to SYMBOL
    const [names, _success] = await (0, name_extractor_1.getProgramNames)(program, comments, { line: pos.line + 1, column: pos.character });
    const labels = [];
    // Get the imported names
    const imported_names = {};
    (await (0, utils_2.applyFunctionOnNode)(program, {
        type: types_1.DECLARATIONS.IMPORT, callback: (node) => {
            node = node;
            return [{
                    type: "import",
                    module_name: node.source.value,
                    imports: node.specifiers.map((specifier) => ({
                        name: specifier.imported.name,
                        range: (0, utils_2.sourceLocToRange)(specifier.loc)
                    }))
                }];
        }
    }, {
        // We also parse through the ast for function and variable declarations,
        // probably a better way to do this but it works for now
        type: types_1.DECLARATIONS.FUNCTION, callback: (node) => {
            node = node;
            labels.push({
                label: node.id.name,
                labelDetails: { detail: " (func)" },
                kind: vscode_languageserver_1.CompletionItemKind.Function,
                data: { type: types_1.AUTOCOMPLETE_TYPES.SYMBOL, parameters: node.params.map(param => param.name) },
                sortText: '' + types_1.AUTOCOMPLETE_TYPES.SYMBOL
            });
            return [];
        }
    }, {
        type: types_1.DECLARATIONS.VARIABLE, callback: (node) => {
            node = node;
            node.declarations.forEach(declaration => {
                if ((0, utils_2.VsPosInSourceLoc)(pos, node.loc)) {
                    labels.push({
                        label: declaration.id.name,
                        labelDetails: { detail: ` (${node.kind})` },
                        kind: node.kind === 'var' || node.kind === 'let' ? vscode_languageserver_1.CompletionItemKind.Variable : vscode_languageserver_1.CompletionItemKind.Constant,
                        data: { type: types_1.AUTOCOMPLETE_TYPES.SYMBOL },
                        sortText: '' + types_1.AUTOCOMPLETE_TYPES.SYMBOL
                    });
                }
            });
            return [];
        }
    })).forEach(el => {
        if (el.type === "import") {
            if (!imported_names[el.module_name])
                imported_names[el.module_name] = new Map();
            el.imports.forEach(name => {
                imported_names[el.module_name].set(name.name, name.range);
            });
        }
    });
    return utils_3.autocomplete_labels[context.chapter - 1]
        .concat(labels)
        .concat(utils_3.module_autocomplete.map((item) => {
        if (imported_names[item.data.module_name]) {
            if (imported_names[item.data.module_name].has(item.label)) {
                return {
                    ...item,
                    detail: `Imported from ${item.data.module_name}`,
                    data: { type: types_1.AUTOCOMPLETE_TYPES.SYMBOL, ...item.data }
                };
            }
            else {
                // Not sure if the ast preserves the order that names are imported
                let last_imported_range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
                imported_names[item.data.module_name].forEach(range => {
                    last_imported_range = (0, utils_2.findLastRange)(last_imported_range, range);
                });
                return {
                    ...item,
                    additionalTextEdits: [
                        vscode_languageserver_1.TextEdit.insert(last_imported_range.end, `, ${item.label}`)
                    ]
                };
            }
            ;
        }
        else
            return {
                ...item,
                additionalTextEdits: [
                    vscode_languageserver_1.TextEdit.insert({ line: 0, character: 0 }, `import { ${item.label} } from "${item.data.module_name};"\n`)
                ]
            };
    }));
}
//# sourceMappingURL=languageFeatures.js.map