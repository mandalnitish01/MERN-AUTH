// app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connection from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/userRouter.js";
import { removeUnverifiedAccount } from "./automation/removeUnverifiedAccount.js";
import { aj } from "./utils/arcjet.js"; // ✅ import from separate file

dotenv.config();

export const app = express();

// ✅ Arcjet middleware (security layer)
app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req, { requested: 1 });
    console.log("Arcjet decision:", decision);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ error: "Too many requests" });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({ error: "No bots allowed" });
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    next();
  } catch (err) {
    console.error("Arcjet middleware error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Basic middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/v1/user", userRouter);

// ✅ Automation and DB connection
removeUnverifiedAccount();
connection();

// ✅ Global error handler
app.use(errorMiddleware);
