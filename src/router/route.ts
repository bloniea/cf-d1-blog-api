import { Hono, Context } from "hono"
import {
  addArticle,
  deleteArticle,
  getArticle,
  getArticles,
  updateArticle,
} from "./articles.js"
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "./categories.js"
import {
  createRole,
  deleteRole,
  getRole,
  getRoles,
  updateRole,
} from "./roles.js"
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "./users.js"
import { Authorization } from "../utils/middleware.js"
import { login, refreshToken, retPasword } from "./login.js"
import fs from "fs"
type Variables = {
  message: string
}
const app = new Hono<{ Variables: Variables }>()
app.get("/", async (c: Context) => {
  return c.json({ message: "走错了" })
})
app.get("/favicon.ico", async (c: Context) => {
  const favicon = fs.readFileSync("./favicon.ico")
  c.header("Content-Type", "image/x-icon")
  return c.body(favicon)
})
const blogApi = app.basePath("/v1/")
blogApi.use("/*", Authorization)

blogApi
  .post("/login", login)
  .post("/refreshToken", refreshToken)
  .post("/repasswd/:UserId", retPasword)

  .get("/articles", getArticles)
  .get("/article/:articleId", getArticle)
  .post("/article", addArticle)
  .patch("/article/:articleId", updateArticle)
  .delete("/article/:articleId", deleteArticle)

  .get("/categories", getCategories)
  .get("/category/:CategoryId", getCategory)
  .post("/category", createCategory)
  .delete("/category/:CategoryId", deleteCategory)
  .patch("/category/:CategoryId", updateCategory)

  .get("/roles", getRoles)
  .get("/role/:RoleId", getRole)
  .post("/role", createRole)
  .delete("/role/:RoleId", deleteRole)
  .patch("/role/:RoleId", updateRole)

  .get("/users", getUsers)
  .get("/user/:UserId", getUser)
  .post("/user", createUser)
  .delete("/user/:UserId", deleteUser)
  .patch("/user/:UserId", updateUser)
export default app
