import { Context } from "hono"
import {
  db,
  errorStatusMessage,
  fetchIfExistsOrElse,
  getPagesAndNumbers,
  getUpdateedData,
  setPermissions,
  valuesEmpty,
} from "../utils/utils"
import { ROLE_PERMISSION } from "../config"
import { sha256 } from "hono/utils/crypto"

const ROLES = "Roles"
const USERS = "Users"
export const getRoles = async (c: Context) => {
  console.log(await sha256(123456))
  const roles = await db(
    c,
    "all",
    `SELECT * FROM ${ROLES} WHERE SuperAdmin <> ?`,
    1
  )
  if (roles.err) return errorStatusMessage(c, 500, roles.err)
  return c.json({
    success: 1,
    message: "Retrieval successful.",
    data: roles.results,
  })
}

export const getRole = async (c: Context) => {
  const { RoleId } = c.req.param()
  const role = await db(
    c,
    "first",
    `SELECT * FROM ${ROLES} WHERE RoleId= ? AND SuperAdmin <> ?`,
    RoleId,
    1
  )
  if (role?.err) return errorStatusMessage(c, 500, role.err)
  if (!role) return errorStatusMessage(c, 404, "Role")
  return c.json({ success: 1, message: "Retrieval successful.", data: role })
}

export const createRole = async (c: Context) => {
  let Name: string, Description: string, Permissions: string
  try {
    ;({ Name, Description, Permissions } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  const emptyParame = valuesEmpty({ Name })
  if (emptyParame.length) {
    return errorStatusMessage(c, 400, emptyParame.join(","))
  }
  //   判断角色是否存在
  const ifExist = await db(
    c,
    "first",
    `SELECT * FROM ${ROLES} WHERE Name = ?`,
    Name
  )
  if (ifExist?.err) return errorStatusMessage(c, 500, ifExist.err)
  if (ifExist)
    return errorStatusMessage(c, 409, "Role")
    //   处理没有传值，可为空的属性
  ;({ Description } = await fetchIfExistsOrElse({ Description }))

  const timeNow = Date.now()
  const insert = await db(
    c,
    "run",
    `INSERT INTO ${ROLES} (Name, Description, CreatedAt, UpdatedAt) VALUES (?,?,?,?)`,
    Name,
    Description,
    timeNow,
    timeNow
  )
  if (insert.err) return errorStatusMessage(c, 500, insert.err)
  const permissionsInsetData = setPermissions(
    Permissions,
    insert.meta.last_row_id
  )
  if (permissionsInsetData === null) {
    return c.json({
      success: 1,
      message: "New record created successfully.",
      data: { RoleId: insert.meta.last_row_id },
    })
  }

  const permissionsInsert = await db(
    c,
    "run",
    `INSERT INTO ${ROLE_PERMISSION} (RoleId, PermissionId) VALUES ${permissionsInsetData}`
  )
  if (permissionsInsert.err)
    return errorStatusMessage(c, 500, permissionsInsert.err)
  return c.json({
    success: 1,
    message: "创建用户",
    data: { RoleId: insert.meta.last_row_id },
  })
}

export const updateRole = async (c: Context) => {
  let { RoleId } = c.req.param()
  let Name: string, Description: string, Permissions: string
  try {
    ;({ Name, Description, Permissions } = await c.req.json())
  } catch (error) {
    return errorStatusMessage(c, 415)
  }
  // 判断修改的数据是否存在
  const isExist = await db(
    c,
    "first",
    `SELECT * FROM ${ROLES} WHERE RoleId = ? and SuperAdmin <> ?`,
    RoleId,
    1
  )
  if (isExist?.err) return errorStatusMessage(c, 500, isExist.err)
  if (!isExist) return errorStatusMessage(c, 404, "Role")
  // 判断前端传来的数据和数据库的数据是否相同
  const updateedData = await getUpdateedData({ Name, Description })
  const checkObjectEquality = await db(
    c,
    "first",
    `SELECT * FROM ${ROLES} WHERE RoleId = ? and ${updateedData.sqlAnd}`,
    RoleId,
    ...Object.values(updateedData.values)
  )
  if (checkObjectEquality?.err)
    return errorStatusMessage(c, 500, checkObjectEquality.err)
  const nowDate = Date.now()
  const updatedPermissions = setPermissions(Permissions, RoleId)
  // 不是undefined说明有传值
  if (typeof Permissions !== "undefined") {
    const delRolePermission = await db(
      c,
      "run",
      `DELETE FROM ${ROLE_PERMISSION} WHERE RoleId = ?`,
      RoleId
    )
    if (delRolePermission.err)
      return errorStatusMessage(c, 500, delRolePermission.err)
    if (updatedPermissions !== null) {
      const insertPermission = await db(
        c,
        "run",
        `INSERT INTO ${ROLE_PERMISSION} (RoleId, PermissionId) VALUES ${updatedPermissions}`
      )
      if (insertPermission.err)
        return errorStatusMessage(c, 500, insertPermission.err)
    }
  }
  if (checkObjectEquality) {
    // 更新修改时间，这个用sql自动更新时间最好，但我偏不用
    const updated = await db(
      c,
      "run",
      `UPDATE ${ROLES} SET UpdatedAt=? WHERE RoleId = ?`,
      nowDate,
      RoleId
    )
    if (updated.err) return errorStatusMessage(c, 500, updated.err)

    return c.json({ success: 1, message: "Modification successful." })
  }
  // 判断names是否存在，name是唯一的
  const isExistNmae = await db(
    c,
    "first",
    `SELECT * FROM ${ROLES} WHERE Name = ? and RoleId != ?`,
    Name,
    RoleId
  )
  if (isExistNmae?.err) return errorStatusMessage(c, 500, isExistNmae.err)
  if (isExistNmae) return errorStatusMessage(c, 409, "Role name")
  // 执行修改
  const updated = await db(
    c,
    "run",
    `UPDATE ${ROLES} SET ${updateedData.fields},UpdatedAt=? WHERE RoleId = ?`,
    ...Object.values(updateedData.values),
    nowDate,
    RoleId
  )
  if (updated.err) return errorStatusMessage(c, 500, updated.err)

  return c.json({ success: 1, message: "Modification successful." })
}

export const deleteRole = async (c: Context) => {
  let { RoleId } = c.req.param()
  const role = await db(
    c,
    "first",
    `SELECT * FROM ${ROLES} WHERE RoleId = ? AND SuperAdmin <> ?`,
    RoleId,
    1
  )
  if (role?.err) return errorStatusMessage(c, 500, role.err)
  if (!role) return errorStatusMessage(c, 404, "Role")
  const users = await db(
    c,
    "first",
    `SELECT * FROM ${USERS} WHERE RoleId = ?`,
    RoleId
  )
  if (users?.err) return errorStatusMessage(c, 500, users.err)
  if (users) return errorStatusMessage(c, 409, "Users associated with roles")
  const result = await db(
    c,
    "run",
    `DELETE FROM ${ROLES} WHERE RoleId = ? and SuperAdmin <> ?`,
    RoleId,
    1
  )
  if (result.err) return errorStatusMessage(c, 500, result.err)
  if (result.meta.changes === 0) return errorStatusMessage(c, 404, "Role")
  c.status(200)
  return c.json({ success: 1, message: "Deletion successful." })
}
