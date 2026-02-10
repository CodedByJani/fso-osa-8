import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 4,
  },
  born: {
    type: Number,
  },
});

export const Author = mongoose.model("Author", schema);
