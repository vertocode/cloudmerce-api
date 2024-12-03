import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import typescriptParser from '@typescript-eslint/parser';

export default [
    {
        ignores: ['dist'],
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: typescriptParser,
        },
        plugins: {
            '@typescript-eslint': typescriptPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            'no-console': 'off',
            'semi': ['error', 'never'],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            'prettier/prettier': [
                'error',
                {
                    semi: false,
                    singleQuote: true,
                    trailingComma: 'es5',
                },
            ]
        },
    },
];
