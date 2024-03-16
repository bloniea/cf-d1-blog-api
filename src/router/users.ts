import { Context } from "hono"
import {
  db,
  errorStatusMessage,
  getUpdateedData,
  valuesEmpty,
  verifyUserEmailPassword,
} from "../utils/utils"
import { sha256 } from "hono/utils/crypto"

const USERS = "Users"
const ROLES = "Roles"
export const getUsers = async (c: Context) => {
  const users = await db(
    c,
    "all",
    `SELECT ${USERS}.UserId, ${USERS}.Username, ${USERS}.Email, ${USERS}.RoleId, ${USERS}.CreatedAt, ${USERS}.UpdatedAt, ${ROLES}.Name as RoleName
  FROM ${USERS}
  JOIN ${ROLES} ON ${USERS}.UserId = ${ROLES}.RoleId`
  )
  if (users.err) return errorStatusMessage(c, 500, users.err)
  return c.json({
    success: 1,
    message: "Retrieval successful.",
    data: users.results,
  })
}
export const getUser = async (c: Context) => {
  const { UserId } = await c.req.param()
  const user = await db(
    c,
    "first",
    `SELECT ${USERS}.UserId, ${USERS}.Username, ${USERS}.Email, ${USERS}.RoleId, ${USERS}.CreatedAt, ${USERS}.UpdatedAt, ${ROLES}.Name as RoleName
  FROM ${USERS}
  JOIN ${ROLES} ON ${USERS}.UserId = ${ROLES}.RoleId
  WHERE ${USERS}.UserId = ?`,
    UserId
  )
  if (user?.err) return errorStatusMessage(c, 500, user.err)
  return c.json({ success: 1, message: "Retrieval successful.", data: user })
}
export const createUser = async (c: Context) => {
  let Username: string, Email: string, RoleId: number, Password: string
  try {
    ;({ Username, Email, RoleId, Password } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  const emptyParame = valuesEmpty({ Username, Email, RoleId, Password })
  if (emptyParame.length) {
    return errorStatusMessage(c, 400, emptyParame.join(","))
  }
  const validation = await verifyUserEmailPassword({
    Username,
    Email,
    Password,
  })
  if (validation !== null) return errorStatusMessage(c, 422, validation)

  const ifExist = await db(
    c,
    "first",
    `SELECT * FROM ${USERS} WHERE Username = ? OR Email = ?`,
    Username,
    Email
  )
  if (ifExist?.err) return errorStatusMessage(c, 500, ifExist.err)
  if (ifExist) return errorStatusMessage(c, 409, "User or Email ")
  const timeNow = Date.now()
  const insert = await db(
    c,
    "run",
    `INSERT INTO ${USERS} (Username, Email, Password,RoleId, CreatedAt, UpdatedAt) VALUES (?,?,?,?,?,?)`,
    Username,
    Email,
    await sha256(Password),
    RoleId,
    timeNow,
    timeNow
  )
  if (insert.err) return errorStatusMessage(c, 500, insert.err)
  return c.json({ success: 1, message: "New record created successfully." })
}
export const updateUser = async (c: Context) => {
  const UserId = c.req.param("UserId")
  let Username: string, Email: string, RoleId: number, Password: string
  try {
    ;({ Username, Email, RoleId, Password } = await c.req.json())
  } catch (error) {
    console.log(error)
    return errorStatusMessage(c, 415)
  }

  // 判断要修改的用户是否存在
  const ifUserIdExist = await db(
    c,
    "first",
    `SELECT * FROM ${USERS} WHERE UserId = ?`,
    UserId
  )
  if (ifUserIdExist?.err) return errorStatusMessage(c, 500, ifUserIdExist.err)
  if (!ifUserIdExist) return errorStatusMessage(c, 404, "User")

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
  // 判断数据相同
  const checkObjectEquality = await db(
    c,
    "first",
    `SELECT * FROM ${USERS} WHERE UserId = ? and ${updateedData.sqlAnd}`,
    UserId,
    ...Object.values(updateedData.values)
  )
  if (checkObjectEquality?.err)
    return errorStatusMessage(c, 500, checkObjectEquality.err)
  const timeNow = Date.now()
  if (checkObjectEquality) {
    // 更新修改时间，这个用sql自动更新时间最好，但我偏不用
    const updated = await db(
      c,
      "run",
      `UPDATE ${USERS} SET UpdatedAt=? WHERE UserId = ?`,
      timeNow,
      UserId
    )
    if (updated.err) return errorStatusMessage(c, 500, updated.err)
    c.status(200)
    return c.json({
      success: 1,
      message: "Modification successful.",
      data: { UserId: UserId },
    })
  }
  console.log(
    `SELECT * FROM ${USERS} WHERE UserId != ? AND (${updateedData.sqlOr})`
  )
  // 判断用户名或邮箱是否已经存在
  const ifExist = await db(
    c,
    "first",
    `SELECT * FROM ${USERS} WHERE UserId != ? AND (${updateedData.sqlOr})`,
    UserId
  )
  if (ifExist?.err) return errorStatusMessage(c, 500, ifExist.err)
  if (ifExist) return errorStatusMessage(c, 409, "User or Email ")
  // 修改
  const update = await db(
    c,
    "run",
    `UPDATE ${USERS} SET ${updateedData.fields},UpdatedAt=? WHERE UserId = ?`,
    ...Object.values(updateedData.values),
    timeNow,
    UserId
  )
  if (update.err) return errorStatusMessage(c, 500, update.err)
  return c.json({
    success: 1,
    message: "Modification successful.",
    data: { UserId: UserId },
  })
}
export const deleteUser = async (c: Context) => {
  const UserId = c.req.param("UserId")
  const del = await db(
    c,
    "run",
    `DELETE FROM ${USERS} WHERE UserId = ?`,
    UserId
  )
  if (del.err) return errorStatusMessage(c, 500, del.err)
  return c.json({ success: 1, message: "Deletion successful." })
}
