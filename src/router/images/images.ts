import { Context } from "hono"
import {
  cryptoPassword,
  errorStatusMessage,
  toNumber,
} from "../../utils/utils.js"
import { image_users, images, images_category, pool } from "../../db/psql.js"
import { QueryResult } from "pg"
import { CombinedResponse } from "../../utils/types.js"
import { setToken, verify } from "../../utils/jwt.js"

export const getImages = async (c: Context): Promise<CombinedResponse> => {
  try {
    let category_id: number | string | boolean,
      pagesize: number | string,
      pagenum: number | string,
      keyword: string
    ;({ category_id, pagesize, pagenum, keyword } = c.req.query())
    // 初始化
    pagesize = toNumber(pagesize) || 10
    pagenum = toNumber(pagenum) || 1
    category_id = toNumber(category_id)
    keyword = keyword ? `%${keyword}%` : "%"

    let imagesRes: QueryResult<any>, total: QueryResult<any>

    if (!category_id || category_id === 0) {
      imagesRes = await pool.query(
        `SELECT * FROM ${images} WHERE  name LIKE $3  ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [String(pagesize), String((pagenum - 1) * pagesize), keyword]
      )
      total = await pool.query(
        `SELECT COUNT(*) AS total FROM ${images} WHERE  name LIKE $1`,
        [keyword]
      )
      c.status(200)
      return c.json({
        success: 1,
        message: "Retrieval successful.",
        status: 200,
        data: { result: imagesRes.rows, ...total.rows[0] },
      })
    }
    imagesRes = await pool.query(
      `SELECT * FROM ${images} WHERE  category_id= $4 AND name LIKE $3  ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [
        String(pagesize),
        String((pagenum - 1) * pagesize),
        keyword,
        String(category_id),
      ]
    )
    total = await pool.query(
      `SELECT COUNT(*) AS total FROM ${images} WHERE  category_id= $2 AND  name LIKE $1`,
      [keyword, String(category_id)]
    )
    c.status(200)
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      status: 200,
      data: { result: imagesRes.rows, ...total.rows[0] },
    })
  } catch (e) {
    console.error(e)

    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
export const getImagesCategories = async (
  c: Context
): Promise<CombinedResponse> => {
  const res = await pool.query(`SELECT * FROM ${images_category}`)
  c.status(200)
  return c.json({
    success: 1,
    message: "获取成功",
    status: 200,
    data: {
      result: res.rows,
    },
  })
}

export const login = async (c: Context): Promise<CombinedResponse> => {
  const { username, password } = await c.req.json()
  if (!username || !password) {
    c.status(400)
    return c.json({
      success: 0,
      message: "缺少必须参数",
      status: 400,
    })
  }

  try {
    const nPasswd = await cryptoPassword(password)
    const user = await pool.query(
      `SELECT * FROM ${image_users} WHERE username = $1 AND password = $2`,
      [username, nPasswd]
    )
    if (user && user.rowCount) {
      const tokenSecret = process.env.TOKEN_SECRET || "Bronya"
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "Seele"
      const token = await setToken(
        { image_user_id: user.rows[0].image_user_id },
        tokenSecret
      )
      // 604800 7天的秒数
      const refreshToken = await setToken(
        { image_user_id: user.rows[0].image_user_id },
        refreshTokenSecret,
        604800
      )
      c.status(200)
      return c.json({
        success: 1,
        message: "登录成功",
        status: 200,
        data: {
          image_user_id: user.rows[0].image_user_id,
          username: user.rows[0].username,
          token: token,
          refresh_token: refreshToken,
        },
      })
    } else {
      return errorStatusMessage(c, 401, "用户或密码错误")
    }
  } catch (e) {
    console.error(e)
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export const refresh = async (c: Context): Promise<CombinedResponse> => {
  // const header = getHeaders(event)
  // if (!header.user_id) {
  //   setResponseStatus(event, 401)
  //   return { status: 0, message: "请求头缺少user_id" }
  // }
  // const query = getQuery(event)
  const { refresh_token } = await c.req.json()
  if (!refresh_token) {
    // setResponseStatus(event, 400)
    // return { status: 0, message: "缺少refresh_token" }
    return errorStatusMessage(c, 400, "缺少refresh_token")
  }
  const refresh_tokenEd = (refresh_token as string).replace("Bearer ", "")
  let info
  try {
    info = await verify(
      refresh_tokenEd,
      process.env.REFRESH_TOKEN_SECRET || "Seele"
    )
  } catch (e) {
    return errorStatusMessage(
      c,
      401,
      "Token expired or invalid.",
      "refresh_token invalid"
    )
  }
  // const info = JWT.get(refresh_token, process.env.R_TOKEN || "") as any
  if (info) {
    // const image_user_id = c.req.header("image_user_id") as unknown as number
    // if (info.payload.image_user_id !== image_user_id) {
    //   return errorStatusMessage(c, 401, "认证失败")
    // }
    const token = await setToken(
      { image_user_id: info.payload.image_user_id },
      process.env.TOKEN_SECRET || "Bronya"
    )
    let newRT = await setToken(
      { image_user_id: info.payload.image_user_id },
      process.env.REFRESH_TOKEN_SECRET || "Seele",
      604800
    )

    return c.json({
      success: 1,
      message: "刷新token成功",
      status: 200,
      data: { token: token, refresh_token: newRT, refresh: 1 },
    })
  } else {
    return errorStatusMessage(
      c,
      401,
      "Token expired or invalid.",
      "refresh_token invalid"
    )
  }
}
export const reset = async (c: Context): Promise<CombinedResponse> => {
  const { oldPassword, password, repeatPassword } = await c.req.json()
  const auth = c.req.header("Authorization")
  // 已通过中间件数据必然是存在
  const authToken = auth?.replace("Bearer ", "") as string
  const userInfo = await verify(authToken, process.env.TOKEN_SECRET || "Bronya")

  const oldUser = await pool.query(
    `SELECT * FROM ${image_users} WHERE image_user_id = $1`,
    [userInfo.payload.image_user_id]
  )
  if (!oldUser.rowCount) {
    return errorStatusMessage(c, 404, "用户不存在")
  }
  if ((await cryptoPassword(oldPassword)) !== oldUser.rows[0].password) {
    return errorStatusMessage(c, 401, "旧密码不正确", { old: 1 })
    //   setResponseStatus(event, 403)
    //   return { status: 0, message: "旧密码不正确", data: { old: 1 } }
  }

  if (password !== repeatPassword) {
    return errorStatusMessage(c, 401, "两次输出的密码不相同", { repeat: 1 })
    // setResponseStatus(event, 403)
    // return {
    //   status: 0,
    //   message: "两次输出的密码不相同",
    //   data: {
    //     repeat: 1,
    //   },
    // }
  }
  const insertPsswd = await pool.query(
    `UPDATE ${image_users} SET password = $1 WHERE image_user_id = $2`,
    [await cryptoPassword(password), String(userInfo.payload.image_user_id)]
  )
  if (!insertPsswd || !insertPsswd.rowCount) {
    throw new Error("Update failed")
  }

  return c.json({
    success: 1,
    message: "密码修改成功",
    status: 200,
  })
}
export const uploadImage = async (c: Context): Promise<CombinedResponse> => {
  return c.json({
    success: 1,
    message: "上传成功",
    status: 200,
  })
}
function setResponseStatus(event: Event | undefined, arg1: number) {
  throw new Error("Function not implemented.")
}
