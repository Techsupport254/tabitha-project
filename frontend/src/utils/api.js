import axios from "axios";

// Create a simple cache for GET requests
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Create axios instance with default config
const api = axios.create({
	baseURL: process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5001",
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true, // Enable sending cookies
});

// Add request interceptor to handle caching and CORS preflight
api.interceptors.request.use(
	(config) => {
		// Ensure credentials are included in all requests
		config.withCredentials = true;

		// Only cache GET requests
		if (config.method === "get") {
			const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
			const cachedResponse = cache.get(cacheKey);

			if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
				// Return cached response
				return Promise.reject({
					__CACHE__: true,
					data: cachedResponse.data,
				});
			}
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Add response interceptor to handle caching
api.interceptors.response.use(
	(response) => {
		// Cache successful GET responses
		if (response.config.method === "get") {
			const cacheKey = `${response.config.url}${JSON.stringify(
				response.config.params || {}
			)}`;
			cache.set(cacheKey, {
				data: response.data,
				timestamp: Date.now(),
			});
		}
		return response;
	},
	(error) => {
		// Handle cached responses
		if (error.__CACHE__) {
			return Promise.resolve({ data: error.data });
		}
		return Promise.reject(error);
	}
);

// Add method to clear cache
api.clearCache = (url = null) => {
	if (url) {
		// Clear specific URL cache
		for (const key of cache.keys()) {
			if (key.startsWith(url)) {
				cache.delete(key);
			}
		}
	} else {
		// Clear all cache
		cache.clear();
	}
};

// Add method to clear user-related cache
api.clearUserCache = () => {
	api.clearCache("/api/user");
};

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
