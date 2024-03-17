import { Hono, Context } from "hono" // Import the necessary dependencies
import {
  addArticle,
  deleteArticle,
  getArticle,
  getArticles,
  updateArticle,
} from "./articles"
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "./categories"
import { createRole, deleteRole, getRole, getRoles, updateRole } from "./roles"
import { createUser, deleteUser, getUser, getUsers, updateUser } from "./users"
import { Authorization } from "../utils/middleware"
import { login, refreshToken } from "./login"
import { sha256 } from "hono/utils/crypto"
type Variables = {
  message: string
}

const app = new Hono<{ Variables: Variables }>()
app.get("/", async (c: Context) => {
  return c.json({ message: "主页" })
})
const blogApi = app.basePath("/api/v1/blog/")
blogApi.use("/*", Authorization)
blogApi
  .post("/login", login)
  .post("/refreshToken", refreshToken)

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
