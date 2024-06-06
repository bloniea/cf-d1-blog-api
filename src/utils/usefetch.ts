import "dotenv/config"
import { httpReq } from "./fetch"
const github = "https://github.bloniea.com"
const api = "https://api.github.com"
const ghpToken = process.env.GHTOKEN
httpReq.fetchOpts = {
  headers: {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json;charset=utf-8",
    "X-GitHub-Api-Version": "2022-11-28",
    Authorization: ghpToken || "",
  },
}

// 获取文件
export const getIMagesApi = async (url: string = "") => {
  const res = await httpReq.get(api + url)
  return res
}
// 上传文件 修改文件
export const uploadImageApi = async (
  url: string = "",
  params: { message: string; content: string }
) => {
  const res = await httpReq.put(api + url, params)
  return res
}
// 删除文件
export const deleteImageApi = async (
  url: string = "",
  params: { message: string; sha: string }
) => {
  // const obt: any = params
  // let headers = {}
  // if (obt.headers) {
  //   headers = obt.headers
  //   delete obt.headers
  // }

  url = `${api}${url}?message=${params.message}&&sha=${params.sha}`
  const res = await httpReq.delete(url)
  return res
}

// export const getUserApi = async (obt: object) => {
//   const res = await fetchApi(api + "/user", obt)
//   return res
// }

// export const getUserRepoApi = async (url: string) => {
//   const res = await fetchApi(`${api}/repos/${url}`)
//   return res
// }
