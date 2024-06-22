// app.js
import express from "express";
import logger from "morgan";
import cors from "cors";
import authRouter from "./routes/api/auth.js";
import contactsRouter from "./routes/api/contacts.js";
import connectToDb from "./utils/connectToDb.js";
import { STATUS_CODES } from "./utils/constants.js";

const app = express();
const formatsLogger = app.get("env") === "development" ? "dev" : "short";

connectToDb();

app.use(express.static("public"));
app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use("/api/contacts", contactsRouter);
app.use("/api/users", authRouter);

app.use((req, res) => {
  res.status(STATUS_CODES.notFound).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(STATUS_CODES.error).json({ message: err.message });
});

export default app;
