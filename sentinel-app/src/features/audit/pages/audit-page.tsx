import { useState } from "react"
import { useAuditLog } from "@/features/audit/api/audit.api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Eye } from "lucide-react"
import { useDebounce } from "@/shared/hooks/use-debounce"
import type { AuditEntry } from "@/shared/types/audit.types"

export function Component() {
  const [entityFilter, setEntityFilter] = useState("")
  const [page, setPage] = useState(1)
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const debouncedEntity = useDebounce(entityFilter, 300)

  const { data, isLoading } = useAuditLog({
    page,
    pageSize: 25,
    aggregate_id: debouncedEntity || undefined,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground">
          Immutable record of all system changes
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by aggregate ID..."
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Aggregate ID</TableHead>
              <TableHead>Aggregate Type</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.event_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.aggregate_id}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.aggregate_type}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.performed_by}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <Eye data-icon="inline-start" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {data && Math.ceil(data.total / data.pageSize) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(data.total / data.pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(data.total / data.pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Entry Details</DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="grid gap-4 md:grid-cols-1">
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Payload
                </h4>
                <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
                  {selectedEntry.payload
                    ? JSON.stringify(selectedEntry.payload, null, 2)
                    : "—"}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
