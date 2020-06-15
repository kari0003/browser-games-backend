module.exports = {
  extends: ['@codingsans/eslint-config/typescript-recommended'],
  rules: {
    complexity: ['error', 6],
    curly: 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
  parserOptions: {
    project: 'tsconfig.json',
  },
};
