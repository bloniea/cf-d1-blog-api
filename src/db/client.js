import { createClient, } from "@libsql/client";
// 实现可查询接口的类
class QueryExecutor {
    client = null;
    constructor(client) {
        this.client = client ? client : null;
    }
    // 实现 execute 方法
    async execute(sql, type, args = []) {
        if (!this.client) {
            throw new Error("client not connected");
        }
        try {
            let result;
            if (args.length) {
                result = await this.client.execute({ sql: sql, args: args });
            }
            else {
                result = await this.client.execute(sql);
            }
            if (type === "first") {
                return result.rows[0]
                    ? { ...result, list: result.rows[0], insertRowid: null }
                    : { ...result, list: null, insertRowid: null };
            }
            if (type === "write") {
                if (result.lastInsertRowid) {
                    return {
                        ...result,
                        list: null,
                        insertRowid: Number(result.lastInsertRowid),
                    };
                }
                else {
                    return { ...result, list: null, insertRowid: null };
                }
            }
            return { ...result, list: null, insertRowid: null };
        }
        catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e));
            // console.error(e)
            // const errorMessage = e instanceof Error ? e.message : String(e)
            // return { err: errorMessage } as MyTypeWithErr<ResultSet>
        }
    }
    //   实现 batch 方法，批量操作
    async batch(sqls, mode) {
        if (!this.client) {
            // return [{ err: "client not connected" }] as Array<
            //   MyTypeWithErr<ResultSet>
            // >
            throw new Error("client not connected");
        }
        try {
            const result = await this.client.batch(sqls, mode);
            return result.map((resultSet) => ({
                ...resultSet,
                err: null,
                list: null,
                insertRowid: null,
            }));
        }
        catch (e) {
            throw new Error(e instanceof Error ? e.message : String(e));
            // console.error(e)
            // const errorMessage = e instanceof Error ? e.message : String(e)
            // return [{ err: errorMessage }] as Array<MyTypeWithErr<ResultSet>>
        }
    }
    //   实现 close 方法
    async close() {
        if (!this.client) {
            throw new Error("client not connected");
        }
        this.client.close();
    }
}
// 实现 Sqldb 类
class Sqldb extends QueryExecutor {
    client = null;
    //   private url: string
    //   private authToken: string
    constructor(url, authToken) {
        const client = createClient({ url, authToken });
        super(client);
        this.client = client;
        // this.url = url
        // this.authToken = authToken
    }
    async transactionFun(mode) {
        if (!this.client) {
            throw new Error("client not connected");
        }
        const sqlTransaction = new SqlTransaction(this.client);
        await sqlTransaction.init(this.client, mode);
        return sqlTransaction;
    }
    async disconnect() {
        if (!this.client) {
            throw new Error("client not connected");
        }
        await this.client.sync();
    }
}
// 实现 SqlTransaction 类
class SqlTransaction extends QueryExecutor {
    err = null;
    client = null;
    constructor(client) {
        super(client);
        this.client = client;
    }
    async init(client, mode) {
        if (!this.client)
            throw new Error("client not connected");
        this.client = await client.transaction(mode);
    }
    async commit() {
        if (!this.client)
            throw new Error("client not connected");
        await this.client.commit();
    }
    async rollback() {
        if (!this.client)
            throw new Error("client not connected");
        await this.client.rollback();
    }
}
export const sqlDb = async () => {
    return new Sqldb(process.env.DB_URL || "", process.env.AUTH_TOKEN || "");
};
