import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "69kb" }));
app.use(express.urlencoded({ extended: true, limit: "69kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import userRoutes from "./routes/user.routes.js";

// app.use("/users", userRoutes);
app.use("/api/v1/users", userRoutes);

export { app };
