import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Match this with your backend port
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject({ message: 'No response from server. Please check your connection.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

export default api;
