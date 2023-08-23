#!/usr/bin/env node
const { buildSync } = require("esbuild");
const { join } = require("path");

const { dependencies, peerDependencies } = require("./package.json");

const opts = {
    entryPoints: ["src/index.ts"],
    absWorkingDir: join(__dirname, "."),
    bundle: true,
    sourcemap: true,
};

const external = Object.keys({ ...dependencies, ...peerDependencies });

try {
    // esm
    buildSync({
        ...opts,
        platform: "neutral",
        outfile: "dist/esm/ionic-oidc-client-ts.js",
        external,
    });
    // node
    buildSync({
        ...opts,
        platform: "node",
        outfile: "dist/umd/ionic-oidc-client-ts.js",
        external,
    });

    // browser (self contained)
    buildSync({
        ...opts,
        platform: "browser",
        outfile: "dist/browser/ionic-oidc-client-ts.js",
        globalName: "ionic.oidc",
    });
    // browser-min (self contained)
    buildSync({
        ...opts,
        platform: "browser",
        outfile: "dist/browser/ionic-oidc-client-ts.min.js",
        globalName: "ionic.oidc",
        minify: true,
    });
} catch (err) {
    // esbuild handles error reporting
    process.exitCode = 1;
}