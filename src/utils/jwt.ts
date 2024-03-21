import { Jwt } from "hono/utils/jwt"

export const setToken = async (
  payload: unknown,
  secret: string,
  exp: number = 21600
) => {
  exp = Math.floor(Date.now() / 1000) + exp // 6小时后的时间戳
  return await Jwt.sign({ exp: exp, payload }, secret, "HS256")
}
interface verifyData {
  exp?: number
  payload: any
}
export const verify = async (
  token: string,
  secret: string
): Promise<verifyData> => {
  return await Jwt.verify(token, secret, "HS256")
}
export const decode = Jwt.decode
