import { debugService, logger } from '../config/logger';
import VSCodeDebugger from '../config/vscode-debugger';

// VSCode Debug Integration
declare global {
    var __vscode_debug: {
        watchValues: Map<string, any>;
        debugConsole: {
            log: (message: string, ...args: any[]) => void;
            warn: (message: string, ...args: any[]) => void;
            error: (message: string, ...args: any[]) => void;
        };
    };
}

// Initialize VSCode debug integration
if (typeof global !== 'undefined') {
    global.__vscode_debug = {
        watchValues: new Map(),
        debugConsole: {
            log: (message: string, ...args: any[]) => {
                console.log(`[DEBUG] ${message}`, ...args);
                debugService(message, ...args);
            },
            warn: (message: string, ...args: any[]) => {
                console.warn(`[WARN] ${message}`, ...args);
                debugService(`[WARN] ${message}`, ...args);
            },
            error: (message: string, ...args: any[]) => {
                console.error(`[ERROR] ${message}`, ...args);
                debugService(`[ERROR] ${message}`, ...args);
            }
        }
    };
}

/**
 * Decorator to watch variable values in VSCode Debug Console
 */
export function DebugWatch(watchName?: string) {
    return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
        const name = watchName || `${target.constructor.name}.${propertyKey}`;
        
        if (descriptor) {
            // Method decorator
            const method = descriptor.value;
            descriptor.value = function (...args: any[]) {
                const result = method.apply(this, args);
                
                // Add to watch values
                if (global.__vscode_debug) {
                    global.__vscode_debug.watchValues.set(`${name}_args`, args);
                    global.__vscode_debug.watchValues.set(`${name}_result`, result);
                    global.__vscode_debug.debugConsole.log(`[WATCH] ${name}`, { args, result });
                }
                
                return result;
            };
        } else {
            // Property decorator
            let value: any;
            Object.defineProperty(target, propertyKey, {
                get() {
                    if (global.__vscode_debug) {
                        global.__vscode_debug.watchValues.set(name, value);
                    }
                    return value;
                },
                set(newValue) {
                    value = newValue;
                    if (global.__vscode_debug) {
                        global.__vscode_debug.watchValues.set(name, newValue);
                        global.__vscode_debug.debugConsole.log(`[WATCH] ${name} changed`, newValue);
                    }
                }
            });
        }
    };
}

/**
 * Decorator to add breakpoints and debug information
 */
export function DebugBreakpoint(condition?: (args: any[]) => boolean) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        
        descriptor.value = function (...args: any[]) {
            const className = target.constructor.name;
            const shouldBreak = condition ? condition(args) : true;
            
            if (shouldBreak && global.__vscode_debug) {
                global.__vscode_debug.debugConsole.log(`[BREAKPOINT] ${className}.${propertyName}`, {
                    args,
                    context: this,
                    timestamp: new Date().toISOString()
                });
                
                // Add breakpoint data to watch
                global.__vscode_debug.watchValues.set(`breakpoint_${className}_${propertyName}`, {
                    args,
                    context: this,
                    timestamp: new Date().toISOString()
                });
                
                // Trigger debugger (only in development)
                if (process.env.NODE_ENV === 'development') {
                    debugger; // This will trigger VSCode debugger
                }
            }
            
            return method.apply(this, args);
        };
        
        return descriptor;
    };
}

/**
 * Enhanced Method decorator with VSCode Debug Console integration
 */
export function LogMethod(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
        const className = target.constructor.name;
        const methodInfo = `[${className}] ${propertyName}`;
        
        // Log to VSCode Debug Console
        if (global.__vscode_debug) {
            global.__vscode_debug.debugConsole.log(`Calling ${methodInfo}`, { args });
            global.__vscode_debug.watchValues.set(`${className}_${propertyName}_lastCall`, {
                args,
                timestamp: new Date().toISOString()
            });
        }
        
        debugService(`${methodInfo} called`);
        logger.debug('Method called', { 
            class: className, 
            method: propertyName, 
            args: args.length 
        });
        
        const start = Date.now();
        
        try {
            const result = method.apply(this, args);
            
            // Handle async methods
            if (result instanceof Promise) {
                return result
                    .then((data) => {
                        const duration = Date.now() - start;
                        const successInfo = `${methodInfo} completed (${duration}ms)`;
                        
                        if (global.__vscode_debug) {
                            global.__vscode_debug.debugConsole.log(successInfo, { data, duration });
                            global.__vscode_debug.watchValues.set(`${className}_${propertyName}_lastResult`, {
                                data,
                                duration,
                                success: true,
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        debugService(successInfo);
                        logger.debug('Method completed', { 
                            class: className, 
                            method: propertyName, 
                            duration: `${duration}ms`,
                            success: true 
                        });
                        return data;
                    })
                    .catch((error) => {
                        const duration = Date.now() - start;
                        const errorInfo = `${methodInfo} failed (${duration}ms)`;
                        
                        if (global.__vscode_debug) {
                            global.__vscode_debug.debugConsole.error(errorInfo, { 
                                error: error instanceof Error ? error.message : String(error), 
                                duration 
                            });
                            global.__vscode_debug.watchValues.set(`${className}_${propertyName}_lastError`, {
                                error: error instanceof Error ? error.message : String(error),
                                stack: error instanceof Error ? error.stack : undefined,
                                duration,
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        debugService(`${errorInfo}:`, error);
                        logger.error('Method failed', { 
                            class: className, 
                            method: propertyName, 
                            duration: `${duration}ms`,
                            error: error.message 
                        });
                        throw error;
                    });
            }
            
            // Handle sync methods
            const duration = Date.now() - start;
            const successInfo = `${methodInfo} completed (${duration}ms)`;
            
            if (global.__vscode_debug) {
                global.__vscode_debug.debugConsole.log(successInfo, { result, duration });
                global.__vscode_debug.watchValues.set(`${className}_${propertyName}_lastResult`, {
                    result,
                    duration,
                    success: true,
                    timestamp: new Date().toISOString()
                });
            }
            
            debugService(successInfo);
            logger.debug('Method completed', { 
                class: className, 
                method: propertyName, 
                duration: `${duration}ms`,
                success: true 
            });
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            const errorInfo = `${methodInfo} failed (${duration}ms)`;
            
            if (global.__vscode_debug) {
                global.__vscode_debug.debugConsole.error(errorInfo, { 
                    error: error instanceof Error ? error.message : String(error), 
                    duration 
                });
                global.__vscode_debug.watchValues.set(`${className}_${propertyName}_lastError`, {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    duration,
                    timestamp: new Date().toISOString()
                });
            }
            
            debugService(`${errorInfo}:`, error);
            logger.error('Method failed', { 
                class: className, 
                method: propertyName, 
                duration: `${duration}ms`,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    };
    
    return descriptor;
}

/**
 * Method decorator for validating parameters
 */
export function ValidateParams(...validators: Array<(value: any) => boolean>) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        
        descriptor.value = function (...args: any[]) {
            const className = target.constructor.name;
            
            for (let i = 0; i < validators.length && i < args.length; i++) {
                if (!validators[i](args[i])) {
                    const error = new Error(`Invalid parameter at position ${i} for method ${propertyName}`);
                    debugService(`[${className}] Parameter validation failed for ${propertyName}`);
                    logger.error('Parameter validation failed', {
                        class: className,
                        method: propertyName,
                        parameterIndex: i,
                        value: args[i]
                    });
                    throw error;
                }
            }
            
            return method.apply(this, args);
        };
        
        return descriptor;
    };
}

/**
 * Class decorator for automatic logging setup
 */
export function LoggableClass(target: any) {
    const className = target.name;
    debugService(`[${className}] Class instantiated with logging`);
    logger.debug('Class registered', { class: className });
    return target;
}

/**
 * Property decorator for configuration validation
 */
export function ConfigProperty(required: boolean = true) {
    return function (target: any, propertyKey: string) {
        const className = target.constructor.name;
        
        if (required) {
            Object.defineProperty(target, propertyKey, {
                get() {
                    const value = this[`_${propertyKey}`];
                    if (value === undefined || value === null) {
                        const error = new Error(`Required configuration property '${propertyKey}' is not set in ${className}`);
                        debugService(`[${className}] Missing required config: ${propertyKey}`);
                        logger.error('Missing required configuration', {
                            class: className,
                            property: propertyKey
                        });
                        throw error;
                    }
                    return value;
                },
                set(value) {
                    this[`_${propertyKey}`] = value;
                    debugService(`[${className}] Configuration set: ${propertyKey}`);
                    logger.debug('Configuration updated', {
                        class: className,
                        property: propertyKey,
                        hasValue: !!value
                    });
                }
            });
        }
    };
}

/**
 * Advanced decorator for VSCode debugging with watch integration
 */
export function VSCodeDebug(options: {
    watch?: boolean;
    breakpoint?: boolean;
    logArgs?: boolean;
    logResult?: boolean;
    condition?: (args: any[]) => boolean;
} = {}) {
    const { watch = true, breakpoint = false, logArgs = true, logResult = true, condition } = options;

    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        const className = target.constructor.name;
        const methodKey = `${className}.${propertyName}`;

        descriptor.value = function (...args: any[]) {
            const shouldDebug = condition ? condition(args) : true;

            if (shouldDebug) {
                // Log method call
                VSCodeDebugger.log(`Calling ${methodKey}`, logArgs ? { args } : undefined);

                // Add to watch if enabled
                if (watch) {
                    VSCodeDebugger.watch(`${methodKey}_args`, args, `Arguments for ${methodKey}`);
                    VSCodeDebugger.watch(`${methodKey}_context`, this, `Context for ${methodKey}`);
                }

                // Breakpoint if enabled
                if (breakpoint) {
                    VSCodeDebugger.breakpoint(methodKey, { args, context: this });
                }
            }

            const start = Date.now();

            try {
                const result = method.apply(this, args);

                if (result instanceof Promise) {
                    return result.then(
                        (data) => {
                            const duration = Date.now() - start;
                            if (shouldDebug) {
                                VSCodeDebugger.log(`${methodKey} completed (${duration}ms)`, 
                                    logResult ? { result: data } : undefined);
                                if (watch) {
                                    VSCodeDebugger.watch(`${methodKey}_result`, data, `Last result for ${methodKey}`);
                                    VSCodeDebugger.watch(`${methodKey}_duration`, duration, `Last duration for ${methodKey}`);
                                }
                            }
                            return data;
                        },
                        (error) => {
                            const duration = Date.now() - start;
                            if (shouldDebug) {
                                VSCodeDebugger.error(`${methodKey} failed (${duration}ms)`, error);
                                if (watch) {
                                    VSCodeDebugger.watch(`${methodKey}_error`, error, `Last error for ${methodKey}`);
                                }
                            }
                            throw error;
                        }
                    );
                }

                const duration = Date.now() - start;
                if (shouldDebug) {
                    VSCodeDebugger.log(`${methodKey} completed (${duration}ms)`, 
                        logResult ? { result } : undefined);
                    if (watch) {
                        VSCodeDebugger.watch(`${methodKey}_result`, result, `Last result for ${methodKey}`);
                        VSCodeDebugger.watch(`${methodKey}_duration`, duration, `Last duration for ${methodKey}`);
                    }
                }
                return result;
            } catch (error) {
                const duration = Date.now() - start;
                if (shouldDebug) {
                    VSCodeDebugger.error(`${methodKey} failed (${duration}ms)`, error);
                    if (watch) {
                        VSCodeDebugger.watch(`${methodKey}_error`, error, `Last error for ${methodKey}`);
                    }
                }
                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * Property decorator for watching property changes in VSCode
 */
export function WatchProperty(description?: string) {
    return function (target: any, propertyKey: string) {
        const className = target.constructor.name;
        const watchKey = `${className}.${propertyKey}`;
        
        let value: any;
        
        Object.defineProperty(target, propertyKey, {
            get() {
                return value;
            },
            set(newValue) {
                const oldValue = value;
                value = newValue;
                
                VSCodeDebugger.watch(watchKey, newValue, description || `Property ${watchKey}`);
                VSCodeDebugger.log(`Property ${watchKey} changed`, { 
                    oldValue, 
                    newValue,
                    timestamp: new Date().toISOString()
                });
            },
            enumerable: true,
            configurable: true
        });
    };
}

// Validation functions
export const isValidString = (value: any): boolean => typeof value === 'string' && value.trim().length > 0;
export const isValidCity = (city: any): boolean => isValidString(city) && city.length >= 2 && city.length <= 100;
