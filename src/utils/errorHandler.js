/**
 * Error Handler Utility
 * Centralized error handling and user-friendly messages
 */

/**
 * Extract error message from different error formats
 */
export const getErrorMessage = (error) => {
    // API error with response
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    // API error with error field
    if (error.response?.data?.error) {
        return error.response.data.error;
    }

    // Network error
    if (error.request && !error.response) {
        return 'Network error. Please check your internet connection.';
    }

    // Generic error
    if (error.message) {
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
};

/**
 * Get user-friendly error message based on status code
 */
export const getStatusMessage = (status) => {
    const messages = {
        400: 'Invalid request. Please check your input.',
        401: 'Unauthorized. Please login again.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        500: 'Server error. Please try again later.',
        502: 'Bad gateway. The server is temporarily unavailable.',
        503: 'Service unavailable. Please try again later.',
    };

    return messages[status] || 'An error occurred. Please try again.';
};

/**
 * Handle API errors and return user-friendly message
 */
export const handleApiError = (error, customMessage = null) => {
    const message = customMessage || getErrorMessage(error);

    // Log error in development
    if (import.meta.env.MODE === 'development') {
        console.error('API Error:', {
            message,
            status: error.response?.status,
            data: error.response?.data,
            error,
        });
    }

    return message;
};
