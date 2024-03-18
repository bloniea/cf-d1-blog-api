import { Context, MiddlewareHandler } from "hono"
import { errorStatusMessage } from "./utils.js"
import { verify } from "./jwt.js"
import { PERMISSION, ROLE, ROLE_PERMISSION } from "../config.js"
import { sqlDb } from "../db/client.js"
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
    !(method === "POST" || method === "PATCH" || method === "DELETE") ||
    pathName === "login"
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
    // 解析token
    tokenStatus = await verify(authToken, process.env.TOKEN_SECRET || "")
    // 判断是否超级管理员
    const client = await sqlDb()
    const isSuperAdmin = await client.execute(
      `SELECT * FROM ${ROLE} WHERE Roleid=? AND SuperAdmin=?`,
      "first",
      [tokenStatus.payload.RoleId, 1]
    )

    if (isSuperAdmin && isSuperAdmin.list) {
      return await next()
    }
    // 查找当前访问所需权限的id
    const permission = await client.execute(
      `SELECT * FROM ${PERMISSION} WHERE PermissionName=?`,
      "first",
      [`${pathName}_${method}`]
    )
    if (!permission || !permission.list) {
      return await next()
    }
    // 查找当前用户所属角色有没有权限
    const userPremission = await client.execute(
      `SELECT * FROM ${ROLE_PERMISSION} WHERE PermissionId=? and RoleId=?`,
      "first",
      [permission.list.PermissionId, tokenStatus.payload.RoleId]
    )
    if (!userPremission || !userPremission.list) {
      return errorStatusMessage(c, 401, "没有权限")
    }
    await next()
  } catch (e) {
    console.log(e)
    return errorStatusMessage(
      c,
      401,
      "Token expired or invalid.",
      "Token invalid"
    )
  }

  //   调试用
  c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
    const name =
      handler.name || (handler.length < 2 ? "[handler]" : "[middleware]")
    console.log(
      method,
      " ",
      path,
      " ".repeat(Math.max(10 - path.length, 0)),
      name,
      i === c.req.routeIndex ? "<- respond from here" : ""
    )
  })
}
