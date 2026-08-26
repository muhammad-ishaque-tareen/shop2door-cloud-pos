// Single source of truth for the backend URL.
// Locally: falls back to your dev server on :5000.
// In production: set VITE_API_URL in your hosting provider's env vars
// (e.g. https://shop2door-backend.onrender.com) — no trailing slash.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
