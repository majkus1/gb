// export const API_URL = process.env.REACT_APP_API_URL ||
//   (process.env.NODE_ENV === 'production' ? 'https://api.planopia.pl' : 'http://localhost:3000');
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production'
    ? 'https://nodex.goplusbet.pl'
    : 'http://localhost:3000');
