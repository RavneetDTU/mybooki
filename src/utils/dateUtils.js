/**
 * Date Utility Functions
 * Helper functions for date formatting and manipulation
 */

/**
 * Format date to API format (YYYY-MM-DD)
 * @param {Date} date - JavaScript Date object
 * @returns {string} - Formatted date string (2026-01-22)
 */
export const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Format date to display format (MM/DD/YYYY)
 * @param {Date} date - JavaScript Date object
 * @returns {string} - Formatted date string (01/22/2026)
 */
export const formatDateForDisplay = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

/**
 * Format date to long display format
 * @param {Date} date - JavaScript Date object
 * @returns {string} - Formatted date string (Thursday, January 22, 2026)
 */
export const formatDateLong = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

/**
 * Parse API date string to Date object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} - JavaScript Date object
 */
export const parseAPIDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Get today's date
 * @returns {Date} - Today's date at midnight
 */
export const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

/**
 * Add days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} - New date
 */
export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * Format 24-hour time string to 12-hour format (e.g., "19:00" -> "07:00 PM")
 * @param {string} timeString - 24-hour time string (e.g., "14:30" or "14:30:00")
 * @returns {string} - 12-hour formatted time string
 */
export const formatTime12Hour = (timeString) => {
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return timeString || '';
    const [hourStr, minuteStr] = timeString.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; // the hour '0' should be '12'
    const formattedHour = String(hour).padStart(2, '0');
    return `${formattedHour}:${minute} ${ampm}`;
};
