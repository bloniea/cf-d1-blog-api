import { Context } from "hono"
import {
  errorStatusMessage,
  getUpdateedData,
  isNumber,
  valuesEmpty,
  verifyUserEmailPassword,
} from "../utils/utils"
import { sha256 } from "hono/utils/crypto"
import { sqlDb } from "../db/client"

const USERS = "Users"
const ROLES = "Roles"
export const getUsers = async (c: Context) => {
  try {
    const client = await sqlDb()
    const users = await client.execute(
      `SELECT ${USERS}.UserId, ${USERS}.Username, ${USERS}.Email, ${USERS}.RoleId, ${USERS}.CreatedAt, ${USERS}.UpdatedAt, ${ROLES}.Name as RoleName 
    FROM ${USERS} 
    JOIN ${ROLES} ON ${USERS}.UserId = ${ROLES}.RoleId`,
      "all"
    )
    await client.close()
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: users.rows,
      total: users.rows.length,
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
export const getUser = async (c: Context) => {
  const { UserId } = c.req.param()
  if (!isNumber(UserId))
    return errorStatusMessage(c, 422, "UserId is not a valid number")
  const client = await sqlDb()
  const user = await client.execute(
    `SELECT ${USERS}.UserId, ${USERS}.Username, ${USERS}.Email, ${USERS}.RoleId, ${USERS}.CreatedAt, ${USERS}.UpdatedAt, ${ROLES}.Name as RoleName  FROM ${USERS} JOIN ${ROLES} ON ${USERS}.UserId = ${ROLES}.RoleId WHERE ${USERS}.UserId = ?`,
    "first",
    [UserId]
  )
  await client.close()
  return c.json({
    success: 1,
    message: "Retrieval successful.",
    data: user.list,
  })
}
export const createUser = async (c: Context) => {
  let Username: string, Email: string, RoleId: number, Password: string
  try {
    ;({ Username, Email, RoleId, Password } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  try {
    const emptyParame = valuesEmpty({ Username, Email, RoleId, Password })
    if (emptyParame.length) {
      return errorStatusMessage(
        c,
        400,
        emptyParame.join(",") + " parameter is missing."
      )
    }
    const validation = await verifyUserEmailPassword({
      Username,
      Email,
      Password,
    })
    if (validation !== null) return errorStatusMessage(c, 422, validation)
    const client = await sqlDb()
    // 判断用户名或邮箱是否已经存在
    const ifExist = await client.execute(
      `SELECT * FROM ${USERS} WHERE Username = ? OR Email = ?`,
      "first",
      [Username, Email]
    )

    if (ifExist && ifExist.list)
      return errorStatusMessage(c, 409, "User or Email ")
    const timeNow = Date.now()

    const insert = await client.execute(
      `INSERT INTO ${USERS} (Username, Email, Password,RoleId, CreatedAt, UpdatedAt) VALUES (?,?,?,?,?,?)`,
      "write",
      [Username, Email, await sha256(Password), RoleId, timeNow, timeNow]
    )
    await client.close()
    if (!insert || !insert.rowsAffected) throw new Error("insert error")
    return c.json({ success: 1, message: "New record created successfully." })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
export const updateUser = async (c: Context) => {
  const { UserId } = c.req.param()
  if (!isNumber(UserId))
    return errorStatusMessage(c, 422, "UserId is not a valid number")
  let Username: string, Email: string, RoleId: number, Password: string
  try {
    ;({ Username, Email, RoleId, Password } = await c.req.json())
  } catch (error) {
    console.log(error)
    return errorStatusMessage(c, 415)
  }
  try {
    const client = await sqlDb()
    // 判断要修改的用户是否存在
    const ifUserIdExist = await client.execute(
      `SELECT * FROM ${USERS} WHERE UserId = ?`,
      "first",
      [UserId]
    )

    if (!ifUserIdExist || !ifUserIdExist.list)
      return errorStatusMessage(c, 404, "User")

    // 获取更新的字段和值
    const updateedData = await getUpdateedData({
      Username,
      Email,
      Password,
      RoleId,
    })
    // 数据检测
    const validation = await verifyUserEmailPassword(updateedData.values)
    if (validation !== null) return errorStatusMessage(c, 422, validation)

    // 判断用户名或邮箱是否已经存在
    const ifExist = await client.execute(
      `SELECT * FROM ${USERS} WHERE UserId != ? AND (${updateedData.sqlOr})`,
      "first",
      [UserId]
    )

    if (ifExist && ifExist.list) {
      await client.close()
      return errorStatusMessage(c, 409, "User or Email ")
    }
    // 修改
    const update = await client.execute(
      `UPDATE ${USERS} SET ${updateedData.fields},UpdatedAt=? WHERE UserId = ?`,
      "write",
      [...Object.values(updateedData.values), Date.now(), UserId]
    )
    await client.close()
    if (!update || !update.rowsAffected) throw new Error("update error")
    return c.json({
      success: 1,
      message: "Modification successful.",
      data: { UserId: UserId },
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
export const deleteUser = async (c: Context) => {
  try {
    const { UserId } = c.req.param()
    if (!isNumber(UserId))
      return errorStatusMessage(c, 422, "UserId is not a valid number")
    const client = await sqlDb()
    const del = await client.execute(
      `DELETE FROM ${USERS} WHERE UserId = ?`,
      "write",
      [UserId]
    )
    await client.close()
    if (!del || del.rowsAffected === 0)
      return errorStatusMessage(c, 404, "User")
    return c.json({ success: 1, message: "Deletion successful." })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
