module.exports = {
  extends: [
    'airbnb-base',
    'plugin:jest/recommended',
  ],
  rules: {
    quotes: [2,"double",{"avoidEscape": true}]
  },
  plugins: [
    'import',
    'jest',
  ],
  env: {
    node: true,
    'jest/globals': true,
  },
};
