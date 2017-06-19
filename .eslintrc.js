module.exports = {
  root: true,
  parser: 'babel-eslint',
  env: {
    browser: true,
    node: true
  },
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // add your custom rules here
  rules: {'comma-spacing' : "off",
          'quotes' : 'off',
          'key-spacing' : "off",
          'no-unused-vars' : "warn",
          'no-multiple-empty-lines': "off",
          "indent" : "off",
          "space-before-function-paren" : "off",
          "no-trailing-spaces" : "off",
          "padded-blocks" : "off",
          "space-in-parens" : "off",
          "comma-dangle" : "off",
          "no-multi-spaces" : "off",
          "keyword-spacing" : "off",
          "eqeqeq" : "off"

          },
  globals: {}
}
