// API Utility for TECH PARTS HUB
// Base API URL - change this to your server URL
const API_BASE_URL = 'http://localhost:3000/api';

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Set token in localStorage
function setToken(token) {
    localStorage.setItem('token', token);
}

// Remove token from localStorage
function removeToken() {
    localStorage.removeItem('token');
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication API
const authAPI = {
    register: async (userData) => {
        const response = await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (response.token) {
            setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
    },

    login: async (email, password) => {
        const response = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (response.token) {
            setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
    },

    logout: () => {
        removeToken();
        localStorage.removeItem('user');
        sessionStorage.removeItem('session');
    },

    getCurrentUser: async () => {
        return await apiRequest('/user');
    },

    updateUser: async (userData) => {
        const response = await apiRequest('/user', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
    }
};

// Cart API
const cartAPI = {
    getCart: async () => {
        return await apiRequest('/cart');
    },

    addToCart: async (productId, quantity = 1) => {
        return await apiRequest('/cart', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity })
        });
    },

    updateCartItem: async (itemId, quantity) => {
        return await apiRequest(`/cart/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    },

    removeFromCart: async (itemId) => {
        return await apiRequest(`/cart/${itemId}`, {
            method: 'DELETE'
        });
    },

    clearCart: async () => {
        return await apiRequest('/cart', {
            method: 'DELETE'
        });
    }
};

// Products API
const productsAPI = {
    getProducts: async () => {
        return await apiRequest('/products');
    }
};

// Orders API
const ordersAPI = {
    createOrder: async (paymentMethod) => {
        return await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify({ payment_method: paymentMethod })
        });
    },

    getOrders: async () => {
        return await apiRequest('/orders');
    }
};

// Export API functions
window.API = {
    auth: authAPI,
    cart: cartAPI,
    products: productsAPI,
    orders: ordersAPI,
    getToken,
    setToken,
    removeToken
};

