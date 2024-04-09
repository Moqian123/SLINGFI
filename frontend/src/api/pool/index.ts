import {http} from "../../lib/utils/request";
import { CreatePoolResponse } from "./types"

/**创建 POOL */
export function createPool(data) {
    return http.post<CreatePoolResponse>('/graphql',data)
}
/**获取币汇率的价格 */
// export function GetPrice(config) {
//     return http.get(`https://api.dexscreener.com/latest/dex/search?q=${config.type}%20USDC`)
// }