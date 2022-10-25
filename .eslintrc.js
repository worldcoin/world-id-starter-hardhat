module.exports = {
    env: {
        browser: false,
        es2021: true,
        mocha: true,
        node: true,
    },
    settings: {
        node: {
            tryExtensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
    },
    plugins: ['@typescript-eslint'],
    extends: ['standard', 'plugin:node/recommended', 'prettier'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
    },
}
