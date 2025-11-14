# TECH PARTS HUB - MySQL Database Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)
- npm or yarn

## Installation Steps

### 1. Install MySQL
Make sure MySQL is installed and running on your system.

### 2. Create Database
```bash
# Login to MySQL
mysql -u root -p

# Run the database schema
mysql -u root -p < database.sql
```

Or manually:
```sql
CREATE DATABASE techparts_hub;
USE techparts_hub;
-- Then copy and paste the contents of database.sql
```

### 3. Install Node.js Dependencies
```bash
npm install
```

### 4. Configure Database Connection

Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=techparts_hub
DB_PORT=3306

JWT_SECRET=your_secret_key_here_change_this_in_production
PORT=3000
```

Or update the `config.js` file with your MySQL credentials.

### 5. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000`

### 6. Update Frontend API URL

Make sure the `api.js` file has the correct API URL:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### 7. Include API Script in HTML Files

Add this script tag before your other scripts in each HTML file:
```html
<script src="api.js"></script>
```

## Database Schema

### Tables Created:
- **users** - User accounts
- **products** - Product catalog
- **cart_items** - Shopping cart items
- **orders** - Order records
- **order_items** - Order line items

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/user` - Get current user (requires auth)
- `PUT /api/user` - Update user info (requires auth)

### Cart
- `GET /api/cart` - Get user cart (requires auth)
- `POST /api/cart` - Add item to cart (requires auth)
- `PUT /api/cart/:id` - Update cart item (requires auth)
- `DELETE /api/cart/:id` - Remove item from cart (requires auth)
- `DELETE /api/cart` - Clear cart (requires auth)

### Products
- `GET /api/products` - Get all products

### Orders
- `POST /api/orders` - Create order/checkout (requires auth)
- `GET /api/orders` - Get user orders (requires auth)

## Migration from localStorage

The frontend code needs to be updated to use the API instead of localStorage. The API utility (`api.js`) provides functions that match the localStorage functionality:

- `API.auth.register()` - Instead of localStorage account creation
- `API.auth.login()` - Instead of localStorage login
- `API.cart.getCart()` - Instead of localStorage.getItem('cart')
- `API.cart.addToCart()` - Instead of localStorage cart manipulation
- etc.

## Troubleshooting

### Database Connection Error
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env` or `config.js`
- Ensure database exists: `SHOW DATABASES;`

### Port Already in Use
- Change PORT in `.env` or `config.js`
- Or kill the process using port 3000

### CORS Errors
- Make sure the API base URL matches your server URL
- Check that the server is running

## Security Notes

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Change JWT_SECRET** - Use a strong random string in production
3. **Use HTTPS in production** - For secure API communication
4. **Validate all inputs** - Server-side validation is implemented
5. **Use prepared statements** - Already implemented to prevent SQL injection

