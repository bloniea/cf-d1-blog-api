import { serve } from "@hono/node-server"
import app from "./src/router/route.js"
import * as dotenv from "dotenv"
dotenv.config()

const port = process.env.PORT !== undefined ? parseInt(process.env.PORT) : 3001

serve({
  fetch: app.fetch,
  port,
})
console.log(`Server is running on http://localhost:${port}`)
