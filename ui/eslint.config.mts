import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'Global ignore',
    ignores: [
      'node_modules/*',
      'build/*',
    ],
  },
  {
    name: 'Typescript',
    files: ["**/*.{ts,tsx}"],
    rules: {
      quotes: ["error", "single"],
      indent: ["error", 4],
      "@typescript-eslint/no-explicit-any": 0,
    },
  },
];