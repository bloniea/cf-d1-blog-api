import { errorStatusMessage, getUpdateedData, valuesEmpty, verifyUserEmailPassword, } from "../utils/utils";
import { USER } from "../config";
import { sha256 } from "hono/utils/crypto";
import { setToken, verify } from "../utils/jwt";
import { sqlDb } from "../db/client";
export const login = async (c) => {
    let Username, Password, Email;
    try {
        ;
        ({ Username, Password, Email } = await c.req.json());
    }
    catch (error) {
        console.error(error);
        return errorStatusMessage(c, 415);
    }
    const client = await sqlDb();
    try {
        if (!(Password && (Email || Username)))
            return errorStatusMessage(c, 400, "password, Username or Email parameter is missing.");
        const dataFilter = await getUpdateedData({ Username, Email });
        const auth = await client.execute(`SELECT ${USER}.UserId,${USER}.Username,${USER}.Email,${USER}.RoleId FROM ${USER} WHERE ${dataFilter.sqlAnd} AND Password=?`, "first", [...Object.values(dataFilter.values), await sha256(Password)]);
        if (auth && auth.list) {
            const tokenSecret = process.env.TOKEN_SECRET || "Bronya";
            const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "Seele";
            const token = await setToken(auth.list, tokenSecret);
            // 604800 7天的秒数
            const refreshToken = await setToken(auth.list, refreshTokenSecret, 604800);
            return c.json({
                success: 1,
                message: "登录成功",
                data: { user: auth.list, token, refreshToken },
            });
        }
        c.status(401);
        return c.json({ success: 0, message: "用户或密码错误" });
    }
    catch (e) {
        return errorStatusMessage(c, 500, e instanceof Error ? e.message : String(e));
    }
    finally {
        await client.close();
    }
};
export const refreshToken = async (c) => {
    let RefreshToken;
    try {
        ;
        ({ RefreshToken } = await c.req.json());
    }
    catch (error) {
        return errorStatusMessage(c, 415);
    }
    if (RefreshToken.startsWith("Bearer ")) {
        try {
            const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "Seele";
            const tokenSecret = process.env.TOKEN_SECRET || "Bronya";
            RefreshToken = RefreshToken.replace("Bearer ", "");
            const getRefreshToken = await verify(RefreshToken, refreshTokenSecret);
            const token = await setToken(getRefreshToken, tokenSecret);
            const refreshToken = await setToken(getRefreshToken, refreshTokenSecret, 604800);
            return c.json({
                success: 1,
                message: "refreshToken",
                token,
                refreshToken,
            });
        }
        catch (error) {
            return errorStatusMessage(c, 401, "签名不匹配");
        }
    }
    else {
        return errorStatusMessage(c, 422, "RefreshToken");
    }
};
export const retPasword = async (c) => {
    const { UserId } = c.req.param();
    if (!UserId)
        return errorStatusMessage(c, 422, "UserId is not a valid number");
    let Password, NewPassword, ConfirmPassword;
    try {
        ;
        ({ Password, NewPassword, ConfirmPassword } = await c.req.json());
    }
    catch (e) {
        return errorStatusMessage(c, 415);
    }
    const client = await sqlDb();
    try {
        const EmptyDayta = valuesEmpty({ Password, NewPassword, ConfirmPassword });
        console.log(EmptyDayta);
        if (EmptyDayta.length)
            return errorStatusMessage(c, 400, EmptyDayta.join(",") + " parameter is missing.");
        const verify = await verifyUserEmailPassword({ Password: NewPassword });
        if (verify !== null)
            return errorStatusMessage(c, 400, verify + " does not meet the requirements.");
        if (NewPassword !== ConfirmPassword)
            return errorStatusMessage(c, 400, "The new password and the password entered again do not match.");
        const user = await client.execute(`SELECT * FROM ${USER} WHERE UserId = ? AND Password = ?`, "first", [UserId, await sha256(Password)]);
        if (user && user.list) {
            const result = await client.execute(`UPDATE ${USER} SET Password = ? WHERE UserId = ?`, "write", [await sha256(NewPassword), UserId]);
            if (result && result.rowsAffected) {
                return c.json({ success: 1, message: "Modification successful." });
            }
            return errorStatusMessage(c, 500, "Modification failed.");
        }
        return errorStatusMessage(c, 401, "Invalid username or password.");
    }
    catch (e) {
        return errorStatusMessage(c, 500, e instanceof Error ? e.message : String(e));
    }
    finally {
        await client.close();
    }
};
