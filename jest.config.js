module.exports = {
  // Preset para TypeScript
  preset: 'ts-jest',
  
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Padrão de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Diretórios de teste
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Configuração de coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Arquivo de entrada principal
    '!src/config/data-source.ts', // Configuração de banco
  ],
  
  // Thresholds de coverage mais baixos para começar
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  },
  
  // Formato de relatório de coverage
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // Diretório de saída do coverage
  coverageDirectory: 'coverage',
  
  // Setup antes dos testes
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Timeout para testes
  testTimeout: 10000,
  
  // Transformações
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  
  // Extensões de arquivo
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Ignorar node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};
