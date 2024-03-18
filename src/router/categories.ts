import { Context } from "hono"
import {
  errorStatusMessage,
  getPagesAndNumbers,
  getUpdateedData,
  isNumber,
  valuesEmpty,
} from "../utils/utils"
import { sqlDb } from "../db/client"

const CATEGORY = "Categories"
export const getCategories = async (c: Context) => {
  try {
    let { Pages, PageNumber } = c.req.query()
    const pagesAndPageNumber = getPagesAndNumbers(Pages, PageNumber)
    //   获取分类
    const client = await sqlDb()
    const categories = await client.execute(
      `SELECT * FROM ${CATEGORY}  ORDER BY CreatedAt DESC LIMIT ? OFFSET ?`,
      "all",
      [
        pagesAndPageNumber.pages,
        (pagesAndPageNumber.pageNumbers - 1) * pagesAndPageNumber.pages,
      ]
    )
    //   获取分类总数
    const total = await client.execute(
      `SELECT COUNT(*) AS total FROM ${CATEGORY}`,
      "first"
    )
    await client.close()
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: { result: categories.rows, ...total.list },
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export const createCategory = async (c: Context) => {
  let Title: string, ImgUrl: string
  try {
    ;({ Title, ImgUrl } = await c.req.json())
    console.log(Title, ImgUrl)
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  try {
    //   获取为空的属性的键名称
    const emptyParame = valuesEmpty({ Title, ImgUrl })
    if (emptyParame.length > 0)
      return errorStatusMessage(
        c,
        400,
        emptyParame.join(",") + " parameter is missing."
      )
    const client = await sqlDb()

    const transaction = await client.transactionFun("write")

    const isExist = await transaction.execute(
      `SELECT * FROM ${CATEGORY} WHERE Title = ?`,
      "first",
      [Title]
    )

    if (isExist && isExist.list) {
      await client.close()
      return errorStatusMessage(c, 409, "category")
    }
    const timeNow = Date.now()
    // 插入分类

    const result = await client.execute(
      `INSERT INTO ${CATEGORY} (Title, ImgUrl, CreatedAt, UpdatedAt) VALUES (?,?,?,?)`,
      "write",
      [Title, ImgUrl, timeNow, timeNow]
    )

    if (result.rowsAffected) {
      await transaction.commit()
      await client.close()
      return c.json({
        success: 1,
        message: "New record created successfully.",
        data: { CategoryId: result.insertRowid },
      })
    }
    await transaction.rollback()
    await transaction.close()
    await client.close()
    throw new Error("Insertion failed.")
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export const deleteCategory = async (c: Context) => {
  try {
    let { CategoryId } = c.req.param()
    if (!isNumber(CategoryId))
      return errorStatusMessage(c, 422, "CategoryId is not a valid number")
    const client = await sqlDb()
    const result = await client.execute(
      `DELETE FROM ${CATEGORY} WHERE CategoryId = ?`,
      "write",
      [CategoryId]
    )
    await client.close()
    // rowsAffected受影响的行数，否为0
    if (result && result.rowsAffected) {
      return c.json({ success: 1, message: "Deletion successful." })
    }
    return errorStatusMessage(c, 404, "category")
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
export const updateCategory = async (c: Context) => {
  let { CategoryId } = c.req.param()
  if (!isNumber(CategoryId))
    return errorStatusMessage(c, 422, "CategoryId is not a valid number")
  let Title: string, ImgUrl: string
  try {
    ;({ Title, ImgUrl } = await c.req.json())
  } catch (err) {
    return errorStatusMessage(c, 415)
  }
  try {
    // 判断分类是否存在
    const client = await sqlDb()
    const transaction = await client.transactionFun("write")
    const category = await transaction.execute(
      `SELECT * FROM ${CATEGORY} WHERE CategoryId = ?`,
      "first",
      [CategoryId]
    )

    if (!category || !category.list) {
      await client.close()
      return errorStatusMessage(c, 404, "category")
    }

    // 获取更新的字段和值
    const updateedData = await getUpdateedData({
      Title,
      CategoryId,
      ImgUrl,
    })
    const timeNow = Date.now()
    // 判断分类名字是否已存在
    const isExistCategory = await transaction.execute(
      `SELECT * FROM ${CATEGORY} WHERE Title = ? and CategoryId != ?`,
      "first",
      [Title, CategoryId]
    )

    if (isExistCategory && isExistCategory.list) {
      await client.close()
      return errorStatusMessage(c, 409, "Category name")
    }
    // 更新分类
    const update = await client.execute(
      `UPDATE ${CATEGORY} SET ${updateedData.fields},UpdatedAt=?  WHERE CategoryId = ?`,
      "write",
      [...Object.values(updateedData.values), timeNow, CategoryId]
    )
    if (update && update.rowsAffected) {
      await transaction.commit()
      await client.close()
      return c.json({
        success: 1,
        message: "Modification successful.",
        data: { CategoryId: CategoryId },
      })
    }
    await client.close()
    throw new Error("Update failed.")
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}

export const getCategory = async (c: Context) => {
  try {
    let { CategoryId } = c.req.param()
    if (!isNumber(CategoryId))
      return errorStatusMessage(c, 422, "CategoryId is not a valid number")

    const client = await sqlDb()
    const category = await client.execute(
      `SELECT * FROM ${CATEGORY} WHERE CategoryId = ?`,
      "first",
      [CategoryId]
    )
    await client.close()
    if (!category || !category.list)
      return errorStatusMessage(c, 404, "category")
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: category.list,
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
