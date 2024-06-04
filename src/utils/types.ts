import { TypedResponse } from "hono"

export interface ImagesJson {
  success: number
  message: string
  status: number
  data?: any
}
export type CombinedResponse = Response & TypedResponse<ImagesJson>
