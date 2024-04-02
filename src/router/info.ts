import { Context } from "hono"
import { articles, categories, pool, roles, users } from "../db/psql.js"
import { errorStatusMessage } from "../utils/utils.js"
export const getInfos = async (c: Context) => {
  try {
    const articlesNumber = await pool.query(`SELECT COUNT(*) FROM ${articles}`)
    const categoriesNumber = await pool.query(
      `SELECT COUNT(*) FROM ${categories}`
    )
    const rolesNumber = await pool.query(`SELECT COUNT(*) FROM ${roles}`)
    const usersNumber = await pool.query(`SELECT COUNT(*) FROM ${users}`)
    return c.json({
      success: 1,
      data: {
        articles: articlesNumber.rows[0].count,
        categories: categoriesNumber.rows[0].count,
        roles: rolesNumber.rows[0].count,
        users: usersNumber.rows[0].count,
      },
      message: "Retrieval successful.",
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
