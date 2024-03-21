import { Context } from "hono"
import {
  errorStatusMessage,
  fetchIfExistsOrElse,
  getPagesAndNumbers,
  getUpdateedData,
  isNumber,
  setPermissions,
  valuesEmpty,
} from "../utils/utils.js"
import { pool, role_permissions, roles, users } from "../db/psql.js"

export const getRoles = async (c: Context) => {
  try {
    const rolesD = await pool.query(
      `SELECT * FROM ${roles} WHERE super_admin <> $1`,
      [1]
    )
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: rolesD.rows,
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

export const getRole = async (c: Context) => {
  const { role_id } = c.req.param()
  console.log(role_id)
  if (!isNumber(role_id))
    return errorStatusMessage(c, 422, "role_id is not a valid number")
  try {
    const role = await pool.query(
      `SELECT * FROM ${roles} WHERE role_id= $1 AND super_admin <> $2`,
      [role_id, "1"]
    )
    if (!role || !role.rowCount) return errorStatusMessage(c, 404, "Role")
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: role.rows[0],
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

export const createRole = async (c: Context) => {
  let name: string, description: string, permissions: string
  try {
    ;({ name, description, permissions } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }

  try {
    const emptyParame = valuesEmpty({ name })
    if (emptyParame.length) {
      return errorStatusMessage(
        c,
        400,
        emptyParame.join(",") + " parameter is missing."
      )
    }
    //   判断角色是否存在
    const ifExist = await pool.query(`SELECT * FROM ${roles} WHERE name = $1`, [
      name,
    ])

    if (ifExist && ifExist.rowCount)
      return errorStatusMessage(c, 409, "Role")
      //   处理没有传值，可为空的属性
    ;({ description } = await fetchIfExistsOrElse({ description }))

    const timeNow = String(Date.now())
    const insert = await pool.query(
      `INSERT INTO ${roles} (name, description, created_at, updated_at) VALUES ($1,$2,$3,$4) RETURNING role_id`,
      [name, description, timeNow, timeNow]
    )

    if (!insert || !insert.rowCount) {
      throw new Error("Failed to create role")
    }
    const permissionsInsetData = setPermissions(
      permissions,
      insert.rows[0].role_id
    )
    if (permissionsInsetData === null) {
      return c.json({
        success: 1,
        message: "New record created successfully.",
        data: { role_id: insert.rows[0].role_id },
      })
    }

    const permissionsInsert = await pool.query(
      `INSERT INTO ${role_permissions} (role_id, PermissionId) VALUES ${permissionsInsetData}`
    )

    if (!permissionsInsert || !permissionsInsert.rowCount) {
      throw new Error("Failed to create role")
    }
    return c.json({
      success: 1,
      message: "创建用户",
      data: { role_id: insert.rows[0].role_id },
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

export const updateRole = async (c: Context) => {
  let { role_id } = c.req.param()
  if (!isNumber(role_id))
    return errorStatusMessage(c, 422, "role_id is not a valid number")
  let name: string, description: string, permissions: string
  try {
    ;({ name, description, permissions } = await c.req.json())
  } catch (error) {
    return errorStatusMessage(c, 415)
  }

  try {
    // 判断修改的数据是否存在
    const isExist = await pool.query(
      `SELECT * FROM ${roles} WHERE role_id = $1 and super_admin <> $2`,
      [role_id, "1"]
    )

    if (!isExist || !isExist.rowCount) return errorStatusMessage(c, 404, "Role")
    // 判断前端传来的数据和数据库的数据是否相同
    const updateedData = await getUpdateedData({ name, description })

    const nowDate = Date.now()
    const updatedPermissions = setPermissions(permissions, role_id)
    // 不是undefined说明有传值,删除原来的权限，重新插入
    if (typeof permissions !== "undefined") {
      const delRolePermission = await pool.query(
        `DELETE FROM ${role_permissions} WHERE role_id = $1`,
        [role_id]
      )

      if (updatedPermissions !== null) {
        const insertPermission = await pool.query(
          `INSERT INTO ${role_permissions} (role_id, PermissionId) VALUES ${updatedPermissions}`
        )

        if (!insertPermission || !insertPermission.rowCount) {
          throw new Error("Failed to update role")
        }
      }
    }

    // 判断names是否存在，name是唯一的
    const isExistNmae = await pool.query(
      `SELECT * FROM ${roles} WHERE name = $1 and role_id != $2`,
      [name, role_id]
    )

    if (isExistNmae && isExistNmae.rowCount)
      return errorStatusMessage(c, 409, "Role name")
    // 执行修改
    const updated = await pool.query(
      `UPDATE ${roles} SET ${updateedData.fields},updated_at=$${
        updateedData.fields.length + 1
      } WHERE role_id = $${updateedData.fields.length + 2}`,
      [...Object.values(updateedData.values), nowDate, role_id]
    )

    if (!updated || !updated.rowCount) {
      throw new Error("Failed to update role")
    }
    return c.json({
      success: 1,
      message: "Modification successful.",
      data: { role_id },
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

export const deleteRole = async (c: Context) => {
  let { role_id } = c.req.param()
  if (!isNumber(role_id))
    return errorStatusMessage(c, 422, "role_id is not a valid number")
  try {
    const role = await pool.query(
      ` SELECT * FROM ${roles} WHERE role_id = $1 AND super_admin <> $2`,
      [role_id, "1"]
    )

    if (!role || !role.rowCount) return errorStatusMessage(c, 404, "Role")
    const usersD = await pool.query(
      `SELECT * FROM ${users} WHERE role_id = $1`,
      [role_id]
    )

    if (usersD && usersD.rowCount)
      return errorStatusMessage(c, 409, "Users associated with roles")
    const result = await pool.query(
      `DELETE FROM ${roles} WHERE role_id = $1 and super_admin <> $2`,
      [role_id, "1"]
    )

    if (!result || !result.rowCount) return errorStatusMessage(c, 404, "Role")
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
