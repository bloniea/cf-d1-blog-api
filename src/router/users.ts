import { Context } from "hono"
import {
  errorStatusMessage,
  getUpdateedData,
  isNumber,
  valuesEmpty,
  verifyUserEmailPassword,
} from "../utils/utils.js"
import { sha256 } from "hono/utils/crypto"
import { pool, roles, users } from "../db/psql.js"

export const getUsers = async (c: Context) => {
  try {
    const usersData =
      await pool.query(`SELECT ${users}.user_id, ${users}.username, ${users}.email, ${users}.role_id, ${users}.created_at, ${users}.updated_at, ${roles}.Name as RoleName 
    FROM ${users} 
    JOIN ${roles} ON ${users}.user_id = ${roles}.role_id`)

    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: usersData.rows,
      total: usersData.rows.length,
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
export const getUser = async (c: Context) => {
  try {
    const { user_id } = c.req.param()
    if (!isNumber(user_id))
      return errorStatusMessage(c, 422, "user_id is not a valid number")

    const user = await pool.query(
      `SELECT ${users}.user_id, ${users}.username, ${users}.email, ${users}.role_id, ${users}.created_at, ${users}.updated_at, ${roles}.name as RoleName  FROM ${users} JOIN ${roles} ON ${users}.user_id = ${roles}.role_id WHERE ${users}.user_id = $1`,
      [user_id]
    )

    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: user.rows[0] || null,
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
export const createUser = async (c: Context) => {
  let username: string, email: string, role_id: string, password: string
  try {
    ;({ username, email, role_id, password } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  try {
    const emptyParame = valuesEmpty({ username, email, role_id, password })
    if (emptyParame.length) {
      return errorStatusMessage(
        c,
        400,
        emptyParame.join(",") + " parameter is missing."
      )
    }
    const validation = await verifyUserEmailPassword({
      username,
      email,
      password,
    })
    if (validation !== null) return errorStatusMessage(c, 422, validation)
    // 判断用户名或邮箱是否已经存在
    const ifExist = await pool.query(
      `SELECT * FROM ${users} WHERE username = $1 OR email = $2`,
      [username, email]
    )

    if (ifExist && ifExist.rowCount)
      return errorStatusMessage(c, 409, "User or email ")
    const timeNow = String(Date.now())
    const pwd = (await sha256(password)) as string
    const insert = await pool.query(
      `INSERT INTO ${users} (username, email, password,role_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING user_id`,
      [username, email, pwd, role_id, timeNow, timeNow]
    )
    if (!insert || !insert.rowCount) throw new Error("insert error")
    return c.json({
      success: 1,
      message: "New record created successfully.",
      data: { user_id: insert.rows[0].user_id },
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
export const updateUser = async (c: Context) => {
  const { user_id } = c.req.param()
  if (!isNumber(user_id))
    return errorStatusMessage(c, 422, "user_id is not a valid number")
  let username: string, email: string, role_id: number, password: string
  try {
    ;({ username, email, role_id, password } = await c.req.json())
  } catch (error) {
    console.log(error)
    return errorStatusMessage(c, 415)
  }
  try {
    // 判断要修改的用户是否存在
    const ifUserIdExist = await pool.query(
      `SELECT * FROM ${users} WHERE user_id = $1`,
      [user_id]
    )

    if (!ifUserIdExist || !ifUserIdExist.rowCount)
      return errorStatusMessage(c, 404, "User")

    // 获取更新的字段和值
    const updateedData = await getUpdateedData({
      username,
      email,
      password,
      role_id,
    })
    // 数据检测
    const validation = await verifyUserEmailPassword(updateedData.values)
    if (validation !== null) return errorStatusMessage(c, 422, validation)
    // 判断用户名或邮箱是否已经存在
    const ifExist = await pool.query(
      `SELECT * FROM ${users} WHERE user_id != $1 AND (${updateedData.sqlOr})`,
      [user_id]
    )

    if (ifExist && ifExist.rowCount) {
      return errorStatusMessage(c, 409, "User or email ")
    }
    // 修改
    console.log(
      `UPDATE ${users} SET ${updateedData.fields},updated_at=$${
        updateedData.fields.length + 1
      } WHERE user_id = $${updateedData.fields.length + 2}`
    )
    const update = await pool.query(
      `UPDATE ${users} SET ${updateedData.fields},updated_at=$${
        updateedData.fields.length + 1
      } WHERE user_id = $${updateedData.fields.length + 2}`,
      [...Object.values(updateedData.values), Date.now(), user_id]
    )

    if (!update || !update.rowCount) throw new Error("update error")
    return c.json({
      success: 1,
      message: "Modification successful.",
      data: { user_id: user_id },
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
export const deleteUser = async (c: Context) => {
  try {
    const { user_id } = c.req.param()
    if (!isNumber(user_id))
      return errorStatusMessage(c, 422, "user_id is not a valid number")
    const del = await pool.query(`DELETE FROM ${users} WHERE user_id = $1`, [
      user_id,
    ])

    if (!del || !del.rowCount) return errorStatusMessage(c, 404, "User")
    return c.json({ success: 1, message: "Deletion successful." })
  } catch (e) {
    console.error(e)
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
