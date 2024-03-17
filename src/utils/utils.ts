import { Context } from "hono"
import { sha256 } from "hono/utils/crypto"

/**
 * 获取为空的属性
 * @returns 返回属性名
 * @param str 对象
 */
export const valuesEmpty = (str: { [key: string]: any }): Array<string> => {
  const result: Array<string> = []
  for (const item in str) {
    if (!str[item]) {
      result.push(item)
    }
  }
  return result
}

type StatusCode =
  | 200
  | 201
  | 202
  | 204
  | 400
  | 401
  | 403
  | 404
  | 405
  | 415
  | 422
  | 500
  | 409
/**
 * 返回错误状态码和信息
 * @param c hono的上下文
 * @param status http 状态码
 * @param message 规定返回的信息
 * @returns
 */
export const errorStatusMessage = async (
  c: Context,
  status: StatusCode,
  message?: string,
  obj?: any
): Promise<Response> => {
  c.status(status)
  if (status === 415) {
    return c.json({
      success: 0,
      message: "Unsupported data type or null.",
    })
  }
  if (status === 400) {
    return c.json({
      success: 0,
      message: `Missing required parameters:${message}`,
    })
  }
  if (status === 401) {
    return c.json({ success: 0, message: `Unauthorized.${message}`, data: obj })
  }
  if (status === 404) {
    return c.json({ success: 0, message: `${message} Not Found.` })
  }
  if (status === 409) {
    return c.json({ success: 0, message: `${message} Already exists.` })
  }
  if (status === 422) {
    return c.json({
      success: 0,
      message: `${message} formats are not correct.`,
    })
  }
  if (status === 500) {
    return c.json({ success: 0, message: `Server Error.${message} ` })
  }
  throw new Error(
    "status is not 200 | 201 | 202 | 204 | 400 | 401 | 403 | 404 | 405 | 415 | 500"
  )
}

interface UpdateedData {
  fields: string
  sqlAnd: string
  sqlOr: string
  values: { [key: string]: any }
}
/**
 * 获取更新的字段和值
 * @param str 参数对象键值对
 * @returns 返回更新的字段和值
 */
export const getUpdateedData = async (str: {
  [key: string]: any
}): Promise<UpdateedData> => {
  const fields: Array<string> = [],
    values: any = {},
    equality: Array<string> = [],
    sqlOr: Array<string> = []

  for (const item in str) {
    if (str[item]) {
      fields.push(`${item} = ?`)
      equality.push(`${item} = ?`)
      if (item === "Password") {
        values[item] = await sha256(str[item])
      } else {
        values[item] = str[item]
      }
    }

    if ((str[item] && item === "Username") || (str[item] && item === "Email")) {
      sqlOr.push(`${item} = '${str[item]}'`)
    }
  }
  return {
    fields: fields.join(","),
    values,
    sqlAnd: equality.join(" and "),
    sqlOr: sqlOr.join(" or "),
  }
}

interface PageAndNumber {
  pages: number
  pageNumbers: number
}
/**
 * 获取页数和页码
 * @param page 页数
 * @param pageNumber 页码
 * @returns  返回页数和页码
 */
export const getPagesAndNumbers = (
  page: string,
  pageNumber: string
): PageAndNumber => {
  const pageed: number =
    page && /^\d+$/.test(page) && parseInt(page) > 0 ? parseInt(page) : 10
  const pageNumbered: number =
    pageNumber && /^\d+$/.test(pageNumber) && parseInt(pageNumber) > 0
      ? parseInt(pageNumber)
      : 1

  return { pages: pageed, pageNumbers: pageNumbered }
}

/**
 *  根据数据是否存在，获取数据或者返回空值。
 * @param str 包含的数据的具有键值对的对象
 * @returns 返回数据或者空值的对象
 */
export const fetchIfExistsOrElse = async <T extends object>(
  strObj: T
): Promise<{ [K in keyof T]: K }> => {
  const result: { [key: string]: any } = {}
  for (const item in strObj) {
    if (!strObj[item]) {
      result[item] = ""
    } else {
      result[item] = strObj[item]
    }
  }
  return result as { [K in keyof T]: K }
}

type UpdatedD1Result<T> = D1Result<T> & {
  err?: string
}
type UpdatedD1Response = D1Response & {
  err?: string
}
type UpdatedFirst = any & {
  err?: string
}

type d1Type = "first" | "run" | "all"
/**
 *
 * @param c hono的上下文
 * @param type 执行方法
 * @param sql sql语句
 * @param bind sql语句的占位符参数
 */
export function db(
  c: Context,
  type: "all",
  sql: string,
  ...bind: any[]
): Promise<UpdatedD1Result<unknown>>

export function db(
  c: Context,
  type: "first",
  sql: string,
  ...bind: any[]
): Promise<UpdatedFirst>
// 重载 2：type 参数为除了 "all" 之外的其他值，返回 D1Database
export function db(
  c: Context,
  type: Exclude<d1Type, "all" | "first">,
  sql: string,
  ...bind: any[]
): Promise<UpdatedD1Response>

// 实现：根据参数的不同调用相应的实现
export async function db(
  c: Context,
  type: d1Type,
  sql: string,
  ...bind: any[]
): Promise<D1Result<unknown> | D1Response | any> {
  try {
    const result = await c.env.DB.prepare(sql)
      .bind(...bind)
      [type]()

    if (type === "all") {
      return result as UpdatedD1Result<unknown>
    } else if (type === "first") {
      return result as UpdatedFirst
    } else {
      return result as UpdatedD1Response
    }
  } catch (error) {
    console.log(error)
    if (error instanceof Error) {
      return { err: "sql operation failed." + error.toString() }
    } else {
      return { err: "sql operation failed." + error }
    }
  }
}
interface UserEmailPassword {
  Username?: string
  Email?: string
  Password?: string
  [key: string]: any
}
export const verifyUserEmailPassword = async (
  obj: UserEmailPassword
): Promise<string | null> => {
  const usernameRegex = /^[a-zA-Z]{3,10}$/
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d|\W)(?!.*\s).{6,18}$/
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const result: string[] = []
  console.log(obj.Username)
  if (obj.Username && !usernameRegex.test(obj.Username)) {
    result.push("Username")
  }
  if (obj.Email && !emailRegex.test(obj.Email)) {
    result.push("Email")
  }
  if (obj.Password && !passwordRegex.test(obj.Password)) {
    result.push("Password")
  }
  if (result.length) {
    return result.join("、")
  }
  console.log(result)
  return null
}

export const setPermissions = (
  Permissions: string,
  RoleId: number | string
): string | null => {
  if (!Permissions) return null
  const permissions = Permissions.split(",")
  // const seat: string[] = []
  const result: string[] = []
  permissions.forEach(async (item) => {
    // seat.push(`(?,?)`)
    result.push(`('${RoleId}', '${item}')`)
  })
  return result.join(",")
  // (?,?)
  // (id,id2)
}
