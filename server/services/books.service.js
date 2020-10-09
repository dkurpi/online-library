const mongoose = require("mongoose");
const isObjectIDvalid = mongoose.Types.ObjectId.isValid;

const userService = require("../services/user.service.js");

const db = require("../_helpers/db");
const Book = db.Book;

async function getBooks(options) {
  const { category, pages, year, sortBy, searchPhrase } = options;
  let query = [];

  if (searchPhrase) {
    const searchText = {
      $regex: searchPhrase,
      $options: "i",
    };
    query.push({
      $or: [
        { name: searchText },
        { author: searchText },
        { category: searchText },
        { addedBy: searchText },
      ],
    });
  }

  if (category.length) query.push({ category: category });
  if (pages.length) query.push({ pages: { $lt: pages[1], $gt: pages[0] } });
  if (year.length) query.push({ year: { $lt: year[1], $gt: year[0] } });
  if (!query.length) query = [{}];

  const books = await Book.find({ $and: query }).sort(
    sortBy || { createdAt: -1 }
  );
  return books;
}

async function getBooksCreatedByUser(id) {
  return await Book.find({ addedById: id }).sort({
    createdAt: -1,
  });
}

async function create(_book, userId) {
  const user = await userService.getById(userId);

  _book.addedBy = `${user.firstName} ${user.lastName}`;
  _book.addedById = userId;

  const book = new Book(_book);

  return book.save();
}

async function _delete(bookId, userId) {
  const [book] = await getBooksByIds(bookId);

  if (!book) throw new Error("Book does not exist!");
  if (userId !== book.addedById)
    throw new Error("Book was not created by you!");

  return await book.remove();
}

const validateId = (id) => {
  if (!isObjectIDvalid(id)) {
    throw new Error("BookID is not valid!");
  }
};

async function getBooksByIds(ids) {
  if (typeof ids === "object") ids.forEach((id) => validateId(id));
  if (typeof ids === "string") validateId(ids);

  return await Book.find({ _id: ids }).exec();
}

module.exports = {
  getBooksCreatedByUser,
  _delete,
  getBooks,
  create,
  getBooksByIds,
};
