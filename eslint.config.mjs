import js from '@eslint/js';
import globals from 'globals';

const browserGlobals = {
  ...globals.browser,
  AOS: 'readonly',
  L: 'readonly',
  $: 'readonly',
  module: 'readonly',
};

export default [
  {
    ignores: ['node_modules/**', 'js/supabase-config.js'],
  },
  {
    files: ['js/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: browserGlobals,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
    },
  },
  {
    files: ['js/supabase-config.example.js', 'js/supabase-service.js'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    files: ['js/advisor.js'],
    languageOptions: {
      globals: {
        fetchJSON: 'readonly',
        getDataPath: 'readonly',
        getAttractionDetailPath: 'readonly',
        updateTripButtons: 'readonly',
      },
    },
  },
  {
    files: ['tests/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
];
