import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval"
import type {
  CreateOnboardingDto,
  RiskTier,
} from "@/shared/types/onboarding.types"
import { api } from "@/shared/api/client"

export interface OfflineRecord {
  uuid: string
  fields: CreateOnboardingDto
  client_rules_version: string | null
  client_computed_tier: RiskTier
  created_at: number
}

interface SyncResult {
  uuid: string
  status: "created" | "error"
  server_computed_tier?: RiskTier
  rules_mismatch?: boolean
  error?: string
}

export interface SyncBatchResult {
  results: SyncResult[]
}

interface OfflineState {
  pendingRecords: OfflineRecord[]
  isOnline: boolean
  setOnline: (online: boolean) => void
  enqueue: (record: OfflineRecord) => void
  flush: () => Promise<SyncBatchResult>
  clearSynced: (uuids: string[]) => void
  pendingCount: () => number
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

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      pendingRecords: [],
      isOnline: navigator.onLine,

      setOnline: (online: boolean) => set({ isOnline: online }),

      enqueue: (record: OfflineRecord) => {
        set((state) => ({
          pendingRecords: [...state.pendingRecords, record],
        }))
      },

      flush: async () => {
        const { pendingRecords } = get()
        if (pendingRecords.length === 0) return { results: [] }

        const result = await api
          .post("sync/batch", { json: { records: pendingRecords } })
          .json<SyncBatchResult>()

        const syncedUuids = result.results
          .filter((r) => r.status === "created")
          .map((r) => r.uuid)

        get().clearSynced(syncedUuids)

        return result
      },

      clearSynced: (uuids: string[]) => {
        set((state) => ({
          pendingRecords: state.pendingRecords.filter(
            (r) => !uuids.includes(r.uuid)
          ),
        }))
      },

      pendingCount: () => get().pendingRecords.length,
    }),
    {
      name: "sentinel_pending_sync",
      storage: idbStorage,
      partialize: (state) => ({
        pendingRecords: state.pendingRecords,
      }),
    }
  )
)
