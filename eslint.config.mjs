import pluginQuery from '@tanstack/eslint-plugin-query';
import unicornPlugin from 'eslint-plugin-unicorn';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';
import parser from '@typescript-eslint/parser';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import reactCompiler from 'eslint-plugin-react-compiler';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import * as jsxA11yPluginModule from 'eslint-plugin-jsx-a11y';

const jsxA11yPlugin = jsxA11yPluginModule.default || jsxA11yPluginModule;

const basePlugins = {
  unicorn: unicornPlugin,
  'jsx-a11y': jsxA11yPlugin,
};

const rawConfigs = [
  ...nextVitals,
  ...nextTs,
  ...eslintPluginJsonc.configs['recommended-with-jsonc'],
  eslintPluginPrettierRecommended,
  prettier,
  reactCompiler.configs.recommended,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'components/ui/**',
    'scratch/**',
    'test/mocks/**',
  ]),
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-deprecated': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'unicorn/no-keyword-prefix': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-abusive-eslint-disable': 'off',
      'unicorn/consistent-function-scoping': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-deprecated': 'off',
    },
    settings: {
      react: {
        version: '19',
      },
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parser: parser,
      parserOptions: {
        projectService: true,
        allowDefaultProject: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...pluginQuery.configs['flat/recommended'],
];

// Aggressively inject plugins into every config object that might need them
const eslintConfig = rawConfigs.map((config) => {
  if (config.rules || config.plugins) {
    return {
      ...config,
      plugins: {
        ...config.plugins,
        ...basePlugins,
      },
    };
  }
  return config;
});

export default eslintConfig;
