import axios from 'axios';

// Create a single axios instance for all API calls
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    withCredentials: true, // important for refresh tokens stored in cookies
});

// Request interceptor: attach Access Token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401s by refreshing token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't already retried this original request
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to get a new access token using the httpOnly refresh cookie
                const res = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                if (res.status === 200) {
                    const { access_token } = res.data;
                    localStorage.setItem('access_token', access_token);

                    // Retry the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                }
            } catch (err) {
                // Refresh failed (cookie missing/invalid) — force logout
                localStorage.removeItem('access_token');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
