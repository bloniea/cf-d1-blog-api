import {
  createClient,
  Client,
  ResultSet,
  TransactionMode,
  Transaction,
  Row,
} from "@libsql/client"

// 错误接口
interface InterfaceError {
  err: string
}
// 批量操作，sql条件参数类型
type SqlQuery = {
  sql: string
  args: any[]
}

type Sqls = SqlQuery[]
// 定义可操作接口
type run = "first" | "all" | "write"
interface Common {
  execute(
    sql: string,
    type: run,
    args?: any[]
  ): Promise<MyTypeWithErr<ResultSet>>
  close(): Promise<void>
  batch(
    Sqls: Sqls,
    mode: TransactionMode
  ): Promise<Array<ResultSet> | InterfaceError>
}
type MyTypeWithErr<T> = {
  list: Row | null
  insertRowid: number | null
} & T
// 实现可查询接口的类
class QueryExecutor implements Common {
  protected client: Client | Transaction | null = null
  constructor(client?: Client | Transaction | null) {
    this.client = client ? client : null
  }

  // 实现 execute 方法
  public async execute(
    sql: string,
    type: run,
    args: any[] = []
  ): Promise<MyTypeWithErr<ResultSet>> {
    if (!this.client) {
      throw new Error("client not connected")
    }

    try {
      let result: ResultSet

      if (args.length) {
        result = await this.client.execute({ sql: sql, args: args })
      } else {
        result = await this.client.execute(sql)
      }
      if (type === "first") {
        return result.rows[0]
          ? { ...result, list: result.rows[0], insertRowid: null }
          : { ...result, list: null, insertRowid: null }
      }
      if (type === "write") {
        if (result.lastInsertRowid) {
          return {
            ...result,
            list: null,
            insertRowid: Number(result.lastInsertRowid),
          }
        } else {
          return { ...result, list: null, insertRowid: null }
        }
      }

      return { ...result, list: null, insertRowid: null }
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : String(e))
      // console.error(e)
      // const errorMessage = e instanceof Error ? e.message : String(e)
      // return { err: errorMessage } as MyTypeWithErr<ResultSet>
    }
  }
  //   实现 batch 方法，批量操作
  public async batch(
    sqls: Sqls,
    mode: TransactionMode
  ): Promise<Array<MyTypeWithErr<ResultSet>>> {
    if (!this.client) {
      // return [{ err: "client not connected" }] as Array<
      //   MyTypeWithErr<ResultSet>
      // >
      throw new Error("client not connected")
    }
    try {
      const result = await this.client.batch(sqls, mode)
      return result.map((resultSet) => ({
        ...resultSet,
        err: null,
        list: null,
        insertRowid: null,
      }))
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : String(e))
      // console.error(e)
      // const errorMessage = e instanceof Error ? e.message : String(e)
      // return [{ err: errorMessage }] as Array<MyTypeWithErr<ResultSet>>
    }
  }
  //   实现 close 方法
  public async close(): Promise<void> {
    if (!this.client) {
      throw new Error("client not connected")
    }
    this.client.close()
  }
}

// 定义 Sqldb 接口
interface SqldbInterface extends Common {
  transactionFun(mode: TransactionMode): Promise<SqlTransactionInterface>
  disconnect(): Promise<void>
}
// 实现 Sqldb 类
class Sqldb extends QueryExecutor implements SqldbInterface {
  public client: Client | null = null
  //   private url: string
  //   private authToken: string

  public constructor(url: string, authToken: string) {
    const client = createClient({ url, authToken })
    super(client)
    this.client = client
    // this.url = url
    // this.authToken = authToken
  }

  public async transactionFun(
    mode: TransactionMode
  ): Promise<SqlTransactionInterface> {
    if (!this.client) {
      throw new Error("client not connected")
    }
    const sqlTransaction = new SqlTransaction(this.client)
    await sqlTransaction.init(this.client, mode)
    return sqlTransaction
  }

  public async disconnect(): Promise<void> {
    if (!this.client) {
      throw new Error("client not connected")
    }
    await this.client.sync()
  }
}

// 定义 SqlTransaction 接口
interface SqlTransactionInterface extends Common {
  init(client: Client, mode: TransactionMode): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
}

// 实现 SqlTransaction 类
class SqlTransaction extends QueryExecutor implements SqlTransactionInterface {
  public err: string | null = null
  public client: Transaction | null = null

  constructor(client: Client | Transaction | null) {
    super(client)
    this.client = client as Transaction
  }

  public async init(client: Client, mode: TransactionMode): Promise<void> {
    if (!this.client) throw new Error("client not connected")
    this.client = await client.transaction(mode)
  }
  public async commit(): Promise<void> {
    if (!this.client) throw new Error("client not connected")
    await this.client.commit()
  }
  public async rollback(): Promise<void> {
    if (!this.client) throw new Error("client not connected")
    await this.client.rollback()
  }
}

export const sqlDb = async (): Promise<Sqldb> => {
  return new Sqldb(process.env.DB_URL || "", process.env.AUTH_TOKEN || "")
}
