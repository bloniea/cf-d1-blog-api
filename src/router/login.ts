import { Context } from "hono"
import { db, errorStatusMessage, getUpdateedData } from "../utils/utils"
import { USER } from "../config"
import { sha256 } from "hono/utils/crypto"
import { setToken, verify } from "../utils/jwt"
import { env } from "hono/adapter"
export const login = async (c: Context) => {
  let Username: string, Password: string, Email: string
  try {
    ;({ Username, Password, Email } = await c.req.json())
  } catch (error) {
    console.error(error)
    return errorStatusMessage(c, 415)
  }

  if (!(Password && (Email || Username)))
    return errorStatusMessage(c, 400, "password, Username or Email")
  const dataFilter = await getUpdateedData({ Username, Email })
  const auth = await db(
    c,
    "first",
    `SELECT ${USER}.UserId,${USER}.Username,${USER}.Email,${USER}.RoleId FROM ${USER} WHERE ${dataFilter.sqlAnd} AND Password=?`,
    ...Object.values(dataFilter.values),

    await sha256(Password)
  )
  if (auth?.err) return errorStatusMessage(c, 500, auth.err)
  if (auth) {
    // console.log(auth)
    const tokenSecret = env(c).TOKEN_SECRET
    const refreshTokenSecret = env(c).REFRESH_TOKEN_SECRET
    const token = await setToken(auth, tokenSecret)
    // 604800 7天的秒数
    const refreshToken = await setToken(auth, refreshTokenSecret, 604800)
    return c.json({
      success: 1,
      message: "登录成功",
      data: { user: auth, token, refreshToken },
    })
  }
  c.status(401)
  return c.json({ success: 0, message: "用户或密码错误" })
}

export const refreshToken = async (c: Context) => {
  let RefreshToken: string
  try {
    ;({ RefreshToken } = await c.req.json())
  } catch (error) {
    return errorStatusMessage(c, 415)
  }
  if (RefreshToken.startsWith("Bearer ")) {
    try {
      const refreshTokenSecret = env(c).REFRESH_TOKEN_SECRET
      const tokenSecret = env(c).TOKEN_SECRET
      RefreshToken = RefreshToken.replace("Bearer ", "")
      const getRefreshToken = await verify(RefreshToken, refreshTokenSecret)
      const token = await setToken(getRefreshToken, tokenSecret)
      const refreshToken = await setToken(
        getRefreshToken,
        refreshTokenSecret,
        604800
      )
      return c.json({
        success: 1,
        message: "refreshToken",
        token,
        refreshToken,
      })
    } catch (error) {
      return errorStatusMessage(c, 401, "签名不匹配")
    }
  } else {
    return errorStatusMessage(c, 422, "RefreshToken")
  }
}
