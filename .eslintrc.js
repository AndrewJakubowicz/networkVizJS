module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "no-null",
        "jsdoc"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    "rules": {
        "@typescript-eslint/naming-convention": ["error", {"selector": "typeLike", "format": ["PascalCase"]}],
        "@typescript-eslint/indent": "error",
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/quotes": [
            "error",
            "double",
            {
                "avoidEscape": true
            }
        ],
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/type-annotation-spacing": "error",
        "no-null/no-null": "error",
        "no-trailing-spaces": "error",
        "no-var": "error",
        "prefer-const": "error",
        "spaced-comment": "error",
        "brace-style": "error",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "jsdoc/check-alignment": 1,
        "jsdoc/check-syntax": 1,
        "jsdoc/check-types": 1,
        "jsdoc/check-param-names": 1,
        "jsdoc/check-tag-names": 1,
    }
};
