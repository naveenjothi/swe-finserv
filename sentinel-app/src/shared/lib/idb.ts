import { get, set, del } from "idb-keyval"

export { get as idbGet, set as idbSet, del as idbDel }

export async function clearAllStores() {
  await del("sentinel_rules_cache")
  await del("sentinel_pending_sync")
  await del("sentinel_client_cache")
}
