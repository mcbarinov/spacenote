import * as queries from "./queries"
import * as mutations from "./mutations"
import * as cache from "./cache"

export const api = {
  queries,
  mutations,
  cache,
}

export { queryClient } from "./queryClient"
export { initHttpClient } from "./httpClient"
export { COMMENTS_PAGE_LIMIT } from "./queries"
