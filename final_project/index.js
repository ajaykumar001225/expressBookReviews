require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const regd_users = require('./router/auth_users.js').regd_users;
const public_users = require('./router/general.js').public_users;

const app = express();

app.use(cookieParser());
app.use(express.json());

// Session management setup for customer-related routes
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production' ? true : false, // Secure cookies only in production
        httpOnly: true, // Ensures the cookie is not accessible via JavaScript
        maxAge: 24 * 60 * 60 * 1000 // Cookie expiration time (1 day)
    }
}));


// Middleware to authenticate protected customer routes
app.use("/customer/auth/*", (req, res, next) => {
    if (req.session.authorization) {
        const token = req.session.authorization.token; // Extracting access token
        jwt.verify(token, process.env.JWT_SECRET || "access", (err, user) => {
            if (err) {
                return res.status(403).json({ message: "User not authenticated" });
            }
            req.user = user;
            next();
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }
});

// Registering route handlers
app.use("/customer", regd_users); // Routes for authenticated customer actions
app.use("/", public_users); // Publicly accessible routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Starting the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
