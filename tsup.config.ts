import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts', 'tree-crawl'],
    splitting: false,
    sourcemap: true,
    minify: true,
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    legacyOutput: true,
})