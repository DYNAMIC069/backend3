// require("dotenv").config({ path: "./.env" });
import dotenv from "dotenv";
import { app } from "./app.js";
import DBconnect from "./db/index.js";

dotenv.config({
  path: "./.env",
});
DBconnect()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

// import mongoose, { mongo } from "mongoose";
// import { DB_NAME } from "../constants";
// (async () => {
//   try {
//     await mongoose.connect("${process.env.DATABASE_URL}/ ${DB_NAME}");
//     app.on("error", (err) => {
//       console.log("ERROR: ", err);
//       throw err;
//     });

//     app.listen(process.env.PORT || 8000, () => {
//       console.log(`Server is running on port ${process.env.PORT || 3000}`);
//     });
//   } catch (err) {
//     console.log("ERROR: ", err);
//     throw err;
//   }
// })();
// main().catch((err) => console.log(err));

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });
