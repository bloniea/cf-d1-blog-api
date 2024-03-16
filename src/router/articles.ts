import { Context } from "hono"
import {
  db,
  errorStatusMessage,
  getPagesAndNumbers,
  getUpdateedData,
  valuesEmpty,
} from "../utils/utils"
/**
 * 获取文章
 */
const ARTICLE = "Articles",
  CATEGORY = "Categories"
export const getArticles = async (c: Context) => {
  let { Pages, PageNumber } = await c.req.query()
  const pagesAndPageNumber = getPagesAndNumbers(Pages, PageNumber)
  // 获取articles的总数
  const articlesTotal = await db(
    c,
    "first",
    `SELECT COUNT(*) AS total FROM ${ARTICLE}`
  )
  if (articlesTotal?.err) return errorStatusMessage(c, 500, articlesTotal.err)
  // 获取文章
  const data = await db(
    c,
    "all",
    `SELECT ${ARTICLE}.*, ${CATEGORY}.Title as CategoryTitle,${CATEGORY}.ImgUrl as CategoryImgUrl  FROM ${ARTICLE} JOIN ${CATEGORY} ON ${ARTICLE}.Categoryid = ${CATEGORY}.CategoryId ORDER BY CreatedAt DESC LIMIT ? OFFSET ?;`,
    pagesAndPageNumber.pages,
    (pagesAndPageNumber.pageNumbers - 1) * pagesAndPageNumber.pages
  )

  if (data.err) return errorStatusMessage(c, 500, data.err)
  return c.json({
    success: 1,
    message: "Retrieval successful.",
    data: { results: data.results, articlesTotal },
  })
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
  const emptyParame = valuesEmpty({
    Title,
    CategoryId,
    Content,
    ImgUrl,
    ImgSource,
  })
  if (emptyParame.length) {
    return errorStatusMessage(c, 400, emptyParame.join(","))
  }
  // 判断分类是否存在
  const category = await db(
    c,
    "first",
    `SELECT * FROM ${CATEGORY} WHERE CategoryId = ?`,
    CategoryId
  )
  if (category?.err) return errorStatusMessage(c, 500, category.err)
  if (!category) return errorStatusMessage(c, 404, "Category")
  const insert = await db(
    c,
    "run",
    `INSERT INTO ${ARTICLE} (Title, CategoryId,ImgUrl,ImgSource,CreatedAt,UpdatedAt,Content) VALUES (?,?,?,?,?,?,?)`,
    Title,
    CategoryId,
    ImgUrl,
    ImgSource,
    timeNow,
    timeNow,
    Content
  )

  if (insert.err) return errorStatusMessage(c, 500, insert.err)
  c.status(201)
  return c.json({
    success: 1,
    message: "New record created successfully.",
    data: { articleId: insert.meta.last_row_id },
  })
}
/**
 * 删除文章
 */

export const deleteArticle = async (c: Context) => {
  const { articleId } = c.req.param()
  const deleteArticle = await db(
    c,
    "run",
    `DELETE FROM ${ARTICLE} WHERE ArticleId = ?`,
    articleId
  )
  if (deleteArticle.err) return errorStatusMessage(c, 500, deleteArticle.err)
  if (deleteArticle.meta.changes === 0)
    return errorStatusMessage(c, 404, "Article")
  c.status(200)
  return c.json({ success: 1, message: "Deletion successful." })
}
/**
 * 修改文章
 */
export const updateArticle = async (c: Context) => {
  const { articleId } = c.req.param()
  // 判断文章是否存在
  const articleedData = await db(
    c,
    "first",
    `SELECT * FROM ${ARTICLE} WHERE ArticleId = ?`,
    articleId
  )
  if (articleedData?.err) return errorStatusMessage(c, 500, articleedData.err)
  if (!articleedData) return errorStatusMessage(c, 404, "Article")

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
    const category = await db(
      c,
      "first",
      `SELECT * FROM ${CATEGORY} WHERE CategoryId = ?`,
      CategoryId
    )
    if (category?.err) return errorStatusMessage(c, 500, category.err)
    if (!category) return errorStatusMessage(c, 404, "Category")
  }
  const timeNow = Date.now()
  const update = await db(
    c,
    "run",
    `UPDATE ${ARTICLE} SET ${updateedData.fields},UpdatedAt=? WHERE ArticleId=?`,
    ...Object.values(updateedData.values),
    timeNow,
    articleId
  )
  if (update.err) return errorStatusMessage(c, 500, update.err)
  return c.json({
    success: 1,
    message: "Modification successful.",
    data: { articleId: update.meta.last_row_id },
  })
}
/**
 * 获取单篇文章
 */
export const getArticle = async (c: Context) => {
  const { articleId } = c.req.param()
  // 获取文章详情
  const article = await db(
    c,
    "first",
    `SELECT ${ARTICLE}.*, ${CATEGORY}.Title as CategoryTitle,${CATEGORY}.ImgUrl as CategoryImgUrl  FROM ${ARTICLE} JOIN ${CATEGORY} ON ${ARTICLE}.Categoryid = ${CATEGORY}.CategoryId WHERE ${ARTICLE}.ArticleId = ?;`,
    articleId
  )
  if (article?.err) return errorStatusMessage(c, 500, article.err)

  if (!article) return errorStatusMessage(c, 404, "Article")
  c.status(200)
  return c.json({ success: 1, message: "Retrieval successful.", data: article })
}
