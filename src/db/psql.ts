import pkg from "pg"
const { Pool } = pkg
export const permissions = "permissions",
  roles = "roles",
  role_permissions = "role_permissions",
  users = "users",
  articles = "articles",
  categories = "categories",
  // images = "images",
  images = "images2",
  images_category = "images_category",
  image_users = "image_users"
// 创建一个连接池实例

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 20,
  idleTimeoutMillis: 30000, // 连接在空闲状态下保持打开的时间（毫秒）
  connectionTimeoutMillis: 2000, // 获取新连接的超时时间（毫秒）
})

// export const pool = new Pool({
//   user: "postgres",
//   database: "blog1",
//   host: "localhost",
//   port: 5432,
//   password: "123",
//   max: 20,
//   idleTimeoutMillis: 30000, // 连接在空闲状态下保持打开的时间（毫秒）
//   connectionTimeoutMillis: 2000, // 获取新连接的超时时间（毫秒）
// })
// 关闭连接池（在应用程序退出时执行）
process.on("SIGINT", () => {
  pool
    .end()
    .then(() => {
      console.info("Pool has been closed")
      process.exit(0)
    })
    .catch((err) => {
      console.error("Error closing pool", err)
      process.exit(1)
    })
})
