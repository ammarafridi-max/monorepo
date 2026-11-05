import "@travel-suite/utils/sentry";
import { startServer } from "@travel-suite/backend-app/server";
import { connectDB } from "./utils/db.js";
import config from "./utils/config.js";
// must stay above the ./app.js import: routes/index.js builds the domain factories at module load
import "./utils/validateEnv.js";
import app from "./app.js";

startServer({ app, config, name: "mdt-backend", connect: connectDB });
