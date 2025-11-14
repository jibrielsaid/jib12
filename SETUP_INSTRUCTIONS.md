# TECH PARTS HUB - MySQL Database Setup Instructions

## Quick Start Guide

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup MySQL Database

1. **Start MySQL Server**
   - Make sure MySQL is running on your system

2. **Create Database**
   ```bash
   mysql -u root -p < database.sql
   ```
   
   Or manually in MySQL:
   ```sql
   source database.sql;
   ```

3. **Update Database Credentials**
   
   Option A: Create `.env` file (Recommended)
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=techparts_hub
   DB_PORT=3306
   JWT_SECRET=your_secret_key_here
   PORT=3000
   ```
   
   Option B: Update `config.js`
   ```javascript
   const DB_CONFIG = {
       host: 'localhost',
       user: 'root',
       password: 'your_mysql_password', // Update this
       database: 'techparts_hub',
       port: 3306
   };
   ```

### Step 3: Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### Step 4: Update Frontend Files

Add the API script to all HTML files that need database access:
```html
<script src="api.js"></script>
```

**Files that need updating:**
- ✅ `account.html` - Already updated
- `myaccount.html` - Needs API integration
- `cart.html` - Needs API integration  
- `shop.html` - Needs API integration

### Step 5: Test the Setup

1. Open `http://localhost:3000/account.html`
2. Try creating a new account
3. Try logging in
4. Check MySQL database to verify data is being saved

## Database Tables

- **users** - User accounts with authentication
- **products** - Product catalog (pre-populated with sample data)
- **cart_items** - Shopping cart items per user
- **orders** - Order records
- **order_items** - Order line items

## API Endpoints

All API endpoints are prefixed with `/api`

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/user` - Get current user (requires auth token)
- `PUT /api/user` - Update user info (requires auth token)

### Cart
- `GET /api/cart` - Get user cart (requires auth token)
- `POST /api/cart` - Add item to cart (requires auth token)
- `PUT /api/cart/:id` - Update cart item (requires auth token)
- `DELETE /api/cart/:id` - Remove item (requires auth token)
- `DELETE /api/cart` - Clear cart (requires auth token)

### Products
- `GET /api/products` - Get all products

### Orders
- `POST /api/orders` - Create order/checkout (requires auth token)
- `GET /api/orders` - Get user orders (requires auth token)

## Troubleshooting

### "Cannot connect to database"
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env` or `config.js`
- Ensure database exists: `SHOW DATABASES;`

### "Port 3000 already in use"
- Change PORT in `.env` or `config.js`
- Or kill process: `lsof -ti:3000 | xargs kill`

### "Module not found" errors
- Run `npm install` again
- Check `package.json` dependencies

### CORS errors
- Make sure API base URL in `api.js` matches server URL
- Check server is running on correct port

## Migration Notes

The application now uses MySQL instead of localStorage. The API utility (`api.js`) provides functions that work similarly to localStorage:

**Before (localStorage):**
```javascript
localStorage.setItem('user', JSON.stringify(user));
const cart = JSON.parse(localStorage.getItem('cart'));
```

**After (API):**
```javascript
await API.auth.register(userData);
const cart = await API.cart.getCart();
```

## Security Features

- ✅ Passwords are hashed using bcrypt
- ✅ JWT tokens for authentication
- ✅ Prepared statements (SQL injection protection)
- ✅ Input validation on server-side
- ✅ CORS enabled for API access

## Next Steps

1. Update remaining HTML files to use API
2. Test all functionality
3. Deploy to production server
4. Use HTTPS in production
5. Change JWT_SECRET to a strong random string

