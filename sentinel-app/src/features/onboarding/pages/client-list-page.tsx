import { useState } from "react"
import { Link } from "react-router"
import { useClients } from "@/features/onboarding/api/onboarding.api"
import { RiskBadge } from "@/features/onboarding/components/risk-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"

export function Component() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useClients({
    page,
    pageSize: 20,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-muted-foreground">
          View and manage onboarded clients
        </p>
      </div>

      <Separator />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Risk Tier</TableHead>
            <TableHead>EDD</TableHead>
            <TableHead>Mismatch</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : data?.items.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.client_name}
                  </TableCell>
                  <TableCell>{client.client_type}</TableCell>
                  <TableCell>
                    <RiskBadge tier={client.computed_tier} />
                  </TableCell>
                  <TableCell>
                    {client.computed_tier === "HIGH" &&
                    client.kyc_status !== "APPROVED" ? (
                      <Badge variant="destructive">EDD Pending</Badge>
                    ) : client.requires_edd ? (
                      <Badge variant="secondary">EDD</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.mismatch ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {client.submitted_by}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(client.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/clients/${client.id}`}>
                        <Eye data-icon="inline-start" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

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
    </div>
  )
}
