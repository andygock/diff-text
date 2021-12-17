module.exports = {
  env: {
    browser: true,
    es6: true,
    mocha: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  parser: "babel-eslint",
  plugins: ["react", "react-hooks", "prettier"],
  rules: {
    "no-unused-vars": 0,
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/jsx-wrap-multilines": [
      "error",
      { arrow: true, return: true, declaration: true },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
