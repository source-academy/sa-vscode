/***/
/**
 * Entrypoint to build files required by extension
 * - extension.js: The main extension file, entrypoint for VSC
 * - webview.js: Simple web-based script to be in the VSC webview, which embeds Source Academy's frontend as iframe
 * - lsp.js: The Language Server Protocol (LSP) server, to be downloaded from another repository
 *
 * To be called by `yarn run build`
 */
/***/

const fs = require("fs");
const https = require("https");
const path = require("path");

const outputFolder = "out";

async function build() {
  try {
    fs.mkdirSync(outputFolder);
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }

  // Step 1: Build extension.js and webview.js
  const buildExtAndWebview = require("./esbuild").build;
  await buildExtAndWebview();

  // Step 2: Download the Source LSP server
  const version = "0.1.0";
  const lspFilename = "source-lsp.js";
  const url = `https://github.com/mug1wara26/source-lsp/releases/download/v${version}/${lspFilename}`;
  const outputPath = path.join(outputFolder, lspFilename); // Save in the same directory
  // Function below handles the 302 Found redirection from GitHub
  // await downloadFile(url, outputPath);
  // console.log(`LSP server downloaded from ${url}`);
}

/**
 * Function to abstract the downloading of a file from a URL, because https and fs are annoying to work with
 */
function downloadFile(url, outputPath) {
  const file = fs.createWriteStream(outputPath);
  return new Promise((resolve, reject) => {
    function onSuccess(res) {
      res.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }
    function onError(err) {
      console.log(`Error: ${err.message}`);
      fs.unlink(outputPath, () => {
        reject(err);
      });
    }

    https
      .get(url, (res) => {
        console.log(`Response status code: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (res.statusCode !== 200) {
            console.log("Warn: Status code is not 200");
          }
          onSuccess(res);
        } else if (res.statusCode === 301 || res.statusCode === 302) {
          console.log(`Redirecting to ${res.headers.location}`);
          https
            .get(res.headers.location, (res) => {
              // TODO: There needs to be second check here
              console.log(`Response status code: ${res.statusCode}`);
              onSuccess(res);
            })
            .on("error", onError);
        } else {
          console.log(`Error: ${res.statusCode}`);
        }
      })
      .on("error", onError);
  });
}

async function main() {
  await build();
  process.exit(0);
}

main();
