import { Context } from "hono"
import { sha256 } from "hono/utils/crypto"
import { CombinedResponse } from "./types.js"
import fs from "fs"
import { kv } from "@vercel/kv"
import { del } from "@vercel/blob"
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
  | 408
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
): Promise<CombinedResponse> => {
  c.status(status)
  if (status === 415) {
    return c.json({
      success: 0,
      message: message ? message : "Unsupported data type or null.",
      status: status,
    })
  }
  if (status === 400) {
    return c.json({
      success: 0,
      message: `${message}`,
      status: status,
    })
  }
  if (status === 401) {
    return c.json({
      success: 0,
      message: `Unauthorized.${message}`,
      status: status,
      data: obj,
    })
  }
  if (status === 404) {
    return c.json({
      success: 0,
      message: `${message} Not Found.`,
      status: status,
    })
  }
  if (status === 408) {
    return c.json({
      success: 0,
      message: `${message}`,
      status: status,
    })
  }
  if (status === 409) {
    return c.json({
      success: 0,
      message: `${message} Already exists.`,
      status: status,
    })
  }
  if (status === 422) {
    return c.json({
      success: 0,
      message: `${message} formats are not correct.`,
      status: status,
    })
  }
  if (status === 500) {
    return c.json({
      success: 0,
      message: `Server Error.${message} `,
      status: status,
    })
  }
  throw new Error(
    "status is not 200 | 201 | 202 | 204 | 400 | 401 | 403 | 404 | 405 | 415 | 500"
  )
}

interface UpdateedData {
  fields: Array<String>
  sqlAnd: string
  sqlOr: string
  values: { [key: string]: any }
}
/**
 * 获取更新的字段和值
 * @param str 参数对象键值对
 * @returns 返回更新的字段和值
 * 传入
 * {
  username: 'FFDSFfds',
  email: 'FASF@qq.com',
  password: undefined,
  role_id: 2
 }
 返回
{
  fields: [ 'username = $1', 'email = $2', 'role_id = $3' ],
  values: { username: 'FFDSFfds', email: 'FASF@qq.com', role_id: 2 },
  sqlAnd: 'username = $1 and email = $2 and role_id = $3',
  sqlOr: "username = 'FFDSFfds' or email = 'FASF@qq.com'"
}
 */
export const getUpdateedData = async (str: {
  [key: string]: any
}): Promise<UpdateedData> => {
  const fields: Array<string> = [],
    values: any = {},
    sqlAnd: Array<string> = [],
    sqlOr: Array<string> = []
  let i = 1

  for (const item in str) {
    if (str[item]) {
      fields.push(`${item} = $${i}`)
      sqlAnd.push(`${item} = $${i}`)
      if (item === "password") {
        values[item] = await sha256(str[item])
      } else {
        values[item] = str[item]
      }
      i++
    }

    if ((str[item] && item === "username") || (str[item] && item === "email")) {
      sqlOr.push(`${item} = '${str[item]}'`)
    }
  }
  return {
    fields: fields,
    values,
    sqlAnd: sqlAnd.join(" and "),
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
  username?: string
  email?: string
  password?: string
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
  // const passwordRegex = /^[^\s]{6,18}$/
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const result: string[] = []

  if (obj.username && !usernameRegex.test(obj.username)) {
    result.push("username")
  }
  if (obj.email && !emailRegex.test(obj.email)) {
    result.push("email")
  }
  // if (obj.password && !passwordRegex.test(obj.password)) {
  //   result.push("password")
  // }
  if (result.length) {
    return result.join("、")
  }
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
/**
 * 根据传入数组改变结构
 * @param permissions 数组数据
 * @returns 返回改变后的数据
 */
type Permissions = {
  permission_id: number
  name: string
  level: number
  parent_id: number
  description: string
  children: Array<Permissions>
}
export const permissionsFilter = (
  permissions: Array<Permissions>
): Array<Permissions> => {
  // 构建一个映射，以 id 作为键，方便后续查找
  const idMap: { [key: string]: Permissions } = {}
  permissions.forEach((item) => {
    idMap[item.permission_id] = item
  })
  const result: Array<Permissions> = []
  // 遍历数组，将具有 parent_id 的对象添加到对应的 id 下
  permissions.forEach((item) => {
    // parent_id存在并且permission_id为parent_id的数据也存在
    if (item.parent_id && idMap[item.parent_id]) {
      // 如果存在 parent_id 并且父节点存在，则将当前节点添加到父节点的 children 数组中
      if (!idMap[item.parent_id].children) {
        idMap[item.parent_id].children = []
      }

      idMap[item.parent_id].children.push(item)
    } else {
      result.push(item)
    }
  })

  // 现在 data 数组中的每个对象应该都有了正确的 children 字段

  return result
}
/**
 *
 * @param num 要转换为数字的值
 * @returns 返回数字或false
 */
export const toNumber = (num: string) => {
  const t = parseInt(num)
  if (isNaN(t)) {
    return false
  }
  return t
}
/**
 *
 * @param data 要加密的字符串
 * @returns 加密后的数据
 */
export const cryptoPassword = async (
  data: string | Buffer | Uint8Array
): Promise<string | null> => {
  // const dataArray = new TextEncoder().encode(data)

  // try {
  //   const hashBuffer = await crypto.subtle.digest("SHA-256", dataArray)
  //   const hashArray = Array.from(new Uint8Array(hashBuffer))
  //   const hashedData = hashArray
  //     .map((byte) => byte.toString(16).padStart(2, "0"))
  //     .join("")

  //   return hashedData
  // } catch (error) {
  //   console.error("加密出错:", error)
  //   throw error
  // }
  return sha256(data)
}

export const convertToObjectBuffer = async (
  binaryObject: any
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const reader = fs.createReadStream(binaryObject.path) // 假设 file 是一个包含文件路径的 File 对象
    const chunks: Buffer[] = []

    reader.on("data", (chunk: Buffer) => {
      chunks.push(chunk)
    })

    reader.on("end", () => {
      const buffer = Buffer.concat(chunks)
      resolve(buffer)
    })

    reader.on("error", (error: Error) => {
      reject(error)
    })
  })

  // if (typeof binaryObject === "object" && binaryObject instanceof Blob) {
  //   // 创建一个Promise来封装读取Blob的操作
  //   const binaryData = await new Promise<ArrayBuffer>((resolve, reject) => {
  //     const reader = new FileReader()
  //     reader.onload = (event) =>
  //       resolve((event.target as FileReader).result as ArrayBuffer)
  //     reader.onerror = (error) => reject(error)
  //     reader.readAsArrayBuffer(binaryObject)
  //   })

  //   // 将二进制数据转换为Buffer
  //   const uint8Array = new Uint8Array(binaryData)
  //   const buffer = Buffer.from(uint8Array)
  //   return buffer
  // } else {
  //   throw new Error("Invalid object type or instance")
  // }
}
// 获取文件名
export const getName = (name: string) => {
  const index = name.lastIndexOf(".")
  const nName = index > -1 ? name.substring(0, index) : name
  const time = new Date().getTime()
  const random = Math.floor(Math.random() * 1000)
  const fileName = nName + "_" + time + "_" + random
  return encodeURIComponent(fileName)
}
/**
 *  截取字符串 指定字符 之前的部分
 * @param str 字符串
 * @param s 指定字符
 * @return 返回截取后的字符
 */
export const getStr = (str: string, s: string): string => {
  const index = str.indexOf(s) // 查找第一个 '_' 的位置
  const result = str.substring(0, index) // 截取从字符串开始到 '_' 之前的部分
  if (result) {
    return result
  } else {
    return ""
  }
}
export const delVercelBlob = async (urls: string[]): Promise<void> => {
  let item: string
  for (item of urls) {
    const image: string | null = await kv.get(item)
    if (image) await del(image)
  }
}
