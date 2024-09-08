const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bookCollection = require("./booksdb.js");
const regd_users = express.Router();

let registeredUsers = [];

const doesUserExist = (username) => registeredUsers.some(user => user.username === username);

const verifyUserCredentials = (username, password) => {
    const user = registeredUsers.find(user => user.username === username);
    return user && bcrypt.compareSync(password, user.password);
};

regd_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Both username and password are required." });
    }

    if (doesUserExist(username)) {
        return res.status(400).json({ message: "User already registered." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    registeredUsers.push({ username, password: hashedPassword });
    return res.status(201).json({ message: "Registration successful." });
});

regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!verifyUserCredentials(username, password)) {
        return res.status(403).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ data: username }, process.env.JWT_SECRET, { expiresIn: '1h' });

    req.session.authorization = { token: token };
    req.session.username = username;

    console.log(req.session); // Log session data to check if it includes authorization

    return res.status(200).json({ message: "Login successful." });
});


const authenticateUser = (req, res, next) => {
    console.log(req.session);
    const token = req.session.authorization?.token || req.cookies.accessToken;

    if (!token) {
        return res.status(403).json({ message: "Unauthorized access." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token." });
        }
        req.user = decoded.data; 
        req.session.username = decoded.data;
        next();
    });
};

regd_users.put("/review/:isbn", authenticateUser, (req, res) => {
    const username = req.session.username;
    const ISBN = req.params.isbn;
    const review = req.body.review;

    if (!bookCollection[ISBN]) {
        return res.status(404).json({ message: "Book not found." });
    }

    if (!review) {
        return res.status(400).json({ message: "Review content is required." });
    }

    bookCollection[ISBN].reviews = bookCollection[ISBN].reviews || {};
    bookCollection[ISBN].reviews[username] = review;

    return res.status(201).json({ message: "Review updated successfully." });
});

regd_users.delete("/review/:isbn", authenticateUser, (req, res) => {
    const username = req.session.username;
    const ISBN = req.params.isbn;

    if (!bookCollection[ISBN]) {
        return res.status(404).json({ message: "Book not found." });
    }

    const reviews = bookCollection[ISBN].reviews;

    // Filter out the review for the current user
    const newReviews = Object.fromEntries(
        Object.entries(reviews).filter(([key, review]) => review.user !== username)
    );

    // Check if the review was actually removed
    if (Object.keys(newReviews).length === Object.keys(reviews).length) {
        return res.status(404).json({ message: "Review not found for the current user." });
    }

    // Update the reviews with the new object
    bookCollection[ISBN].reviews = newReviews;

    return res.status(200).json({ message: "Review removed successfully." });
});



module.exports.regd_users = regd_users;
module.exports.doesUserExist = doesUserExist;
module.exports.registeredUsers = registeredUsers;
