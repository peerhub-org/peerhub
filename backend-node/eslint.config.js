import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default defineConfig([
  globalIgnores(['dist/', 'contract/', 'coverage/']),
  { files: ['**/*.{js,ts}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,ts}'], languageOptions: { globals: globals.node } },
  tseslint.configs.recommended,
  {
    files: ['{src,tests}/**/*.ts'],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  eslintPluginPrettierRecommended,
])
