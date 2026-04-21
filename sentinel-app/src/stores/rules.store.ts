import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval"
import type {
  RulesPayload,
  ClassifiableRecord,
  ClassificationResult,
} from "@/shared/types/rules.types"
import { classify } from "@/shared/lib/rules-engine"
import { api } from "@/shared/api/client"

const STALE_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour

interface RulesState {
  version: string | null
  payload: RulesPayload | null
  cachedAt: number | null
  isStale: () => boolean
  pollRules: () => Promise<void>
  getClassifier: () => (record: ClassifiableRecord) => ClassificationResult
}

const idbStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const value = await idbGet(name)
    return value ?? null
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value)
  },
  removeItem: async (name: string) => {
    await idbDel(name)
  },
}))

export const useRulesStore = create<RulesState>()(
  persist(
    (set, get) => ({
      version: null,
      payload: null,
      cachedAt: null,

      isStale: () => {
        const { cachedAt } = get()
        if (!cachedAt) return true
        return !navigator.onLine && Date.now() - cachedAt > STALE_THRESHOLD_MS
      },

      pollRules: async () => {
        const { version } = get()
        const headers: Record<string, string> = {}
        if (version) {
          headers["If-None-Match"] = version
        }

        try {
          const response = await api.get("rules/version", {
            headers,
            throwHttpErrors: false,
          })

          if (response.status === 304) return
          if (!response.ok) return

          const versionInfo = await response.json<{
            version: string
            valid_from: string
          }>()

          if (versionInfo.version === version) return

          const rulesResponse = await api
            .get("rules/current")
            .json<RulesPayload>()

          set({
            version: rulesResponse.version,
            payload: rulesResponse,
            cachedAt: Date.now(),
          })
        } catch {
          // Offline or error — keep existing cache
        }
      },

      getClassifier: () => {
        const { payload } = get()
        return (record: ClassifiableRecord) => classify(record, payload)
      },
    }),
    {
      name: "sentinel_rules_cache",
      storage: idbStorage as any,
      partialize: (state) => ({
        version: state.version,
        payload: state.payload,
        cachedAt: state.cachedAt,
      }),
    }
  )
)
