import { Context } from "hono"
import { sha256 } from "hono/utils/crypto"

/**
 * 获取为空的属性
 * @returns 返回数组包含为空的属性名
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
      message: message ? message : "Unsupported data type or null.",
    })
  }
  if (status === 400) {
    return c.json({
      success: 0,
      message: `${message}`,
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
 *  没有传值是undefined，需要设置成空值返回
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

interface UserEmailPassword {
  Username?: string
  Email?: string
  Password?: string
  [key: string]: any
}
/**
 * 检测用户注册的用户名、邮箱和密码是否符合规范
 * @param obj 参数对象
 * @returns 返回不符合规范的字段
 */
export const verifyUserEmailPassword = async (
  obj: UserEmailPassword
): Promise<string | null> => {
  const usernameRegex = /^[a-zA-Z]{3,10}$/
  const passwordRegex = /^[^\s]{6,18}$/
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const result: string[] = []

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
/**
 * 根据权限字符串分割成数组，然后能让sql批量插入到表的成字符串
 * @param Permissions 包含权限的字符串
 * @param RoleId 角色id
 * @returns 返回字符串
 * 例：Permissions：‘1,2,3’、RoleId：1 => 返回：‘(1, 1)、(1, 2)、(1, 3)’
 */
export const setPermissions = (
  Permissions: string,
  RoleId: number | string
): string | null => {
  if (!Permissions) return null
  const permissions = Permissions.split(",")
  const result: string[] = []
  permissions.forEach(async (item) => {
    result.push(`('${RoleId}', '${item}')`)
  })
  return result.join(",")
}
/**
 * 根据传入字符串判断是否为数字
 * @param str 可能为数字字符串
 * @returns 返回布尔值
 */
export const isNumber = (str: string): boolean => {
  if (isNaN(parseInt(str))) return false
  else return true
}
