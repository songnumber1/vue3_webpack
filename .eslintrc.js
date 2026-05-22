module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ["plugin:vue/vue3-essential", "eslint:recommended"],
  parserOptions: {
    parser: "@babel/eslint-parser",
    requireConfigFile: false,
  },
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@/assets/styles/components/debug/virtual-keyboard-debug.css",
            message:
              "Debug CSS must stay out of the production index bundle. Load it only through the development-only dynamic import in src/main.js.",
          },
        ],
      },
    ],
  },
};
