import baseConfig from "@spacenote/common/configs/eslint.config.js"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores([".vite"]),
  ...baseConfig.map((config) => {
    if (!config.languageOptions) {
      return config
    }

    return {
      ...config,
      languageOptions: {
        ...config.languageOptions,
        parserOptions: {
          ...config.languageOptions.parserOptions,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    }
  }),
])
