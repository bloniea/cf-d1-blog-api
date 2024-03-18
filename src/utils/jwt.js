import { Jwt } from "hono/utils/jwt";
export const setToken = async (payload, secret, exp = 21600) => {
    exp = Math.floor(Date.now() / 1000) + exp; // 6小时后的时间戳
    return await Jwt.sign({ exp: exp, payload }, secret, "HS256");
};
export const verify = async (token, secret) => {
    return await Jwt.verify(token, secret, "HS256");
};
export const decode = Jwt.decode;
