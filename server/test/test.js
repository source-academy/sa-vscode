"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_slang_1 = require("js-slang");
const types_1 = require("js-slang/dist/types");
const assert_1 = __importDefault(require("assert"));
const utils_1 = require("../utils");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const ast_1 = require("../ast");
const context = (0, js_slang_1.createContext)(types_1.Chapter.SOURCE_4, types_1.Variant.DEFAULT);
suite("Autocompletion", () => {
    test("Builtins", async () => {
        const ast = new ast_1.AST("", context, "");
        const items = ast.getCompletionItems({ line: 0, character: 0 });
        assert_1.default.ok(utils_1.autocomplete_labels[context.chapter - 1].every(i => items.includes(i)));
    });
    test("Scoping", async () => {
        const ast = new ast_1.AST("let x = 1; {let y = 1;}", context, "");
        const items = ast.getCompletionItems({ line: 0, character: 0 });
        assert_1.default.ok(items.some(i => i.label === "x") && items.every(i => i.label !== "y"));
    });
});
suite("Rename", () => {
    test("Rename1", () => {
        const text = "let x = 1; { let x = 2; }";
        const doc = vscode_languageserver_textdocument_1.TextDocument.create("test://test/test.sourcejs", 'sourcejs', 0, text);
        const ast = new ast_1.AST(text, context, doc.uri);
        const edits = ast.renameSymbol({ line: 0, character: 4 }, 'y');
        assert_1.default.deepStrictEqual(edits, {
            changes: {
                [doc.uri]: [
                    {
                        range: { start: { line: 0, character: 4 }, end: { line: 0, character: 5 } },
                        newText: 'y'
                    }
                ]
            }
        });
    });
    test("Rename2", () => {
        const text = "let x = 1; { let x = 2; x = 3; }";
        const doc = vscode_languageserver_textdocument_1.TextDocument.create("test://test/test.sourcejs", 'sourcejs', 0, text);
        const ast = new ast_1.AST(text, context, doc.uri);
        const edits = ast.renameSymbol({ line: 0, character: 17 }, 'y');
        assert_1.default.deepStrictEqual(edits, {
            changes: {
                [doc.uri]: [
                    {
                        range: { start: { line: 0, character: 17 }, end: { line: 0, character: 18 } },
                        newText: 'y'
                    },
                    {
                        range: { start: { line: 0, character: 24 }, end: { line: 0, character: 25 } },
                        newText: 'y'
                    }
                ]
            }
        });
    });
    test("Rename3", () => {
        const text = "let x = 1; { x = 3; }";
        const doc = vscode_languageserver_textdocument_1.TextDocument.create("test://test/test.sourcejs", 'sourcejs', 0, text);
        const ast = new ast_1.AST(text, context, doc.uri);
        const edits = ast.renameSymbol({ line: 0, character: 4 }, 'y');
        assert_1.default.deepStrictEqual(edits, {
            changes: {
                [doc.uri]: [
                    {
                        range: { start: { line: 0, character: 4 }, end: { line: 0, character: 5 } },
                        newText: 'y'
                    },
                    {
                        range: { start: { line: 0, character: 13 }, end: { line: 0, character: 14 } },
                        newText: 'y'
                    }
                ]
            }
        });
    });
});
suite("Document Symbols", () => {
    test("Imports", async () => {
        const ast = new ast_1.AST('import { black } from "rune"; import { black } from "rune_in_words";', context, "");
        assert_1.default.deepStrictEqual(ast.getDocumentSymbols(), [
            {
                "name": "black",
                "kind": 3,
                "range": {
                    "start": {
                        "line": 0,
                        "character": 0
                    },
                    "end": {
                        "line": 0,
                        "character": 29
                    }
                },
                "selectionRange": {
                    "start": {
                        "line": 0,
                        "character": 9
                    },
                    "end": {
                        "line": 0,
                        "character": 14
                    }
                }
            },
            {
                "name": "black",
                "kind": 3,
                "range": {
                    "start": {
                        "line": 0,
                        "character": 30
                    },
                    "end": {
                        "line": 0,
                        "character": 68
                    }
                },
                "selectionRange": {
                    "start": {
                        "line": 0,
                        "character": 39
                    },
                    "end": {
                        "line": 0,
                        "character": 44
                    }
                }
            }
        ]);
    });
    test("Variables", async () => {
        const ast = new ast_1.AST('let x = 1; { let y = 2; }', context, "");
        assert_1.default.deepStrictEqual(ast.getDocumentSymbols(), [
            {
                "name": "x",
                "kind": 13,
                "range": {
                    "start": {
                        "line": 0,
                        "character": 4
                    },
                    "end": {
                        "line": 0,
                        "character": 9
                    }
                },
                "selectionRange": {
                    "start": {
                        "line": 0,
                        "character": 4
                    },
                    "end": {
                        "line": 0,
                        "character": 5
                    }
                }
            },
            {
                "name": "y",
                "kind": 13,
                "range": {
                    "start": {
                        "line": 0,
                        "character": 17
                    },
                    "end": {
                        "line": 0,
                        "character": 22
                    }
                },
                "selectionRange": {
                    "start": {
                        "line": 0,
                        "character": 17
                    },
                    "end": {
                        "line": 0,
                        "character": 18
                    }
                }
            }
        ]);
    });
    test("Functions", async () => {
        const ast = new ast_1.AST(`const mult = (x, y) => {
                return x * y;
            }`, context, "");
        assert_1.default.deepEqual(ast.getDocumentSymbols(), [
            {
                "name": "mult",
                "kind": 14,
                "range": {
                    "start": {
                        "line": 0,
                        "character": 6
                    },
                    "end": {
                        "line": 2,
                        "character": 13
                    }
                },
                "selectionRange": {
                    "start": {
                        "line": 0,
                        "character": 6
                    },
                    "end": {
                        "line": 0,
                        "character": 10
                    }
                },
                "children": [
                    {
                        "name": "x",
                        "kind": 13,
                        "range": {
                            "start": {
                                "line": 0,
                                "character": 14
                            },
                            "end": {
                                "line": 0,
                                "character": 15
                            }
                        },
                        "selectionRange": {
                            "start": {
                                "line": 0,
                                "character": 14
                            },
                            "end": {
                                "line": 0,
                                "character": 15
                            }
                        }
                    },
                    {
                        "name": "y",
                        "kind": 13,
                        "range": {
                            "start": {
                                "line": 0,
                                "character": 17
                            },
                            "end": {
                                "line": 0,
                                "character": 18
                            }
                        },
                        "selectionRange": {
                            "start": {
                                "line": 0,
                                "character": 17
                            },
                            "end": {
                                "line": 0,
                                "character": 18
                            }
                        }
                    }
                ]
            }
        ]);
    });
});
//# sourceMappingURL=test.js.map