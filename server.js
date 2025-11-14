const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

// Try to load .env, fallback to config.js
try {
    require('dotenv').config();
} catch (e) {
    console.log('dotenv not available, using config.js');
}

// Try to load config.js as fallback
let config = {};
try {
    config = require('./config.js');
} catch (e) {
    console.log('config.js not found, using environment variables or defaults');
}

const app = express();
const PORT = process.env.PORT || config.SERVER_CONFIG?.port || 3000;
const JWT_SECRET = process.env.JWT_SECRET || config.SERVER_CONFIG?.jwtSecret || 'your_secret_key_change_in_production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || config.DB_CONFIG?.host || 'localhost',
    user: process.env.DB_USER || config.DB_CONFIG?.user || 'root',
    password: process.env.DB_PASSWORD || config.DB_CONFIG?.password || '',
    database: process.env.DB_NAME || config.DB_CONFIG?.database || 'techparts_hub',
    port: process.env.DB_PORT || config.DB_CONFIG?.port || 3306
};

let pool;

async function initDatabase() {
    try {
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        // Test connection
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// ==================== AUTHENTICATION ROUTES ====================

// Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, address, password } = req.body;

        // Validation
        if (!name || !email || !phone || !address || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, phone, address, password) VALUES (?, ?, ?, ?, ?)',
            [name, email.toLowerCase(), phone, address, hashedPassword]
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: result.insertId, email: email.toLowerCase() },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Get created user (without password)
        const [user] = await pool.execute(
            'SELECT id, name, email, phone, address, status, member_since FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: user[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user from database
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get current user
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, name, email, phone, address, status, member_since FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user information
app.put('/api/user', authenticateToken, async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        if (!name || !email || !phone || !address) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if email is being changed and if it already exists
        if (email.toLowerCase() !== req.user.email.toLowerCase()) {
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email.toLowerCase(), req.user.id]
            );

            if (existing.length > 0) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        // Update user
        await pool.execute(
            'UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name, email.toLowerCase(), phone, address, req.user.id]
        );

        // Get updated user
        const [users] = await pool.execute(
            'SELECT id, name, email, phone, address, status, member_since FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            message: 'User updated successfully',
            user: users[0]
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== CART ROUTES ====================

// Get user cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const [cartItems] = await pool.execute(
            `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image 
             FROM cart_items ci 
             JOIN products p ON ci.product_id = p.id 
             WHERE ci.user_id = ?`,
            [req.user.id]
        );

        // Format cart items
        const cart = cartItems.map(item => ({
            id: item.id,
            product_id: item.product_id,
            name: item.name,
            price: `$${parseFloat(item.price).toLocaleString()}`,
            amount: parseFloat(item.price),
            img: item.image,
            quantity: item.quantity
        }));

        res.json(cart);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add item to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity || quantity < 1) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }

        // Check if item already in cart
        const [existing] = await pool.execute(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [req.user.id, product_id]
        );

        if (existing.length > 0) {
            // Update quantity
            await pool.execute(
                'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                [quantity, existing[0].id]
            );
        } else {
            // Insert new item
            await pool.execute(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [req.user.id, product_id, quantity]
            );
        }

        res.json({ message: 'Item added to cart' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update cart item quantity
app.put('/api/cart/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Valid quantity is required' });
        }

        await pool.execute(
            'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
            [quantity, id, req.user.id]
        );

        res.json({ message: 'Cart updated' });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove item from cart
app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        await pool.execute(
            'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Clear cart
app.delete('/api/cart', authenticateToken, async (req, res) => {
    try {
        await pool.execute(
            'DELETE FROM cart_items WHERE user_id = ?',
            [req.user.id]
        );

        res.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== PRODUCTS ROUTES ====================

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await pool.execute(
            'SELECT * FROM products ORDER BY id'
        );

        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== ORDERS ROUTES ====================

// Create order (checkout)
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { payment_method } = req.body;

        if (!payment_method) {
            return res.status(400).json({ error: 'Payment method is required' });
        }

        // Get cart items
        const [cartItems] = await pool.execute(
            `SELECT ci.product_id, ci.quantity, p.price 
             FROM cart_items ci 
             JOIN products p ON ci.product_id = p.id 
             WHERE ci.user_id = ?`,
            [req.user.id]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate total
        const totalAmount = cartItems.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        // Create order
        const [orderResult] = await pool.execute(
            'INSERT INTO orders (user_id, total_amount, payment_method) VALUES (?, ?, ?)',
            [req.user.id, totalAmount, payment_method]
        );

        const orderId = orderResult.insertId;

        // Create order items
        for (const item of cartItems) {
            await pool.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        // Clear cart
        await pool.execute(
            'DELETE FROM cart_items WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            message: 'Order created successfully',
            order_id: orderId,
            total_amount: totalAmount
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.execute(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, req.path === '/' ? 'index.html' : req.path));
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});

