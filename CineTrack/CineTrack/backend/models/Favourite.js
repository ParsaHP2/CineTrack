const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, // must be ObjectId
    ref: "User", // must match your User model name
    required: true 
  },
  movieId: { type: Number, default: null }, 
  title: { type: String, required: true },
  posterPath: { type: String, default: null },
  releaseDate: { type: String, default: null },
  rating: { type: Number },
  username: { type: String }, // optional: can store a copy of username if you want
});

module.exports = mongoose.model("Favourite", favouriteSchema);