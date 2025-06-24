import { NextFunction, Request, Response } from "express";
import { debugAPI, logger } from "../config/logger";

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    
    debugAPI(`${req.method} ${req.path}`);
    logger.info('Request received', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        params: req.params
    });
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        debugAPI(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
        logger.info('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });
    
    next();
};
