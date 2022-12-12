module.exports = {
  globalSetup: "<rootDir>/integration/globalSetup.ts",
  testMatch: ["<rootDir>/integration/**/*.test.ts"],
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": ["ts-jest"],
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
};
