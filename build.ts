import {$} from 'bun';

const baseConfig: Parameters<typeof Bun.build>[0] = {
    entrypoints: ['src/index.ts'],
    outdir: './dist',

    banner: '/*! Buntralino client. Buntralino unites Bun and Neutralino.js to make a simpler, lighter alternative to Electron and NW.js. Use Neutralino.js API at client and send harder tasks to Bun while keeping your development process easy. © Cosmo Myzrail Gorynych 2024, MIT License. */',

    minify: true,
    target: 'browser',
    external: ['@neutralinojs/lib'],
    sourcemap: 'linked',
    naming: "[dir]/[name].mjs"
};

Promise.all([
    Bun.build({
        ...baseConfig,
        format: 'esm'
    }),
    Bun.build({
        ...baseConfig,
        format: 'cjs',
        naming: "[dir]/[name].cjs"
    }),
    $`tsc`
]);
