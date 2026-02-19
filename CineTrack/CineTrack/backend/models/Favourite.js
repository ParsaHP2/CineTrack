const mongoose = require("mongoose");

const FavouriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  movieId: {
    type: Number,
    required: true,
  },
  title: { type: String },
  posterPath: { type: String },
  releaseDate: { type: String },
});

// One favourite per user per movie
FavouriteSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model("Favourite", FavouriteSchema);
