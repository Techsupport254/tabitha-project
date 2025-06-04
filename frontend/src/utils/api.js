import axios from "axios";

// Create axios instance with default config
const api = axios.create({
	baseURL: process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5001",
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true, // Enable sending cookies
});

// Add request interceptor to handle CORS preflight
api.interceptors.request.use(
	(config) => {
		// Ensure credentials are included in all requests
		config.withCredentials = true;
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Add response interceptor for better error handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		console.error("API Error:", error);
		if (error.code === "ERR_NETWORK") {
			console.error("Network Error Details:", {
				message: error.message,
				code: error.code,
				config: error.config,
				baseURL: process.env.REACT_APP_API_BASE_URL,
			});
		}
		return Promise.reject(error);
	}
);

export default api;
