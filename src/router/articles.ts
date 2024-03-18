import { Context } from "hono"
import {
  errorStatusMessage,
  getPagesAndNumbers,
  getUpdateedData,
  isNumber,
  valuesEmpty,
} from "../utils/utils.js"
import { sqlDb } from "../db/client.js"
/**
 * 获取文章
 */
const ARTICLE = "Articles",
  CATEGORY = "Categories"
export const getArticles = async (c: Context) => {
  try {
    let { Pages, PageNumber } = c.req.query()
    const pagesAndPageNumber = getPagesAndNumbers(Pages, PageNumber)
    // 获取articles的总数
    const client = await sqlDb()
    const articlesTotal = await client.execute(
      `SELECT COUNT(*) AS total FROM ${ARTICLE}`,
      "first"
    )
    // 获取文章}
    const data = await client.execute(
      `SELECT ${ARTICLE}.*, ${CATEGORY}.Title as CategoryTitle,${CATEGORY}.ImgUrl as CategoryImgUrl  FROM ${ARTICLE} JOIN ${CATEGORY} ON ${ARTICLE}.Categoryid = ${CATEGORY}.CategoryId ORDER BY CreatedAt DESC LIMIT ? OFFSET ?;`,
      "all",
      [
        pagesAndPageNumber.pages,
        (pagesAndPageNumber.pageNumbers - 1) * pagesAndPageNumber.pages,
      ]
    )

    await client.close()
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: { results: data.rows, ...articlesTotal.list },
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
/**
 * 添加文章
 */
export const addArticle = async (c: Context) => {
  const timeNow = Date.now()
  let Title: string,
    CategoryId: number,
    Content: string,
    ImgUrl: string,
    ImgSource: string
  try {
    ;({ Title, CategoryId, Content, ImgUrl, ImgSource } = await c.req.json())
  } catch (err) {
    console.log((err as Error).message)
    return errorStatusMessage(c, 415)
  }
  try {
    const emptyParame = valuesEmpty({
      Title,
      CategoryId,
      Content,
      ImgUrl,
      ImgSource,
    })
    if (emptyParame.length) {
      return errorStatusMessage(
        c,
        400,
        emptyParame.join(",") + " parameter is missing."
      )
    }
    // 判断分类是否存在
    const client = await sqlDb()
    const category = await client.execute(
      `SELECT * FROM ${CATEGORY} WHERE CategoryId = ?`,
      "first",
      [CategoryId]
    )

    if (!category || !category.list) {
      await client.close()
      return errorStatusMessage(c, 404, "Category")
    }
    const insert = await client.execute(
      `INSERT INTO ${ARTICLE} (Title, CategoryId,ImgUrl,ImgSource,CreatedAt,UpdatedAt,Content) VALUES (?,?,?,?,?,?,?)`,
      "write",
      [Title, CategoryId, ImgUrl, ImgSource, timeNow, timeNow, Content]
    )
    await client.close()
    c.status(201)
    return c.json({
      success: 1,
      message: "New record created successfully.",
      data: { articleId: insert.insertRowid },
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
/**
 * 删除文章
 */

export const deleteArticle = async (c: Context) => {
  try {
    const { ArticleId } = c.req.param()
    if (!isNumber(ArticleId))
      return errorStatusMessage(c, 422, "ArticleId is not a valid number")
    const client = await sqlDb()
    const deleteArticle = await client.execute(
      `DELETE FROM ${ARTICLE} WHERE ArticleId = ?`,
      "write",
      [ArticleId]
    )
    await client.close()
    if (deleteArticle.rowsAffected === 0)
      return errorStatusMessage(c, 404, "Article")
    return c.json({ success: 1, message: "Deletion successful." })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
/**
 * 修改文章
 */
export const updateArticle = async (c: Context) => {
  const { articleId } = c.req.param()
  if (!isNumber(articleId))
    return errorStatusMessage(c, 422, "ArticleId is not a valid number")
  let Title: string,
    CategoryId: number,
    Content: string,
    ImgUrl: string,
    ImgSource: string
  try {
    // 获取请求的数据
    ;({ Title, CategoryId, Content, ImgUrl, ImgSource } = await c.req.json())
  } catch (err) {
    console.log((err as Error).message)
    return errorStatusMessage(c, 415)
  }
  try {
    const client = await sqlDb()
    // 判断文章是否存在
    const articleedData = await client.execute(
      `SELECT * FROM ${ARTICLE} WHERE ArticleId = ?`,
      "first",
      [articleId]
    )

    if (!articleedData || !articleedData.list) {
      await client.close()
      return errorStatusMessage(c, 404, "Article")
    }

    // 获取更新的字段和值
    const updateedData = await getUpdateedData({
      Title,
      CategoryId,
      Content,
      ImgUrl,
      ImgSource,
    })
    // 判断category是否存在
    if (CategoryId) {
      const category = await client.execute(
        `SELECT * FROM ${CATEGORY} WHERE CategoryId = ?`,
        "first",
        [CategoryId]
      )

      if (!category || !category.list) {
        await client.close()
        return errorStatusMessage(c, 404, "Category")
      }
    }
    const timeNow = Date.now()
    const update = await client.execute(
      `UPDATE ${ARTICLE} SET ${updateedData.fields},UpdatedAt=? WHERE ArticleId=?`,
      "write",
      [...Object.values(updateedData.values), timeNow, articleId]
    )
    await client.close()
    if (!update || !update.rowsAffected) {
      throw new Error("Update failed")
    }

    return c.json({
      success: 1,
      message: "Modification successful.",
      data: { articleId: articleId },
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
/**
 * 获取单篇文章
 */
export const getArticle = async (c: Context) => {
  const { articleId } = c.req.param()
  if (!isNumber(articleId))
    return errorStatusMessage(c, 422, "ArticleId is not a valid number")
  try {
    const client = await sqlDb()
    // 获取文章详情
    const article = await client.execute(
      `SELECT * FROM ${ARTICLE} WHERE ArticleId = ?`,
      "first",
      [articleId]
    )
    await client.close()

    if (!article || !article.list) return errorStatusMessage(c, 404, "Article")
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: article,
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
