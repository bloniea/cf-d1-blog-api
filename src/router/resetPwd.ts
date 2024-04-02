import { Context } from "hono"
import { pool, users } from "../db/psql.js"
import { errorStatusMessage } from "../utils/utils.js"
import { verify } from "../utils/jwt.js"
import { Hash } from "crypto"
import { sha256 } from "hono/utils/crypto"
export const resetPwd = async (c: Context) => {
  let password: string, newPassword: string, confirmPassword: string
  try {
    ;({ password, newPassword, confirmPassword } = await c.req.json())
  } catch (e) {
    return errorStatusMessage(c, 415)
  }
  try {
    const Authorization = c.req
      .header("Authorization")
      ?.replace("Bearer ", "") as string
    const user = await verify(Authorization, process.env.TOKEN_SECRET || "")
    const pwd = (await sha256(password)) as string
    const useRes = await pool.query(
      `SELECT * FROM ${users} WHERE user_id = $1 AND password = $2`,
      [user.payload.user_id, pwd]
    )
    if (!useRes.rowCount) {
      return errorStatusMessage(c, 401, "Invalid old password")
    }
    if (newPassword !== confirmPassword) {
      return errorStatusMessage(c, 400, "Passwords do not match")
    }
    const newpwd = (await sha256(newPassword)) as string
    const updateUser = await pool.query(
      `UPDATE ${users} SET password=$1 WHERE user_id = $2`,
      [newpwd, useRes.rows[0].user_id]
    )
    if (!updateUser || !updateUser.rowCount) throw new Error("update error")
    return c.json({
      success: 1,
      message: "Modification successful.",
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
