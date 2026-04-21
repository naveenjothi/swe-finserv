import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import {
  onboardingSchema,
  type OnboardingFormData,
} from "@/features/onboarding/schemas/onboarding.schema"
import { useClassification } from "@/features/onboarding/hooks/use-classification"
import { useSubmitOnboarding } from "@/features/onboarding/api/onboarding.api"
import { useOfflineStore } from "@/stores/offline.store"
import { useRulesStore } from "@/stores/rules.store"
import { useOnlineStatus } from "@/shared/hooks/use-online-status"
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
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { AlertTriangle } from "lucide-react"

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
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const submitOnboarding = useSubmitOnboarding()
  const enqueue = useOfflineStore((s) => s.enqueue)
  const flush = useOfflineStore((s) => s.flush)
  const rulesVersion = useRulesStore((s) => s.version)

  useEffect(() => {
    if (isOnline) {
      flush()
    }
  }, [isOnline, flush])

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      client_type: "INDIVIDUAL",
      pep_status: false,
      sanctions_screening_match: false,
      adverse_media_flag: false,
    },
  })

  const formValues = watch()
  const classification = useClassification(formValues)

  const onSubmit = async (data: OnboardingFormData) => {
    if (isOnline) {
      try {
        const response = await submitOnboarding.mutateAsync(data)
        toast.success("Record submitted successfully")
        navigate(`/clients/${response.id}`)
      } catch {
        toast.error("Failed to submit record")
      }
    } else {
      enqueue({
        uuid: crypto.randomUUID(),
        fields: data,
        client_rules_version: rulesVersion,
        client_computed_tier: classification.tier,
        created_at: Date.now(),
      })
      toast.success("Record saved offline — will sync when connected")
      navigate("/clients")
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">New Onboarding Record</h1>
          <p className="text-muted-foreground">
            Submit a new client for risk classification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Risk Tier:</span>
          <RiskBadge tier={classification.tier} />
        </div>
      </div>

      <Separator className="my-6" />

      {classification.triggered_rules.length > 0 && (
        <Alert className="mb-6">
          <AlertTriangle data-icon="inline-start" />
          <AlertDescription>
            Triggered rules: {classification.triggered_rules.join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Basic details about the client being onboarded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
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

              <div className="grid gap-4 md:grid-cols-2">
                <Field data-invalid={!!errors.country_of_tax_residence}>
                  <FieldLabel htmlFor="country_of_tax_residence">
                    Country of Tax Residence
                  </FieldLabel>
                  <Input
                    id="country_of_tax_residence"
                    aria-invalid={!!errors.country_of_tax_residence}
                    {...register("country_of_tax_residence")}
                  />
                  {errors.country_of_tax_residence && (
                    <FieldDescription>
                      {errors.country_of_tax_residence.message}
                    </FieldDescription>
                  )}
                </Field>

                <Field data-invalid={!!errors.annual_income}>
                  <FieldLabel htmlFor="annual_income">
                    Annual Income (£)
                  </FieldLabel>
                  <Input
                    id="annual_income"
                    type="number"
                    aria-invalid={!!errors.annual_income}
                    {...register("annual_income", { valueAsNumber: true })}
                  />
                  {errors.annual_income && (
                    <FieldDescription>
                      {errors.annual_income.message}
                    </FieldDescription>
                  )}
                </Field>
              </div>

              <Field data-invalid={!!errors.source_of_funds}>
                <FieldLabel>Source of Funds</FieldLabel>
                <Controller
                  name="source_of_funds"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {SOURCE_OF_FUNDS.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Risk Indicators</CardTitle>
            <CardDescription>
              Flags that affect risk classification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldSet>
              <FieldLegend>Risk Flags</FieldLegend>
              <FieldGroup>
                <Field>
                  <div className="flex items-center gap-3">
                    <Controller
                      name="pep_status"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="pep_status"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <FieldLabel htmlFor="pep_status">
                      Politically Exposed Person
                    </FieldLabel>
                  </div>
                </Field>

                <Field>
                  <div className="flex items-center gap-3">
                    <Controller
                      name="sanctions_screening_match"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="sanctions"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <FieldLabel htmlFor="sanctions">
                      Sanctions Screening Match
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
                          id="adverse_media"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <FieldLabel htmlFor="adverse_media">
                      Adverse Media Flag
                    </FieldLabel>
                  </div>
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            {isOnline ? "Submit Record" : "Save Offline"}
          </Button>
        </div>
      </form>
    </div>
  )
}
