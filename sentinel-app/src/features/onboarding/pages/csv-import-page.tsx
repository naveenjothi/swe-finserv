import { useCallback, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Upload, FileUp, CheckCircle2, AlertTriangle, X } from "lucide-react"
import { useImportCsv } from "@/features/onboarding/api/onboarding.api"
import { RiskBadge } from "@/features/onboarding/components/risk-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import type { ImportCsvResponse } from "@/shared/types/onboarding.types"

export function Component() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [result, setResult] = useState<ImportCsvResponse | null>(null)

  const importCsv = useImportCsv()

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file")
      return
    }
    setSelectedFile(file)
    setResult(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleUpload = useCallback(() => {
    if (!selectedFile) return
    importCsv.mutate(selectedFile, {
      onSuccess: (data) => {
        setResult(data)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        toast.success(`Imported ${data.total_imported} records`)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Import failed")
      },
    })
  }, [selectedFile, importCsv])

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Import Client Records
        </h1>
        <p className="text-muted-foreground">
          Upload a CSV file to bulk-import client onboarding records.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>
            Required columns: client_name, client_type, pep_status,
            sanctions_screening_match, adverse_media_flag,
            country_of_tax_residence, annual_income, source_of_funds.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div
            role="button"
            tabIndex={0}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click()
            }}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <Upload className="size-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">
                Drag & drop a CSV file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports .csv files
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2">
                <FileUp className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  <X data-icon="inline-start" />
                  Remove
                </Button>
                <Button onClick={handleUpload} disabled={importCsv.isPending}>
                  {importCsv.isPending && <Spinner data-icon="inline-start" />}
                  Upload & Import
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {importCsv.isPending && (
        <Alert>
          <Spinner data-icon="inline-start" />
          <AlertDescription>
            Importing records — this may take a moment…
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-green-600" />
              <div>
                <CardTitle>Import Complete</CardTitle>
                <CardDescription>
                  {result.total_imported} records imported
                  {result.mismatches > 0 &&
                    ` · ${result.mismatches} risk tier mismatches`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Badge variant="secondary">Total: {result.total_imported}</Badge>
              {result.mismatches > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle data-icon="inline-start" />
                  Mismatches: {result.mismatches}
                </Badge>
              )}
            </div>

            <Separator />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Computed Tier</TableHead>
                  <TableHead>Declared Tier</TableHead>
                  <TableHead>Mismatch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.row}</TableCell>
                    <TableCell className="font-medium">
                      {row.client_name}
                    </TableCell>
                    <TableCell>
                      <RiskBadge tier={row.computed_tier} />
                    </TableCell>
                    <TableCell>
                      {row.declared_tier ? (
                        <RiskBadge tier={row.declared_tier} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.mismatch ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => navigate("/clients")}>
                View All Clients
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
