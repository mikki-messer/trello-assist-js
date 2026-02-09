import js from "@eslint/js";
import globals from "globals";

export default [
  // ignore files
  {
    ignores: [
      "node_modules/",
      "logs/",
      "*.db",
      "*.db-wal",
      "*.db-shm",
      "backups/"
    ]
  },
  
  // configuration for all js files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      
      // allow console.log
      "no-console": "off",
      
      // unused vars - warning
      "no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      
      // debugger - warning
      "no-debugger": "warn",
      
      // const - warning
      "prefer-const": "warn",
      
      // require === 
      "eqeqeq": ["error", "always"],
      
      // forbid var
      "no-var": "error"
    }
  }
];