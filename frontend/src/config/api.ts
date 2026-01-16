// API Configuration
// In production, API calls go to the same domain (Railway serves both frontend and backend)
// In development, API calls go to localhost:3001

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const API_BASE_URL = apiUrl || (isDevelopment ? 'http://localhost:3001' : '');

export const getApiUrl = (path: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
