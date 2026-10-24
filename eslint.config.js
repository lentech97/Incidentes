const globals = require('globals');

module.exports = [
    {
        ignores: [
            'node_modules/**',
            'coverage/**',
            'reporte-cobertura.txt',
        ],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { avoidEscape: true }],
        },
    },
    {
        files: ['frontend/js/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
];
