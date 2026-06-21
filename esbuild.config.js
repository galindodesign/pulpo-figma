// esbuild.config.js
const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const options = {
  entryPoints: ['code.ts'],
  bundle: true,
  outfile: 'build/code.js',
  platform: 'browser',
  target: ['es6'],
  format: 'iife',
  sourcemap: true,
  external: [],
  logLevel: 'info',
  loader: { '.ts': 'ts', '.js': 'js' },
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('Watching code.ts → build/code.js');
    return;
  }

  await esbuild.build(options);
}

main().catch(() => process.exit(1));
