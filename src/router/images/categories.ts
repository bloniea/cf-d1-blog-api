import { Context } from "hono"
import { errorStatusMessage, toNumber } from "../../utils/utils.js"
import { images, images_category, pool } from "../../db/psql.js"
import { QueryResult } from "pg"
import { CombinedResponse } from "../../utils/types.js"

export const getImagesCategories = async (
  c: Context
): Promise<CombinedResponse> => {
  const res = await pool.query(`SELECT * FROM ${images_category}`)
  c.status(200)
  return c.json({
    success: 1,
    message: "获取成功",
    status: 200,
    data: {
      result: res.rows,
    },
  })
}
