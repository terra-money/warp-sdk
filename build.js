const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

const isBrowserBuild = process.env.BUILD_TARGET === 'browser';

esbuild
  .build({
    entryPoints: ['./src/index.ts'],
    outfile: isBrowserBuild ? 'dist/index.browser.js' : 'dist/index.js',
    bundle: true,
    minify: true,
    platform: isBrowserBuild ? 'browser' : 'node',
    format: isBrowserBuild ? 'esm' : 'cjs',
    target: isBrowserBuild ? ['es2020'] : ['node14'],
    // external: [], // Consider what other dependencies might also not be browser-compatible
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
