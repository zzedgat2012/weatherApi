# Testes e Code Coverage - Weather API

Este documento descreve como executar testes e verificar a cobertura de código da Weather API.

## 📋 Configuração de Testes

### Framework de Testes
- **Jest**: Framework de testes JavaScript/TypeScript
- **Supertest**: Para testes de APIs HTTP
- **ts-jest**: Preset do Jest para TypeScript

### Estrutura de Testes
```
tests/
├── setup.ts                    # Configuração global dos testes
├── helpers.ts                  # Funções utilitárias para testes
├── controllers/
│   └── WeatherController.test.ts
├── services/
│   └── WeatherService.test.ts
├── middlewares/
│   └── errorHandler.test.ts
└── models/
    └── WeatherModels.test.ts
```

## 🚀 Executando Testes

### Scripts Disponíveis

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (reexecuta quando arquivos mudam)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage

# Executar testes para CI/CD
npm run test:ci

# Executar testes com saída detalhada
npm run test:verbose

# Executar testes com debug
npm run test:debug
```

### Executar Testes Específicos

```bash
# Executar apenas testes de controllers
npm test -- tests/controllers

# Executar apenas testes de services
npm test -- tests/services

# Executar apenas testes de middlewares
npm test -- tests/middlewares

# Executar apenas testes de models
npm test -- tests/models

# Executar um arquivo específico
npm test -- tests/models/WeatherModels.test.ts

# Executar testes que correspondem a um padrão
npm test -- --testNamePattern="should create"
```

## 📊 Code Coverage

### Configuração de Cobertura
O projeto está configurado para gerar relatórios de cobertura com as seguintes métricas:
- **Statements**: Porcentagem de declarações executadas
- **Branches**: Porcentagem de condições/branches testadas
- **Functions**: Porcentagem de funções testadas
- **Lines**: Porcentagem de linhas executadas

### Limites de Cobertura
Atualmente configurado para:
- Statements: 30%
- Branches: 30%
- Functions: 30%
- Lines: 30%

### Relatórios de Cobertura

```bash
# Gerar relatório de cobertura
npm run test:coverage

# Visualizar relatório HTML
# Após executar o comando acima, abra:
# coverage/lcov-report/index.html
```

### Formatos de Relatório
- **text**: Saída no terminal
- **text-summary**: Resumo no terminal
- **html**: Relatório HTML interativo
- **lcov**: Formato para integração com ferramentas de CI/CD

## 🧪 Tipos de Testes

### Testes Unitários
- **Models**: Testa classes de modelo (WeatherDTO, ApiResponse)
- **Services**: Testa lógica de negócio (WeatherService)
- **Middlewares**: Testa middlewares (errorHandler, requestLogger)

### Testes de Integração
- **Controllers**: Testa endpoints HTTP usando Supertest
- **Database**: Testa operações de banco de dados

### Mocks e Stubs
- **Axios**: Mockado para simular chamadas de API externa
- **Database**: Banco em memória para testes isolados
- **Logs**: Console mockado para testes limpos

## 🔧 Configuração Personalizada

### Arquivo `jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/config/data-source.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  }
};
```

### Arquivo `tests/setup.ts`
- Configuração global de testes
- Inicialização do banco de dados em memória
- Limpeza de dados entre testes
- Mock de logs

## 🔍 Debugging de Testes

### Executar Testes com Debug
```bash
# Executar com informações de debug
npm run test:debug

# Executar teste específico com debug
npm test -- --testNamePattern="should create" --verbose
```

### Logs Durante Testes
Os logs são mockados por padrão, mas você pode ver logs específicos:
```bash
# Ver logs de debug do Jest
DEBUG=jest:* npm test

# Ver logs específicos da aplicação
DEBUG=weather:* npm test
```

## 📈 Melhorando a Cobertura

### Áreas Prioritárias
1. **Controllers**: Testes de endpoints HTTP
2. **Services**: Lógica de negócio
3. **Decorators**: Sistema de decoradores customizados
4. **Routes**: Configuração de rotas

### Exemplo de Teste Completo
```typescript
describe('WeatherController', () => {
  let app: Application;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('should return weather data for valid city', async () => {
    const response = await request(app)
      .get('/api/v1/weather/London')
      .expect(200);

    const body = expectValidApiResponse(response);
    expect(body).toHaveProperty('city');
    expect(body).toHaveProperty('temperature');
  });
});
```

## 🎯 Objetivos de Qualidade

### Meta de Cobertura
- **Curto prazo**: Atingir 50% de cobertura
- **Médio prazo**: Atingir 70% de cobertura
- **Longo prazo**: Atingir 85% de cobertura

### Qualidade dos Testes
- Testes independentes e isolados
- Uso de mocks apropriados
- Testes de cenários de erro
- Documentação clara dos testes

## 🔄 Integração Contínua

### CI/CD Script
```bash
# Script para execução em CI/CD
npm run test:ci
```

### Badge de Cobertura
Após configurar integração com serviços como CodeCov ou Coveralls:
```markdown
[![Coverage Status](https://coveralls.io/repos/github/username/weather_api/badge.svg?branch=main)](https://coveralls.io/github/username/weather_api?branch=main)
```

## 🛠️ Solução de Problemas

### Problemas Comuns

1. **Timeout de Testes**
   - Ajustar `testTimeout` no jest.config.js
   - Usar `jest.setTimeout()` em testes específicos

2. **Banco de Dados**
   - Verificar se o banco em memória está sendo limpo
   - Verificar inicialização do testDataSource

3. **Mocks**
   - Limpar mocks entre testes: `jest.clearAllMocks()`
   - Restaurar implementações originais quando necessário

### Logs de Debug
```bash
# Habilitar logs de debug
DEBUG=weather:* npm test

# Ver apenas logs de erro
LOG_LEVEL=error npm test
```

## 📚 Recursos Adicionais

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeScript + Jest](https://kulshekhar.github.io/ts-jest/)
- [Code Coverage Best Practices](https://martinfowler.com/bliki/TestCoverage.html)
