import { Context } from "hono"
import {
  errorStatusMessage,
  fetchIfExistsOrElse,
  getPagesAndNumbers,
  getUpdateedData,
  isNumber,
  setPermissions,
  valuesEmpty,
} from "../utils/utils"
import { ROLE_PERMISSION } from "../config"
import { sha256 } from "hono/utils/crypto"
import { sqlDb } from "../db/client"

const ROLES = "Roles"
const USERS = "Users"
export const getRoles = async (c: Context) => {
  const client = await sqlDb()
  try {
    const roles = await client.execute(
      `SELECT * FROM ${ROLES} WHERE SuperAdmin <> ?`,
      "all",
      [1]
    ) // 👈
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: roles.rows,
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  } finally {
    await client.close()
  }
}

export const getRole = async (c: Context) => {
  const { RoleId } = c.req.param()
  if (isNumber(RoleId))
    return errorStatusMessage(c, 422, "RoleId is not a valid number")
  const client = await sqlDb()
  try {
    const role = await client.execute(
      `SELECT * FROM ${ROLES} WHERE RoleId= ?AND SuperAdmin <> ?`,
      "first",
      [RoleId]
    )
    if (!role || !role.list) return errorStatusMessage(c, 404, "Role")
    return c.json({ success: 1, message: "Retrieval successful.", data: role })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  } finally {
    await client.close()
  }
}

export const createRole = async (c: Context) => {
  let Name: string, Description: string, Permissions: string
  try {
    ;({ Name, Description, Permissions } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  const client = await sqlDb()
  const transaction = await client.transactionFun("write")
  try {
    const emptyParame = valuesEmpty({ Name })
    if (emptyParame.length) {
      return errorStatusMessage(
        c,
        400,
        emptyParame.join(",") + " parameter is missing."
      )
    }
    //   判断角色是否存在
    const ifExist = await transaction.execute(
      `SELECT * FROM ${ROLES} WHERE Name = ?`,
      "first",
      [Name]
    )

    if (ifExist && ifExist.list)
      return errorStatusMessage(c, 409, "Role")
      //   处理没有传值，可为空的属性
    ;({ Description } = await fetchIfExistsOrElse({ Description }))

    const timeNow = Date.now()
    const insert = await transaction.execute(
      `INSERT INTO ${ROLES} (Name, Description, CreatedAt, UpdatedAt) VALUES (?,?,?,?)`,
      "write",
      [Name, Description, timeNow, timeNow]
    )
    if (!insert || insert.rowsAffected === 0) {
      await transaction.rollback()
      throw new Error("Failed to create role")
    }
    const permissionsInsetData = setPermissions(
      Permissions,
      insert.insertRowid as number
    )
    if (permissionsInsetData === null) {
      await transaction.commit()
      return c.json({
        success: 1,
        message: "New record created successfully.",
        data: { RoleId: insert.insertRowid },
      })
    }

    const permissionsInsert = await transaction.execute(
      `INSERT INTO ${ROLE_PERMISSION} (RoleId, PermissionId) VALUES ${permissionsInsetData}`,
      "write"
    )

    if (!permissionsInsert || permissionsInsert.rowsAffected === 0) {
      await transaction.rollback()
      throw new Error("Failed to create role")
    }
    await transaction.commit()
    return c.json({
      success: 1,
      message: "创建用户",
      data: { RoleId: insert.insertRowid },
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  } finally {
    await client.close()
  }
}

export const updateRole = async (c: Context) => {
  let { RoleId } = c.req.param()
  if (!isNumber(RoleId))
    return errorStatusMessage(c, 422, "RoleId is not a valid number")
  let Name: string, Description: string, Permissions: string
  try {
    ;({ Name, Description, Permissions } = await c.req.json())
  } catch (error) {
    return errorStatusMessage(c, 415)
  }
  const client = await sqlDb()
  const transaction = await client.transactionFun("write")
  try {
    // 判断修改的数据是否存在
    const isExist = await transaction.execute(
      `SELECT * FROM ${ROLES} WHERE RoleId = ? and SuperAdmin <> ?`,
      "first",
      [RoleId, 1]
    )

    if (!isExist || !isExist.list) return errorStatusMessage(c, 404, "Role")
    // 判断前端传来的数据和数据库的数据是否相同
    const updateedData = await getUpdateedData({ Name, Description })

    const nowDate = Date.now()
    const updatedPermissions = setPermissions(Permissions, RoleId)
    // 不是undefined说明有传值,删除原来的权限，重新插入
    if (typeof Permissions !== "undefined") {
      const delRolePermission = await transaction.execute(
        `DELETE FROM ${ROLE_PERMISSION} WHERE RoleId = ?`,
        "write",
        [RoleId]
      )

      if (updatedPermissions !== null) {
        const insertPermission = await transaction.execute(
          `INSERT INTO ${ROLE_PERMISSION} (RoleId, PermissionId) VALUES ${updatedPermissions}`,
          "write"
        )
        if (!insertPermission || insertPermission.rowsAffected === 0) {
          await transaction.rollback()
          throw new Error("Failed to update role")
        }
      }
    }

    // 判断names是否存在，name是唯一的
    const isExistNmae = await transaction.execute(
      `SELECT * FROM ${ROLES} WHERE Name = ? and RoleId != ?`,
      "first",
      [Name, RoleId]
    )

    if (isExistNmae && isExistNmae.list)
      return errorStatusMessage(c, 409, "Role name")
    // 执行修改
    const updated = await transaction.execute(
      `UPDATE ${ROLES} SET ${updateedData.fields},UpdatedAt=? WHERE RoleId = ?`,
      "write",
      [...Object.values(updateedData.values), nowDate, RoleId]
    )
    if (!updated || updated.rowsAffected === 0) {
      await transaction.rollback()
      throw new Error("Failed to update role")
    }
    await transaction.commit()
    return c.json({
      success: 1,
      message: "Modification successful.",
      data: { RoleId },
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  } finally {
    await client.close()
  }
}

export const deleteRole = async (c: Context) => {
  let { RoleId } = c.req.param()
  if (isNumber(RoleId))
    return errorStatusMessage(c, 422, "RoleId is not a valid number")
  const client = await sqlDb()
  try {
    const role = await client.execute(
      ` SELECT * FROM ${ROLES} WHERE RoleId = ?AND SuperAdmin <> ?`,
      "first",
      [RoleId, 1]
    )

    if (!role || !role.list) return errorStatusMessage(c, 404, "Role")
    const users = await client.execute(
      `SELECT * FROM ${USERS} WHERE RoleId = ?`,
      "first",
      [RoleId]
    )

    if (users && users.list)
      return errorStatusMessage(c, 409, "Users associated with roles")
    const result = await client.execute(
      `DELETE FROM ${ROLES} WHERE RoleId = ? and SuperAdmin <> ?`,
      "write",
      [RoleId, 1]
    )

    if (!result || result.rowsAffected === 0)
      return errorStatusMessage(c, 404, "Role")
    return c.json({ success: 1, message: "Deletion successful." })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  } finally {
    await client.close()
  }
}
