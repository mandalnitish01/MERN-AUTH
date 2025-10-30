// arcjet.js
import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/node";
import dotenv from "dotenv";

dotenv.config();

export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({ mode: "LIVE" }),

    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),

    tokenBucket({
      mode: "LIVE",
      refillRate: 1,  // add 1 token every 10s
      interval: 10,   // refill every 10 seconds
      capacity: 2,    // max 2 tokens
    }),
  ],
});
