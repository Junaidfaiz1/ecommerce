import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');
const nextTypescript = require('eslint-config-next/typescript');

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'out/**', 'src/generated/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
