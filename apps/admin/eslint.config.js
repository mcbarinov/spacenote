import baseConfig from "@spacenote/common/configs/eslint.config.js"

export default baseConfig.map((config) => {
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
})
