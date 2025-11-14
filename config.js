// Configuration file for TECH PARTS HUB
// Database Configuration
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '', // Change this to your MySQL password
    database: 'techparts_hub',
    port: 3306
};

// Server Configuration
const SERVER_CONFIG = {
    port: 3000,
    jwtSecret: 'your_secret_key_change_this_in_production'
};

// API Configuration
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api'
};

// Export for Node.js
module.exports = {
    DB_CONFIG,
    SERVER_CONFIG,
    API_CONFIG
};

