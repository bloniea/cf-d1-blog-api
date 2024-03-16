import { Context, MiddlewareHandler } from "hono"
import { db, errorStatusMessage } from "./utils"
import { verify } from "./jwt"
import { PERMISSION, ROLE, ROLE_PERMISSION } from "../config"
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
    // 解析token
    tokenStatus = await verify(authToken, c.env.TOKEN_SECRET)
  } catch (e) {
    console.log(e)
    return errorStatusMessage(
      c,
      401,
      "Token expired or invalid.",
      "Token invalid"
    )
  }
  // 判断是否超级管理员
  const isSuperAdmin = await db(
    c,
    "first",
    `SELECT * FROM ${ROLE} WHERE ROLEid=?`,
    tokenStatus.payload.RoleId
  )
  if (isSuperAdmin.err) return errorStatusMessage(c, 500, isSuperAdmin.err)
  if (isSuperAdmin.SuperAdmin) return await next()
  // 查找当前访问所需权限的id
  const permission = await db(
    c,
    "first",
    `SELECT * FROM ${PERMISSION} WHERE PermissionName=?`,
    `${pathName}_${method}`
  )
  if (!permission) return await next()
  // 查找当前用户所属角色有没有权限
  const userPremission = await db(
    c,
    "first",
    `SELECT * FROM ${ROLE_PERMISSION} WHERE PermissionId=? and RoleId=?`,
    (permission as any).PermissionId,
    tokenStatus.payload.RoleId
  )
  if (!userPremission) return errorStatusMessage(c, 401, "没有权限")
  await next()
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
