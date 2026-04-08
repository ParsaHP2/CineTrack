const mongoose = require("mongoose");

// Content-item schema used in the report's data model section.
const commentSchema = new mongoose.Schema({
  movieId: { type: Number, required: true, index: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },
});

module.exports = mongoose.model("Comment", commentSchema);
