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
  return c.json({ message: `走错了` })
})
// app.get("/favicon.ico", async (c: Context) => {
//   const favicon = fs.readFileSync("./favicon.ico")
//   c.header("Content-Type", "image/x-icon")
//   return c.body(favicon)
// })
const blogApi = app.basePath("/v1/")
blogApi.use("/*", Authorization)

blogApi
  .post("/login", login)
  .post("/refreshToken", refreshToken)
  .post("/repasswd/:UserId", retPasword)
  .get("/articles", getArticles)
  .get("/article/:article_id", getArticle)
  .post("/article", addArticle)
  .patch("/article/:article_id", updateArticle)
  .delete("/article/:article_id", deleteArticle)

  .get("/categories", getCategories)
  .get("/category/:category_id", getCategory)
  .post("/category", createCategory)
  .delete("/category/:category_id", deleteCategory)
  .patch("/category/:category_id", updateCategory)

  .get("/roles", getRoles)
  .get("/role/:role_id", getRole)
  .post("/role", createRole)
  .delete("/role/:role_id", deleteRole)
  .patch("/role/:role_id", updateRole)

  .get("/users", getUsers)
  .get("/user/:user_id", getUser)
  .post("/user", createUser)
  .delete("/user/:user_id", deleteUser)
  .patch("/user/:user_id", updateUser)
export default app
