import { serve } from "@hono/node-server";
import app from "./router/route";
import dotenv from "dotenv";
dotenv.config();
const port = process.env.PORT !== undefined ? parseInt(process.env.PORT) : 3000;
serve({
    fetch: app.fetch,
    port,
});
console.log(`Server is running on http:localhost:${port}`);
