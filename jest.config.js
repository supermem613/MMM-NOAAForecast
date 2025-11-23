module.exports = {
  verbose: true,
  testTimeout: 20000,
  testMatch: ["**/tests/**/*_spec.js"],
  moduleNameMapper: {
    logger: "<rootDir>/js/logger.js"
  },
  collectCoverageFrom: ["*.js"],
  coverageReporters: ["lcov", "text"],
  coverageProvider: "v8"
};
