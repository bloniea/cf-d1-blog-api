import { Context } from "hono"
import {
  errorStatusMessage,
  getPagesAndNumbers,
  getUpdateedData,
  isNumber,
  valuesEmpty,
} from "../utils/utils.js"
import { articles, categories, pool } from "../db/psql.js"

/**
 * 获取文章
 */

export const getArticles = async (c: Context) => {
  try {
    let { pages, pageNumber, keyword } = c.req.query()
    const pagesAndPageNumber = getPagesAndNumbers(pages, pageNumber)
    // 获取articles的总数
    keyword = keyword ? `%${keyword}%` : "%"
    const articlesTotal = await pool.query(
      `SELECT COUNT(*) AS total FROM ${articles}`
    )
    // 获取文章}
    const data = await pool.query(
      `SELECT ${articles}.*, ${categories}.name as categoryTitle,${categories}.img_url as categoryImgUrl  FROM ${articles} JOIN ${categories} ON ${articles}.category_id = ${categories}.category_id 
      WHERE title LIKE $3
      ORDER BY created_at DESC LIMIT $1 OFFSET $2;`,
      [
        String(pagesAndPageNumber.pages),
        String((pagesAndPageNumber.pageNumbers - 1) * pagesAndPageNumber.pages),
        String(keyword),
      ]
    )

    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: { result: data.rows, ...articlesTotal.rows[0] },
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
/**
 * 添加文章
 */
export const addArticle = async (c: Context) => {
  const timeNow = String(Date.now())
  let title: string,
    category_id: string,
    content: string,
    img_url: string,
    img_source: string
  try {
    ;({ title, category_id, content, img_url, img_source } = await c.req.json())
  } catch (err) {
    console.log((err as Error).message)
    return errorStatusMessage(c, 415)
  }
  try {
    const emptyParame = valuesEmpty({
      title,
      category_id,
      content,
      img_url,
      img_source,
    })
    if (emptyParame.length) {
      return errorStatusMessage(
        c,
        400,
        emptyParame.join(",") + " parameter is missing."
      )
    }
    // 判断分类是否存在
    const category = await pool.query(
      `SELECT * FROM ${categories} WHERE category_id = $1`,
      [category_id]
    )

    if (!category || !category.rowCount) {
      return errorStatusMessage(c, 404, "Category")
    }
    const insert = await pool.query(
      `INSERT INTO ${articles} (title, category_id,img_url,img_source,created_at,updated_at,content) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING article_id`,
      [title, category_id, img_url, img_source, timeNow, timeNow, content]
    )

    c.status(201)
    return c.json({
      success: 1,
      message: "New record created successfully.",
      data: { article_id: insert.rows[0].article_id },
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
/**
 * 删除文章
 */

export const deleteArticle = async (c: Context) => {
  try {
    const { article_id } = c.req.param()
    if (!isNumber(article_id))
      return errorStatusMessage(c, 422, "article_id is not a valid number")
    const deleteArticle = await pool.query(
      `DELETE FROM ${articles} WHERE article_id = $1`,
      [article_id]
    )
    // client.execute(
    //   `DELETE FROM ${articles} WHERE article_id = ?`,
    //   "write",
    //   [article_id]
    // )
    if (deleteArticle.rowCount === 0)
      return errorStatusMessage(c, 404, "Article")
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
/**
 * 修改文章
 */
export const updateArticle = async (c: Context) => {
  const { article_id } = c.req.param()
  if (!isNumber(article_id))
    return errorStatusMessage(c, 422, "article_id is not a valid number")
  let title: string,
    category_id: string,
    content: string,
    img_url: string,
    img_source: string
  try {
    // 获取请求的数据
    ;({ title, category_id, content, img_url, img_source } = await c.req.json())
  } catch (err) {
    console.log((err as Error).message)
    return errorStatusMessage(c, 415)
  }
  try {
    // 判断文章是否存在
    const articleedData = await pool.query(
      `SELECT * FROM ${articles} WHERE article_id = $1`,
      [article_id]
    )

    if (!articleedData || !articleedData.rowCount) {
      return errorStatusMessage(c, 404, "Article")
    }

    // 获取更新的字段和值
    const updateedData = await getUpdateedData({
      title,
      category_id,
      content,
      img_url,
      img_source,
    })
    // 判断category是否存在
    if (category_id) {
      const category = await pool.query(
        `SELECT * FROM ${categories} WHERE category_id = $1`,
        [category_id]
      )

      if (!category || !category.rowCount) {
        return errorStatusMessage(c, 404, "Category")
      }
    }
    const timeNow = String(Date.now())
    const update = await pool.query(
      `UPDATE ${articles} SET ${updateedData.fields},updated_at=$${
        updateedData.fields.length + 1
      } WHERE article_id=$${updateedData.fields.length + 2}`,
      [...Object.values(updateedData.values), timeNow, article_id]
    )
    if (!update || !update.rowCount) {
      throw new Error("Update failed")
    }

    return c.json({
      success: 1,
      message: "Modification successful.",
      data: { article_id: article_id },
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
  const { article_id } = c.req.param()
  if (!isNumber(article_id))
    return errorStatusMessage(c, 422, "article_id is not a valid number")
  try {
    // 获取文章详情
    const article = await pool.query(
      `SELECT * FROM ${articles} WHERE article_id = $1`,
      [article_id]
    )
    // client.execute(`SELECT * FROM ${articles} WHERE article_id = ?`, "first", [
    //   article_id,
    // ])

    if (!article || !article.rowCount)
      return errorStatusMessage(c, 404, "Article")
    return c.json({
      success: 1,
      message: "Retrieval successful.",
      data: article.rows[0],
    })
  } catch (e) {
    return errorStatusMessage(
      c,
      500,
      e instanceof Error ? e.message : String(e)
    )
  }
}
