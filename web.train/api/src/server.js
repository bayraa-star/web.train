import http, { request } from "http";
import express, { response } from "express";
import "express-async-errors";
import helmet from "helmet";
import cors from "cors";
import { urlencoded, json } from "body-parser";
import { expressjwt } from "express-jwt";
import basicAuth from "express-basic-auth";
import mongoose from "mongoose";
import fs from "fs";
import { Server } from "socket.io";
import https from "https";

import {
  PROJECT_NAME,
  PROJECT_PORT,
  ALLOWED_ORIGINS,
  JWT,
  DB,
  SECRET,
} from "./consts";
import { log } from "./utils";
import { UserRouter, LogRouter, FileRouter, RootRouter, JobRouter } from "./routes";
import agenda from "./utils/agenda";

const app = express();
const server = http.Server(app);

const io = new Server(server, { secure: true, transports: ["websocket"] });

app.use(helmet());
app.use(urlencoded({ extended: false }));
app.use(
  json({
    limit: "5mb",
  })
);
// test
// CORS
app.use(
  cors({
    allowedHeaders: ALLOWED_ORIGINS,
    allowedHeaders: [
      "Accept",
      "Authorization",
      "Content-Type",
      "Accept-Ranges",
      "Accept-Version",
      "X-Requested-With",
      "X-Access-Token",
    ],
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
  })
);

// STATIC
app.use("/uploads", express.static("uploads"));
app.use("/static", express.static("static"));
// BasicAuthService
// app.use(
//   "/service",
//   basicAuth({
//     users: {
//       odt: "odt123456",
//     },
//   }),
//   ServiceRouter
// );
// JWT

app.use("/user", UserRouter);
app.use("/file", FileRouter);
app.use("/root", RootRouter);
app.use("/job", JobRouter);

app.use("/test", (req, res) => {
  let total = 0;
  for (let i = 0; i < 50_000_000; i++) {
    total++;
  }
  return res.json(new Date());
});

// Error
app.use((error, request, response, next) => {
  if (error) {
    const d = {
      params: request.params,
      method: request.method,
      body: request.body,
      error: error.toString(),
    };

    const status =
      error?.status || (error?.name === "UnauthorizedError" ? 401 : 500);

    log.error(d);

    return response
      .status(status)
      .json({ success: false, message: error.toString() });
  } else next();
});

server.listen(PROJECT_PORT, async () => {
  // console.log(
  //   `${PROJECT_NAME.toUpperCase()} listening port on ${PROJECT_PORT}`
  // );

  mongoose
    .connect(DB)
    .then(async () => {
      console.log("DB connected.");

      // await agenda.start();

      // agenda.every("10 seconds", "SENTSTATS");

      console.log(
        `${PROJECT_NAME.toUpperCase()} listening port on ${PROJECT_PORT}`
      );
    })
    .catch((err) => {
      console.log("DB connection error : ", err);
    });
});

export { io };
