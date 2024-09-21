// @ts-check
const esbuild = require("esbuild");
const polyfillNode = require("esbuild-plugin-polyfill-node").polyfillNode;
const ignorePlugin = require("esbuild-plugin-ignore");
const fileloc = require("esbuild-plugin-fileloc").filelocPlugin;

async function main() {
  const extensionCtx = await esbuild.context({
    entryPoints: ["./src/extension.ts"],
    bundle: true,
    format: "cjs",
    platform: "node",
    outfile: "./out/extension.js",
    sourcemap: true,
    external: ["vscode"],
  });

  const webviewCtx = await esbuild.context({
    entryPoints: ["./src/webview/index.tsx"],
    bundle: true,
    format: "esm",
    platform: "browser",
    // target: "node20",
    // format: "cjs",
    sourcemap: true,
    // external: ["fs", "constants", "path"],
    outfile: "./out/webview.js",
    plugins: [
      polyfillNode({
        polyfills: {
          fs: true,
        },
        // globals: {
        //   __dirname: false,
        //   __filename: false,
        //   process: true,
        // },
        // Options (optional)
      }),
      // fileloc(),
      // ignorePlugin([
      //   {

      //     // resourceRegExp: /.*node_modules\/@ts-morph\/common\/dist\/typescript\.js$/

      //   },
      // ])
    ],
    define: {
      // Define __filename and __dirname for browser environments
      __filename: JSON.stringify("/static/js/filename.js"), // You can customize this path
      __dirname: JSON.stringify("/static/js"),
    },
  });

  // Run both configurations at the same time

  if (process.argv.includes("--watch")) {
    await extensionCtx.watch();
    await webviewCtx.watch();
    console.log("Watching files...");
  } else {
    Promise.all([extensionCtx.rebuild(), webviewCtx.rebuild()]).then(() => {
      console.log("Builds completed successfully.");
      process.exit(0);
    });
  }
}

main();
