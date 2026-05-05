/**
 * API Configuration
 * Central configuration for all API-related constants
 */

// Base URL for all API requests
export const API_BASE_URL = 'https://mybookiapis.booki.co.za';

// API timeout in milliseconds
export const API_TIMEOUT = 30000; // 30 seconds

// Request headers
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

// Environment check
export const isDevelopment = import.meta.env.MODE === 'development';
export const isProduction = import.meta.env.MODE === 'production';
