import { Context } from "hono"
import { errorStatusMessage, permissionsFilter } from "../utils/utils.js"
import { pool } from "../db/psql.js"

export const getPermissions = async (c: Context) => {
  try {
    const result = await pool.query("SELECT * FROM permissions")
    const resultFiter = permissionsFilter(result.rows)
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: resultFiter,
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
