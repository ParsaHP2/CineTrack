const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  movieId: { type: Number, default: null }, 
  title: { type: String, required: true },
  posterPath: { type: String, default: null },
  releaseDate: { type: String, default: null },
  rating: { type: Number },
});

module.exports = mongoose.model("Favourite", favouriteSchema);