# 🐛 VSCode Debugging Guide - Weather API

## Como usar o Debug Console e Watch Window

### 🎯 **Configurações de Debug Disponíveis:**

1. **🚀 Debug Weather API (VSCode Integration)** - Configuração principal com integração completa
2. **🐛 Debug with Breakpoints & Watch** - Para debugging detalhado com breakpoints
3. **🔍 Debug Production Build** - Para debuggar o build compilado
4. **📊 Debug with Full Database Logging** - Com logging completo do TypeORM

### 📊 **Variáveis Monitoradas no Watch Window:**

Quando você usar as configurações de debug, as seguintes variáveis aparecerão automaticamente no **Watch Window**:

#### **WeatherService Variables:**

- `WeatherService.currentCity` - Cidade sendo processada atualmente
- `WeatherService.apiRequest` - Parâmetros da requisição para a API
- `WeatherService.apiResponse` - Resposta bruta da API do OpenWeather
- `WeatherService.rawData` - Dados brutos antes da formatação
- `WeatherService.formattedData` - Dados formatados para retorno
- `WeatherService.weatherToPersist` - Dados que serão salvos no banco
- `WeatherService.createdLog` - Entidade criada para persistência
- `WeatherService.savedLogId` - ID do log salvo no banco
- `WeatherService.lastError` - Último erro encontrado
- `WeatherService.axiosError` - Detalhes de erros HTTP

#### **Breakpoint Data:**

- `breakpoint_WeatherService_getWeather` - Dados do breakpoint no método principal
- `WeatherService_getWeather_lastCall` - Informações da última chamada do método
- `WeatherService_getWeather_lastResult` - Último resultado retornado
- `WeatherService_getWeather_lastError` - Último erro ocorrido

### 🔧 **Como Usar:**

1. **Inicie o Debug:**
   - Vá para **Run and Debug** (Ctrl+Shift+D)
   - Selecione uma das configurações disponíveis
   - Clique em **Start Debugging** (F5)

2. **Monitorar Variáveis:**
   - Abra o **Watch Panel** (View → Debug → Watch)
   - As variáveis aparecerão automaticamente quando os métodos forem executados
   - Você pode adicionar expressões customizadas clicando no **+**

3. **Debug Console:**
   - Abra o **Debug Console** (View → Debug Console)
   - Veja os logs em tempo real com prefixos `[DEBUG]`, `[WARN]`, `[ERROR]`
   - Use `$debug.log("message")` para logs customizados

### 🎮 **Comandos Disponíveis no Debug Console:**

```javascript
// Acessar o debugger global
$debug.log("Custom message", { data: "example" });
$debug.warn("Warning message");
$debug.error("Error message");

// Monitorar variáveis customizadas
$debug.watch("myVariable", someValue, "Description");

// Ver todas as variáveis monitoradas
$debug.getWatchedVariables();

// Limpar variáveis monitoradas
$debug.clearWatch();

// Criar breakpoint condicional
$debug.breakpoint("myBreakpoint", { data: "test" }, condition);
```

### 🚨 **Breakpoints Automáticos:**

Para ativar breakpoints automáticos, modifique os decorators:

```typescript
@VSCodeDebug({ 
    watch: true, 
    breakpoint: true,  // <- ative isto
    condition: (args) => args[0] === "London" // <- condição opcional
})
```

### 📱 **Testando o Debug:**

1. **Inicie o servidor** com uma das configurações de debug
2. **Faça uma requisição** para `http://localhost:3000/weather/London`
3. **Observe o Watch Window** para ver as variáveis sendo atualizadas em tempo real
4. **Verifique o Debug Console** para logs detalhados

### 🔍 **Expressões Úteis para o Watch:**

Adicione estas expressões manualmente no Watch Window:

```javascript
// Estado do banco de dados
global.__vscode_debug.watchValues

// Última requisição HTTP
process.env.DEBUG

// Informações do processo
process.pid
process.uptime()

// Memória utilizada
process.memoryUsage()
```

### 🎯 **Dicas Avançadas:**

1. **Source Maps:** Habilitados automaticamente para debugging preciso
2. **Smart Step:** Pula código desnecessário automaticamente  
3. **Auto Attach:** Conecta automaticamente a processos filhos
4. **Restart:** Reinicia automaticamente quando o código muda

### 🐞 **Troubleshooting:**

- Se as variáveis não aparecem no Watch, verifique se `VSCODE_DEBUG=true` está nas env vars
- Para mais logs, use `DEBUG=weather:*,typeorm:*`
- Se os breakpoints não funcionam, verifique se os source maps estão habilitados

---

#### Agora você pode fazer debugging profissional diretamente no VSCode! 🚀
