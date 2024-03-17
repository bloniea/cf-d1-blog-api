import { Context } from "hono"
import {
  db,
  errorStatusMessage,
  getPagesAndNumbers,
  getUpdateedData,
  valuesEmpty,
} from "../utils/utils"

const CATEGORY = "Categories"
export const getCategories = async (c: Context) => {
  let { Pages, PageNumber } = c.req.query()
  const pagesAndPageNumber = getPagesAndNumbers(Pages, PageNumber)
  //   获取分类
  const categories = await db(
    c,
    "all",
    `SELECT * FROM ${CATEGORY}  ORDER BY CreatedAt DESC LIMIT ? OFFSET ?`,
    pagesAndPageNumber.pages,
    (pagesAndPageNumber.pageNumbers - 1) * pagesAndPageNumber.pages
  )
  if (categories.err) return errorStatusMessage(c, 500, categories.err)

  //   获取分类总数
  const total = await db(
    c,
    "first",
    `SELECT COUNT(*) AS total FROM ${CATEGORY}`
  )
  if (total?.err) return errorStatusMessage(c, 500, total.err)
  return c.json({
    success: 1,
    message: "Retrieval successful.",
    data: { result: categories.results, ...total },
  })
}

export const createCategory = async (c: Context) => {
  let Title: string, ImgUrl: string
  try {
    ;({ Title, ImgUrl } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  //   获取为空的属性的键名称
  const emptyParame = valuesEmpty({ Title, ImgUrl })
  if (emptyParame.length > 0)
    return errorStatusMessage(c, 400, emptyParame.join(","))
  const isExist = await db(
    c,
    "first",
    `SELECT * FROM ${CATEGORY} WHERE Title = ?`,
    Title
  )
  if (isExist?.err) return errorStatusMessage(c, 500, isExist.err)
  if (isExist) return errorStatusMessage(c, 409, "category")
  const timeNow = Date.now()
  // 插入分类
  const result = await db(
    c,
    "run",
    `INSERT INTO ${CATEGORY} (Title, ImgUrl, CreatedAt, UpdatedAt) VALUES (?,?,?,?)`,
    Title,
    ImgUrl,
    timeNow,
    timeNow
  )
  if (result.err) return errorStatusMessage(c, 500, result.err)
  if (result.meta.changes === 0)
    return errorStatusMessage(c, 500, "sql operation failed")
  return c.json({
    success: 1,
    message: "New record created successfully.",
    data: { CategoryId: result.meta.last_row_id },
  })
}

export const deleteCategory = async (c: Context) => {
  let { CategoryId } = c.req.param()
  const result = await db(
    c,
    "run",
    `DELETE FROM ${CATEGORY} WHERE CategoryId = ?`,
    CategoryId
  )
  if (result.err) return errorStatusMessage(c, 500, result.err)
  if (result.meta.changes === 0) return errorStatusMessage(c, 404, "category")
  return c.json({ success: 1, message: "Deletion successful." })
}
export const updateCategory = async (c: Context) => {
  let { CategoryId } = c.req.param()
  let Title: string, ImgUrl: string
  try {
    ;({ Title, ImgUrl } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  // 判断分类是否存在
  const category = await db(
    c,
    "first",
    `SELECT * FROM ${CATEGORY} WHERE CategoryId = ?`,
    CategoryId
  )
  if (category?.err) return errorStatusMessage(c, 500, category.err)
  if (!category) return errorStatusMessage(c, 404, "category")

  // 获取更新的字段和值
  const updateedData = await getUpdateedData({
    Title,
    CategoryId,
    ImgUrl,
  })
  const timeNow = Date.now()
  // 判断数据是否形同
  const checkObjectEquality = await db(
    c,
    "first",
    `SELECT * FROM ${CATEGORY} WHERE ${updateedData.sqlAnd} AND CategoryId = ?`,
    ...Object.values(updateedData.values),
    CategoryId
  )
  if (checkObjectEquality?.err)
    return errorStatusMessage(c, 500, checkObjectEquality.err)
  if (checkObjectEquality) {
    const updated = await db(
      c,
      "run",
      `UPDATE Categories SET UpdatedAt=? WHERE CategoryId = ?`,
      timeNow,
      CategoryId
    )
    if (updated.err) return errorStatusMessage(c, 500, updated.err)
    return c.json({ success: 1, message: "Modification successful." })
  }
  // 判断分类名字是否已存在
  const isExistCategory = await db(
    c,
    "first",
    `SELECT * FROM Categories WHERE Title = ? and CategoryId != ?`,
    Title,
    CategoryId
  )
  if (isExistCategory?.err)
    return errorStatusMessage(c, 500, isExistCategory.err)
  if (isExistCategory) return errorStatusMessage(c, 409, "Category name")
  // 更新分类
  const update = await db(
    c,
    "run",
    `UPDATE Categories SET ${updateedData.fields},UpdatedAt=?  WHERE CategoryId = ?`,
    ...Object.values(updateedData.values),
    timeNow,
    CategoryId
  )
  if (update.err) return errorStatusMessage(c, 500, update.err)
  c.status(200)
  return c.json({
    success: 1,
    message: "Modification successful.",
    data: { CategoryId: update.meta.last_row_id },
  })
}

export const getCategory = async (c: Context) => {
  let { CategoryId } = c.req.param()
  const category = await db(
    c,
    "first",
    `SELECT * FROM ${CATEGORY} WHERE CategoryId = ?`,
    CategoryId
  )
  if (category?.err) return errorStatusMessage(c, 500, category.err)
  if (!category) return errorStatusMessage(c, 404, "category")
  return c.json({ success: 1, message: "Retrieval successful.", data: {} })
}
