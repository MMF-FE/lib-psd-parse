import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    splitting: false,
    sourcemap: true,
    minify: true,
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    noExternal: ['tree-crawl'],
    legacyOutput: true,
})