import { serve } from "@hono/node-server"
import { handle } from "@hono/node-server/vercel"
import app from "./src/router/route.js"
import * as dotenv from "dotenv"
// import dotenv from "dotenv"
dotenv.config()
const port = process.env.PORT !== undefined ? parseInt(process.env.PORT) : 3000

serve({
  fetch: app.fetch,
  port,
})
// export default handle(app)
console.log(`Server is running on http://localhost:${port}`)
