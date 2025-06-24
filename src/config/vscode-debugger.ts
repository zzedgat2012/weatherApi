import { debugService, logger } from '../config/logger';

/**
 * VSCode Debug Integration Utility
 * Provides methods to interact with VSCode's Debug Console and Watch window
 */
export class VSCodeDebugger {
    private static watchVariables = new Map<string, any>();
    private static debugConsoleEnabled = process.env.NODE_ENV === 'development';

    /**
     * Add a variable to VSCode Watch window
     */
    static watch(name: string, value: any, description?: string): void {
        this.watchVariables.set(name, {
            value,
            description,
            timestamp: new Date().toISOString(),
            type: typeof value
        });

        if (this.debugConsoleEnabled) {
            console.log(`[WATCH] ${name}:`, value);
            if (description) {
                console.log(`[WATCH] ${name} - ${description}`);
            }
        }

        debugService(`[WATCH] ${name}`, value);
        logger.debug('Watch variable updated', { name, value, description });
    }

    /**
     * Log to VSCode Debug Console
     */
    static log(message: string, data?: any): void {
        if (this.debugConsoleEnabled) {
            if (data) {
                console.log(`[DEBUG] ${message}`, data);
            } else {
                console.log(`[DEBUG] ${message}`);
            }
        }
        debugService(message, data);
    }

    /**
     * Log warning to VSCode Debug Console
     */
    static warn(message: string, data?: any): void {
        if (this.debugConsoleEnabled) {
            if (data) {
                console.warn(`[WARN] ${message}`, data);
            } else {
                console.warn(`[WARN] ${message}`);
            }
        }
        debugService(`[WARN] ${message}`, data);
    }

    /**
     * Log error to VSCode Debug Console
     */
    static error(message: string, error?: Error | any): void {
        if (this.debugConsoleEnabled) {
            if (error) {
                console.error(`[ERROR] ${message}`, error);
            } else {
                console.error(`[ERROR] ${message}`);
            }
        }
        debugService(`[ERROR] ${message}`, error);
    }

    /**
     * Create a breakpoint with custom data
     */
    static breakpoint(name: string, data: any, condition = true): void {
        if (condition && this.debugConsoleEnabled) {
            this.watch(`breakpoint_${name}`, data, `Breakpoint: ${name}`);
            console.log(`[BREAKPOINT] ${name}`, data);
            debugger; // This will trigger VSCode debugger
        }
    }

    /**
     * Get all watched variables (useful for debugging)
     */
    static getWatchedVariables(): Record<string, any> {
        const result: Record<string, any> = {};
        this.watchVariables.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    /**
     * Clear all watched variables
     */
    static clearWatch(): void {
        this.watchVariables.clear();
        if (this.debugConsoleEnabled) {
            console.log('[DEBUG] Watch variables cleared');
        }
    }

    /**
     * Monitor object property changes
     */
    static monitorObject<T extends object>(obj: T, name: string): T {
        return new Proxy(obj, {
            set: (target, property, value) => {
                this.watch(`${name}.${String(property)}`, value, `Property change in ${name}`);
                (target as any)[property] = value;
                return true;
            },
            get: (target, property) => {
                const value = (target as any)[property];
                if (typeof value === 'object' && value !== null) {
                    return this.monitorObject(value, `${name}.${String(property)}`);
                }
                return value;
            }
        });
    }

    /**
     * Time a function execution and log to debug console
     */
    static timeFunction<T extends (...args: any[]) => any>(
        fn: T, 
        name: string
    ): (...args: Parameters<T>) => ReturnType<T> {
        return (...args: Parameters<T>): ReturnType<T> => {
            const start = Date.now();
            this.log(`Starting ${name}`, { args });
            
            try {
                const result = fn(...args);
                
                if (result instanceof Promise) {
                    return result.then(
                        (data) => {
                            const duration = Date.now() - start;
                            this.log(`${name} completed`, { duration: `${duration}ms`, result: data });
                            this.watch(`${name}_duration`, duration, `Last execution time for ${name}`);
                            return data;
                        },
                        (error) => {
                            const duration = Date.now() - start;
                            this.error(`${name} failed`, { duration: `${duration}ms`, error });
                            this.watch(`${name}_error`, error, `Last error for ${name}`);
                            throw error;
                        }
                    ) as ReturnType<T>;
                } else {
                    const duration = Date.now() - start;
                    this.log(`${name} completed`, { duration: `${duration}ms`, result });
                    this.watch(`${name}_duration`, duration, `Last execution time for ${name}`);
                    return result;
                }
            } catch (error) {
                const duration = Date.now() - start;
                this.error(`${name} failed`, { duration: `${duration}ms`, error });
                this.watch(`${name}_error`, error, `Last error for ${name}`);
                throw error;
            }
        };
    }
}

// Global access for easy debugging
declare global {
    var $debug: typeof VSCodeDebugger;
}

if (typeof global !== 'undefined') {
    global.$debug = VSCodeDebugger;
}

export default VSCodeDebugger;
