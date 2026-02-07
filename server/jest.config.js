module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // 运行所有测试文件
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\.ts$': ['ts-jest', {
      tsconfig: {
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      },
      isolatedModules: true
    }],
  },
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/migrations/**/*.ts', '!src/config/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  // 使用自定义测试环境配置（加载 .env.test 并执行安全检查）
  setupFiles: ['<rootDir>/tests/setup.ts'],
  // 测试环境后置配置（数据库连接管理）
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.ts'],
};