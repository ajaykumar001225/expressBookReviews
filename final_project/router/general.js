const express = require('express');
const bookCollection = require("./booksdb.js");
const public_users = express.Router();

// Get the book list available in the shop using Promises
public_users.get('/', (req, res) => {
    Promise.resolve(bookCollection)
        .then(books => res.json(books))
        .catch(error => res.status(500).json({ message: "Error retrieving books." }));
});

// Get book details based on ISBN using Promises
public_users.get('/isbn/:isbn', (req, res) => {
    const ISBN = req.params.isbn;

    Promise.resolve(bookCollection[ISBN])
        .then(book => {
            if (book) {
                res.json(book);
            } else {
                res.status(404).json({ message: "Book not found." });
            }
        })
        .catch(error => res.status(500).json({ message: "Error retrieving book details." }));
});

// Get book details based on author using Promises
public_users.get('/author/:author', (req, res) => {
    const authorName = req.params.author;
    const booksByAuthor = Object.values(bookCollection).filter(book => book.author === authorName);

    Promise.resolve(booksByAuthor)
        .then(books => {
            if (books.length > 0) {
                res.json(books);
            } else {
                res.status(404).json({ message: "No books found by this author." });
            }
        })
        .catch(error => res.status(500).json({ message: "Error retrieving books by author." }));
});

// Get all books based on title using Promises
public_users.get('/title/:title', (req, res) => {
    const title = req.params.title;
    const booksByTitle = Object.values(bookCollection).filter(book => book.title === title);

    Promise.resolve(booksByTitle)
        .then(books => {
            if (books.length > 0) {
                res.json(books);
            } else {
                res.status(404).json({ message: "No books found with this title." });
            }
        })
        .catch(error => res.status(500).json({ message: "Error retrieving books by title." }));
});

// Get book review by ISBN using Promises
public_users.get('/review/:isbn', (req, res) => {
    const ISBN = req.params.isbn;
    const reviews = bookCollection[ISBN]?.reviews;

    Promise.resolve(reviews)
        .then(reviews => {
            if (reviews && Object.keys(reviews).length > 0) {
                res.json(reviews);
            } else {
                res.status(404).json({ message: "No reviews found for this book." });
            }
        })
        .catch(error => res.status(500).json({ message: "Error retrieving reviews." }));
});

module.exports.public_users = public_users;
