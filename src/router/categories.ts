import { Context } from "hono"
import {
  errorStatusMessage,
  getPagesAndNumbers,
  getUpdateedData,
  isNumber,
  valuesEmpty,
} from "../utils/utils.js"
import { pool } from "../db/psql.js"

const CATEGORY = "Categories"
export const getCategories = async (c: Context) => {
  try {
    let { pages, pageNumber, keyword } = c.req.query()
    if (!pageNumber || !pages) {
      const categoriesRes = await pool.query(
        `SELECT * FROM ${CATEGORY} ORDER BY created_at DESC`
      )
      const total = await pool.query(
        `SELECT COUNT(*) AS total FROM ${CATEGORY}`
      )
      return c.json({
        success: 1,
        message: "Retrieval successful.",
        data: { result: categoriesRes.rows, ...total.rows[0] },
      })
    }
    const pagesAndPageNumber = getPagesAndNumbers(pages, pageNumber)
    //   获取分类
    keyword = keyword ? `%${keyword}%` : "%"
    const categories = await pool.query(
      `SELECT * FROM ${CATEGORY} WHERE name LIKE $3 ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [
        String(pagesAndPageNumber.pages),
        String((pagesAndPageNumber.pageNumbers - 1) * pagesAndPageNumber.pages),
        keyword,
      ]
    )
    //   获取分类总数
    const total = await pool.query(`SELECT COUNT(*) AS total FROM ${CATEGORY}`)

    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: { result: categories.rows, ...total.rows[0] },
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

export const createCategory = async (c: Context) => {
  let name: string, img_url: string
  try {
    ;({ name, img_url } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  try {
    //   获取为空的属性的键名称
    const emptyParame = valuesEmpty({ name, img_url })
    if (emptyParame.length > 0)
      return errorStatusMessage(
        c,
        400,
        emptyParame.join(",") + " parameter is missing."
      )

    const isExist = await pool.query(
      `SELECT * FROM ${CATEGORY} WHERE name = $1`,
      [name]
    )

    if (isExist && isExist.rowCount) {
      return errorStatusMessage(c, 409, "category")
    }
    const timeNow = String(Date.now())
    // 插入分类

    const result = await pool.query(
      `INSERT INTO ${CATEGORY} (name, img_url, created_at, updated_at) VALUES ($1,$2,$3,$4) RETURNING category_id`,
      [name, img_url, timeNow, timeNow]
    )

    if (result && result.rowCount) {
      return c.json({
        success: 1,
        message: "New record created successfully.",
        data: { category_id: result.rows[0].category_id },
      })
    }
    throw new Error("Insertion failed.")
  } catch (e) {
    console.error(e)
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export const deleteCategory = async (c: Context) => {
  try {
    let { category_id } = c.req.param()
    if (!isNumber(category_id))
      return errorStatusMessage(c, 422, "category_id is not a valid number")
    const result = await pool.query(
      `DELETE FROM ${CATEGORY} WHERE category_id = $1`,
      [category_id]
    )

    // rowsAffected受影响的行数，否为0
    if (result && result.rowCount) {
      return c.json({ success: 1, message: "Deletion successful." })
    }
    return errorStatusMessage(c, 404, "category")
  } catch (e) {
    console.error(e)
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
export const updateCategory = async (c: Context) => {
  let { category_id } = c.req.param()
  if (!isNumber(category_id))
    return errorStatusMessage(c, 422, "category_id is not a valid number")
  let name: string, img_url: string
  try {
    ;({ name, img_url } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  try {
    // 判断分类是否存在
    const category = await pool.query(
      `SELECT * FROM ${CATEGORY} WHERE category_id = $1`,
      [category_id]
    )

    if (!category || !category.rowCount) {
      return errorStatusMessage(c, 404, "category")
    }

    // 获取更新的字段和值
    const updateedData = await getUpdateedData({
      name,
      category_id,
      img_url,
    })
    const timeNow = Date.now()
    // 判断分类名字是否已存在
    const isExistCategory = await pool.query(
      `SELECT * FROM ${CATEGORY} WHERE name = $1 and category_id != $2`,
      [name, category_id]
    )

    if (isExistCategory && isExistCategory.rowCount) {
      return errorStatusMessage(c, 409, "Category name")
    }
    // 更新分类
    const update = await pool.query(
      `UPDATE ${CATEGORY} SET ${updateedData.fields},updated_at=$${
        updateedData.fields.length + 1
      }  WHERE category_id = $${updateedData.fields.length + 2}`,
      [...Object.values(updateedData.values), timeNow, category_id]
    )

    if (update && update.rowCount) {
      return c.json({
        success: 1,
        message: "Modification successful.",
        data: { category_id: category_id },
      })
    }
    throw new Error("Update failed.")
  } catch (e) {
    console.error(e)
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export const getCategory = async (c: Context) => {
  try {
    let { category_id } = c.req.param()
    if (!isNumber(category_id))
      return errorStatusMessage(c, 422, "category_id is not a valid number")

    const category = await pool.query(
      `SELECT * FROM ${CATEGORY} WHERE category_id = $1`,
      [category_id]
    )

    if (!category || !category.rowCount)
      return errorStatusMessage(c, 404, "category")
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: category.rows[0],
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
