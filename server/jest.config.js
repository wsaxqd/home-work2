module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // 运行所有测试文件
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\.ts$': 'ts-jest',
  },
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/migrations/**/*.ts', '!src/config/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  setupFiles: ['dotenv/config'],
};