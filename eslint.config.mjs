import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "commonjs",
        },
    },
    ...tseslint.configs.recommended.map(conf => ({
        files: ['**/*.ts'],
        ...conf,
    })),
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/array-type': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
        },
    },
    {
        languageOptions: {globals: {...globals.node, ...globals.jest, ...globals.es2021}}
    },
    pluginJs.configs.recommended
];