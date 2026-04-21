import { useParams, useNavigate } from "react-router"
import {
  useClient,
  useSubmitCorrection,
} from "@/features/onboarding/api/onboarding.api"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  onboardingSchema,
  type OnboardingFormData,
} from "@/features/onboarding/schemas/onboarding.schema"
import { useClassification } from "@/features/onboarding/hooks/use-classification"
import { RiskBadge } from "@/features/onboarding/components/risk-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

const SOURCE_OF_FUNDS = [
  "Employment",
  "Business Income",
  "Investment Returns",
  "Inheritance",
  "Property Sale",
  "Pension",
  "Gift",
  "Other",
] as const

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: client, isLoading } = useClient(id!)
  const submitCorrection = useSubmitCorrection()
  const [reason, setReason] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    values: client
      ? {
          client_name: client.client_name,
          client_type: client.client_type as "INDIVIDUAL" | "ENTITY",
          country_of_tax_residence: client.country_of_tax_residence,
          annual_income: client.annual_income,
          source_of_funds: client.source_of_funds,
          pep_status: client.pep_status,
          sanctions_screening_match: client.sanctions_screening_match,
          adverse_media_flag: client.adverse_media_flag,
          declared_tier:
            (client.declared_tier as "HIGH" | "MEDIUM" | "LOW" | undefined) ??
            undefined,
        }
      : undefined,
  })

  const formValues = watch()
  const classification = useClassification(formValues)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      await submitCorrection.mutateAsync({
        clientId: id!,
        data,
        reason,
      })
      toast.success("Correction submitted successfully")
      navigate(`/clients/${id}`)
    } catch {
      toast.error("Failed to submit correction")
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Submit Correction</h1>
          <p className="text-muted-foreground">
            Correct and re-classify client {client?.client_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">New Risk Tier:</span>
          <RiskBadge tier={classification.tier} />
        </div>
      </div>

      <Separator className="my-6" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Correction Reason</CardTitle>
            <CardDescription>
              Explain why this record needs to be corrected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="reason">Reason</FieldLabel>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the reason for correction..."
                  required
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field data-invalid={!!errors.client_name}>
                  <FieldLabel htmlFor="client_name">Client Name</FieldLabel>
                  <Input
                    id="client_name"
                    aria-invalid={!!errors.client_name}
                    {...register("client_name")}
                  />
                  {errors.client_name && (
                    <FieldDescription>
                      {errors.client_name.message}
                    </FieldDescription>
                  )}
                </Field>

                <Field data-invalid={!!errors.country_of_tax_residence}>
                  <FieldLabel htmlFor="country">Country</FieldLabel>
                  <Input
                    id="country"
                    aria-invalid={!!errors.country_of_tax_residence}
                    {...register("country_of_tax_residence")}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field data-invalid={!!errors.annual_income}>
                  <FieldLabel htmlFor="annual_income">
                    Annual Income (£)
                  </FieldLabel>
                  <Input
                    id="annual_income"
                    type="number"
                    {...register("annual_income", { valueAsNumber: true })}
                  />
                </Field>

                <Field>
                  <FieldLabel>Source of Funds</FieldLabel>
                  <Controller
                    name="source_of_funds"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {SOURCE_OF_FUNDS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Client Type</FieldLabel>
                <Controller
                  name="client_type"
                  control={control}
                  render={({ field }) => (
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={(v) => {
                        if (v) field.onChange(v)
                      }}
                    >
                      <ToggleGroupItem value="INDIVIDUAL">
                        Individual
                      </ToggleGroupItem>
                      <ToggleGroupItem value="ENTITY">Entity</ToggleGroupItem>
                    </ToggleGroup>
                  )}
                />
              </Field>

              <div className="flex flex-col gap-3">
                <Field>
                  <div className="flex items-center gap-3">
                    <Controller
                      name="pep_status"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="pep_correction"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <FieldLabel htmlFor="pep_correction">PEP Status</FieldLabel>
                  </div>
                </Field>

                <Field>
                  <div className="flex items-center gap-3">
                    <Controller
                      name="sanctions_screening_match"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="sanctions_correction"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <FieldLabel htmlFor="sanctions_correction">
                      Sanctions Match
                    </FieldLabel>
                  </div>
                </Field>

                <Field>
                  <div className="flex items-center gap-3">
                    <Controller
                      name="adverse_media_flag"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="adverse_correction"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <FieldLabel htmlFor="adverse_correction">
                      Adverse Media
                    </FieldLabel>
                  </div>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/clients/${id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !reason}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Submit Correction
          </Button>
        </div>
      </form>
    </div>
  )
}
