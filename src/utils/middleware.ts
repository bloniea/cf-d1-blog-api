import { Context, MiddlewareHandler } from "hono"
import { errorStatusMessage } from "./utils.js"
import { verify } from "./jwt.js"
import {
  permissions,
  pool,
  role_permissions,
  roles,
  users,
} from "../db/psql.js"
export const Authorization: MiddlewareHandler = async (
  c: Context,
  next: () => any
) => {
  c.header("Content-Type", "application/json; charset=UTF-8")
  const method = c.req.method
  // 去除路由前缀，访问/role接口时，路径开头就是role 了
  let routePath: string[] | string = c.req.routePath.split("/")
  routePath.pop() // 去除最后一个*号
  routePath = routePath.join("/")
  const path = c.req.path.replace(routePath + "/", "")
  //  /api/role --> role
  const pathName = path.split("/")[0]
  if (
    // !(method === "POST" || method === "PATCH" || method === "DELETE") ||
    pathName === "login" ||
    pathName === "refreshToken"
  ) {
    return await next()
  }

  const auth = c.req.header("Authorization")
  if (!auth || !auth.startsWith("Bearer ")) {
    return errorStatusMessage(
      c,
      401,
      "The header is missing Authorization or has an incorrect format."
    )
  }

  const authToken = auth.replace("Bearer ", "")

  let tokenStatus: any
  try {
    tokenStatus = await verify(authToken, process.env.TOKEN_SECRET || "Bronya")
  } catch (e) {
    return errorStatusMessage(
      c,
      401,
      "Token expired or invalid.",
      "Token invalid"
    )
  }
  // 解析token

  try {
    // 判断是否超级管理员
    const isSuperAdmin = await pool.query(
      `SELECT * FROM ${users} WHERE user_id = $1 AND super_admin = $2`,
      [tokenStatus.payload.user_id, 1]
    )

    if (isSuperAdmin && isSuperAdmin.rowCount) {
      console.log("超级用户")
      return await next()
    }
    // 查找当前访问所需权限的id
    const permission = await pool.query(
      `SELECT * FROM ${permissions} WHERE name=$1`,
      [`${pathName}_${method}`]
    )
    // 说明此访问无需权限
    if (!permission || !permission.rowCount) {
      return await next()
    }
    // 查找当前用户所属角色有没有权限
    const userPremission = await pool.query(
      `SELECT * FROM ${role_permissions} WHERE permission_id=$1 and role_id=$2`,
      [permission.rows[0].PermissionId, tokenStatus.payload.role_id]
    )
    if (!userPremission || !userPremission.rowCount) {
      return errorStatusMessage(c, 401, "没有权限", { auth: 0 })
    }
    await next()
  } catch (e) {
    console.error(e)
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }

  //   调试用
  // c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  //   const name =
  //     handler.name || (handler.length < 2 ? "[handler]" : "[middleware]")
  //   console.log(
  //     method,
  //     " ",
  //     path,
  //     " ".repeat(Math.max(10 - path.length, 0)),
  //     name,
  //     i === c.req.routeIndex ? "<- respond from here" : ""
  //   )
  // })
}
export const AuthorizationImage: MiddlewareHandler = async (
  c: Context,
  next: () => any
) => {
  c.header("Content-Type", "application/json; charset=UTF-8")
  const method = c.req.method
  // 去除路由前缀，访问/role接口时，路径开头就是role 了
  let routePath: string[] | string = c.req.routePath.split("/")
  routePath.pop() // 去除最后一个*号
  routePath = routePath.join("/")
  const path = c.req.path.replace(routePath + "/", "")
  //  /api/role --> role
  const pathName = path.split("/")[0]
  if (
    // !(method === "POST" || method === "PATCH" || method === "DELETE") ||
    method === "GET" ||
    pathName === "login" ||
    pathName === "refresh"
  ) {
    return await next()
  }

  const auth = c.req.header("Authorization")
  if (!auth || !auth.startsWith("Bearer ")) {
    return errorStatusMessage(
      c,
      401,
      "The header is missing Authorization or has an incorrect format.",
      "Token invalid"
    )
  }

  const authToken = auth.replace("Bearer ", "")

  let tokenStatus: any
  try {
    tokenStatus = await verify(authToken, process.env.TOKEN_SECRET || "Bronya")
  } catch (e) {
    return errorStatusMessage(
      c,
      401,
      "Token expired or invalid.",
      "Token invalid"
    )
  }
  await next()
}
