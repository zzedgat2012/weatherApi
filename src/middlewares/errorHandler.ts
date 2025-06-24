import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";
import { ApiResponse } from "../models/WeatherModels";

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = error.statusCode || 500;
    const message = error.isOperational ? error.message : "Internal Server Error";
    
    logger.error('Global error handler', {
        error: error.message,
        stack: error.stack,
        statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    const errorResponse = ApiResponse.error(
        message,
        process.env.NODE_ENV === 'development' ? error.stack : undefined
    );

    res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
    const errorResponse = ApiResponse.error(
        "Route not found",
        `The requested route ${req.method} ${req.path} was not found`
    );
    
    logger.warn('Route not found', {
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    res.status(404).json(errorResponse);
};
