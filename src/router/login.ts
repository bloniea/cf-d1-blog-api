import { Context } from "hono"
import {
  errorStatusMessage,
  getUpdateedData,
  valuesEmpty,
  verifyUserEmailPassword,
} from "../utils/utils.js"
import { sha256 } from "hono/utils/crypto"
import { setToken, verify } from "../utils/jwt.js"
import { pool, users } from "../db/psql.js"

export const login = async (c: Context) => {
  let username: string, password: string, email: string
  try {
    ;({ username, password, email } = await c.req.json())
  } catch (error) {
    console.error(error)
    return errorStatusMessage(c, 415)
  }
  try {
    if (!(password && (email || username)))
      return errorStatusMessage(
        c,
        400,
        "password, Username or Email parameter is missing."
      )
    const dataFilter = await getUpdateedData({ username, email })
    const auth = await pool.query(
      `SELECT ${users}.user_id,${users}.username,${users}.email,${users}.role_id FROM ${users} WHERE ${dataFilter.sqlAnd} AND password=$2`,
      [...Object.values(dataFilter.values), await sha256(password)]
    )

    if (auth && auth.rowCount) {
      const tokenSecret = process.env.TOKEN_SECRET || "Bronya"
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "Seele"
      const token = await setToken(auth.rows[0], tokenSecret)
      // 604800 7天的秒数
      const refreshToken = await setToken(
        auth.rows[0],
        refreshTokenSecret,
        604800
      )
      return c.json({
        success: 1,
        message: "登录成功",
        data: { user: auth.rows[0], token, refreshToken },
      })
    }
    c.status(401)
    return c.json({ success: 0, message: "用户或密码错误" })
  } catch (e) {
    console.error(e)
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export const refreshToken = async (c: Context) => {
  let refreshToken: string
  try {
    ;({ refreshToken } = await c.req.json())
  } catch (error) {
    return errorStatusMessage(c, 415)
  }
  if (refreshToken.startsWith("Bearer ")) {
    try {
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "Seele"
      const tokenSecret = process.env.TOKEN_SECRET || "Bronya"
      refreshToken = refreshToken.replace("Bearer ", "")
      const getRefreshToken = await verify(refreshToken, refreshTokenSecret)
      const token = await setToken(getRefreshToken.payload, tokenSecret)
      const newRefreshToken = await setToken(
        getRefreshToken.payload,
        refreshTokenSecret,
        604800
      )
      return c.json({
        success: 1,
        message: "refreshToken",
        data: { token, refreshToken: newRefreshToken, refresh: true },
      })
    } catch (error) {
      console.error(error)
      return errorStatusMessage(c, 401, "签名不匹配")
    }
  } else {
    return errorStatusMessage(c, 422, "RefreshToken")
  }
}

export const retPasword = async (c: Context) => {
  const { userId } = c.req.param()
  if (!userId) return errorStatusMessage(c, 422, "userId is not a valid number")
  let password: string, newPassword: string, confirmPassword: string
  try {
    ;({ password, newPassword, confirmPassword } = await c.req.json())
  } catch (e) {
    return errorStatusMessage(c, 415)
  }
  try {
    const EmptyDayta = valuesEmpty({ password, newPassword, confirmPassword })
    if (EmptyDayta.length)
      return errorStatusMessage(
        c,
        400,
        EmptyDayta.join(",") + " parameter is missing."
      )
    const verify = await verifyUserEmailPassword({ Password: newPassword })
    if (verify !== null)
      return errorStatusMessage(
        c,
        400,
        verify + " does not meet the requirements."
      )
    if (newPassword !== confirmPassword)
      return errorStatusMessage(
        c,
        400,
        "The new password and the password entered again do not match."
      )
    const pwd = (await sha256(password)) as string
    const user = await pool.query(
      `SELECT * FROM ${users} WHERE user_id = $1 AND password = $1`,
      [userId, pwd]
    )

    if (user && user.rowCount) {
      const pwd = (await sha256(newPassword)) as string
      const result = await pool.query(
        `UPDATE ${users} SET Password = $1 WHERE UserId = $2`,
        [pwd, userId]
      )

      if (result && result.rowCount) {
        return c.json({ success: 1, message: "Modification successful." })
      }
      return errorStatusMessage(c, 500, "Modification failed.")
    }
    return errorStatusMessage(c, 401, "Invalid username or password.")
  } catch (e) {
    console.error(e)
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
