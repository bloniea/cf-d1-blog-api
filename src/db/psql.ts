import pkg from "pg"
const { Pool } = pkg
export const permissions = "permissions",
  roles = "roles",
  role_permissions = "role_permissions",
  users = "users",
  articles = "articles",
  categories = "categories"
// 创建一个连接池实例

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  // connectionString:
  //   "default:Bsf0T5xVqYFI@ep-spring-bread-a402dds8-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require",
  max: 20,
  idleTimeoutMillis: 30000, // 连接在空闲状态下保持打开的时间（毫秒）
  connectionTimeoutMillis: 2000, // 获取新连接的超时时间（毫秒）
})

// 关闭连接池（在应用程序退出时执行）
process.on("SIGINT", () => {
  pool
    .end()
    .then(() => {
      console.log("Pool has been closed")
      process.exit(0)
    })
    .catch((err) => {
      console.error("Error closing pool", err)
      process.exit(1)
    })
})
