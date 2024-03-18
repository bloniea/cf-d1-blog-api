import { Hono, Context } from "hono"
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
import { login, refreshToken, retPasword } from "./login"
import { sha256 } from "hono/utils/crypto"
import { sqlDb } from "../db/client"

type Variables = {
  message: string
}

const app = new Hono<{ Variables: Variables }>()

app.get("/", async (c: Context) => {
  const client = await sqlDb()
  // console.log(await client.execute("SELECT * FROM Users"))
  const result = await client.batch(
    [
      { sql: "SELECT * FROM Roles WHERE RoleId=?", args: [1] },
      { sql: "SELECT * FROM Roles WHERE RoleId=?", args: [2] },
    ],
    "read"
  )
  console.log(result)
  return c.json({ message: "主页" })
})
const blogApi = app.basePath("/api/v1/blog/")
// blogApi.use("/*", Authorization)
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
