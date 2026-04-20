import { useRulesVersions } from "@/features/rules-admin/api/rules.api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRulesStore } from "@/stores/rules.store"

export function Component() {
  const { data: versions, isLoading } = useRulesVersions()
  const currentVersion = useRulesStore((s) => s.version)
  const cachedAt = useRulesStore((s) => s.cachedAt)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Rules Administration</h1>
        <p className="text-muted-foreground">
          Manage risk classification rules and versions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Cache</CardTitle>
          <CardDescription>
            Locally cached rules version used for client-side classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">Cached Version</dt>
            <dd>
              {currentVersion ? (
                <Badge variant="outline">{currentVersion}</Badge>
              ) : (
                "No cache"
              )}
            </dd>
            <dt className="text-muted-foreground">Cached At</dt>
            <dd>{cachedAt ? new Date(cachedAt).toLocaleString() : "Never"}</dd>
          </dl>
        </CardContent>
      </Card>

      <Separator />

      <h2 className="text-lg font-medium">Version History</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Valid From</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Created By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : versions?.map((v) => (
                <TableRow key={v.version}>
                  <TableCell>
                    <Badge
                      variant={
                        v.version === currentVersion ? "default" : "outline"
                      }
                    >
                      {v.version}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(v.valid_from).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(v.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{v.created_by}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
