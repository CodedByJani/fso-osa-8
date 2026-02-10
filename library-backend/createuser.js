import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "./models/user.js";
import { MONGODB_URI } from "./utils/config.js";

const main = async () => {
  await mongoose.connect(MONGODB_URI);

  const username = "elli";
  const password = "123";
  const favoriteGenre = "horror";

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    passwordHash,
    favoriteGenre, // lisätään tähän
  });

  await user.save();
  console.log(`User ${username} created!`);

  mongoose.connection.close();
};

main();
