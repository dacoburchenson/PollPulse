
"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  doc,
  getDoc,
  collection,
  getCountFromServer,
  getDocs,
  Timestamp,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import {
  Users,
  Book,
  Briefcase,
  Wallet,
  MapPin,
  Building,
  Activity,
  TrendingUp,
  CheckSquare,
  Clock,
  Inbox,
  AlertCircle,
  ArrowLeft,
} from "lucide-react"
import { auth, db } from "@/lib/firebase"
import type { Campaign } from "@/app/(app)/dashboard/campaigns/page"

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
]

type Question = {
  id: number
  text: string
  type: "multiple-choice" | "open-text"
  options: string[]
}

type ResponseDoc = {
  userId: string
  answers: { [key: number]: string }
  submittedAt: Timestamp
}

// Demographic field keys we recognize in the answers map (top-level,
// not tied to a question id). These are the same buckets the old mock
// page displayed, so brands that already collect these in their
// surveys will see real numbers immediately.
const DEMOGRAPHIC_FIELDS = [
  { key: "gender", label: "Gender", icon: Users },
  { key: "townType", label: "Town Type", icon: Building },
  { key: "education", label: "Education Level", icon: Book },
  { key: "occupation", label: "Occupation", icon: Briefcase },
  { key: "income", label: "Income (JMD)", icon: Wallet },
  { key: "parish", label: "Parish", icon: MapPin, horizontal: true },
] as const

type DemographicField = (typeof DEMOGRAPHIC_FIELDS)[number]

export default function CampaignReportPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = React.useState<any>(null)
  const [authLoading, setAuthLoading] = React.useState(true)
  const [campaign, setCampaign] = React.useState<Campaign | null>(null)
  const [campaignExists, setCampaignExists] = React.useState<boolean | null>(null)
  const [responses, setResponses] = React.useState<ResponseDoc[]>([])
  const [totalResponses, setTotalResponses] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  // Auth
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
      if (!firebaseUser) {
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  // Fetch campaign + responses when id / user are ready
  React.useEffect(() => {
    const campaignId = params?.id
    if (!campaignId || !user) return

    let cancelled = false
    setLoading(true)

    ;(async () => {
      try {
        const campaignRef = doc(db, "campaigns", campaignId)
        const campaignSnap = await getDoc(campaignRef)

        if (cancelled) return

        if (!campaignSnap.exists()) {
          setCampaignExists(false)
          setCampaign(null)
          setResponses([])
          setTotalResponses(0)
          return
        }

        const data = campaignSnap.data() as Campaign & { userId: string }
        // Security: only the owner of the campaign can view the report.
        if (data.userId && data.userId !== user.uid) {
          toast({
            title: "Not authorized",
            description: "You don't have access to this campaign report.",
            variant: "destructive",
          })
          router.push("/dashboard/campaigns")
          return
        }

        setCampaignExists(true)
        setCampaign(data)

        const responsesRef = collection(db, "campaigns", campaignId, "responses")

        const [countSnap, responsesSnap] = await Promise.all([
          getCountFromServer(responsesRef).catch(() => null),
          getDocs(responsesRef).catch((err) => {
            console.error("Error fetching responses:", err)
            return null
          }),
        ])

        if (cancelled) return

        const count = countSnap?.data()?.count ?? responsesSnap?.size ?? 0
        setTotalResponses(count)

        const docs: ResponseDoc[] = responsesSnap
          ? responsesSnap.docs.map((d) => d.data() as ResponseDoc)
          : []
        setResponses(docs)
      } catch (error) {
        console.error("Error loading report:", error)
        if (!cancelled) {
          toast({
            title: "Error loading report",
            description: "Could not retrieve the campaign report.",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [params?.id, user, router, toast])

  // ---- Loading & auth states ----
  if (authLoading) {
    return (
      <div className="p-8 text-muted-foreground">Loading...</div>
    )
  }

  if (!user) {
    return <div className="p-8 text-muted-foreground">Redirecting to login...</div>
  }

  if (loading) {
    return <ReportSkeleton />
  }

  if (campaignExists === false) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="h-4 w-4" /> Back to campaigns
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campaign not found</AlertTitle>
          <AlertDescription>
            The campaign you're looking for doesn't exist or has been deleted.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!campaign) return null

  // ---- Derived data ----
  const questions: Question[] = (campaign.questions ?? []) as Question[]

  // Completion rate: % of responses that answered every multiple-choice / open-text
  // question the campaign defined.
  const completionRate =
    responses.length === 0 || questions.length === 0
      ? null
      : Math.round(
          (responses.filter((r) => {
            const answered = Object.keys(r.answers ?? {}).length
            return answered >= questions.length
          }).length /
            responses.length) *
            1000,
        ) / 10

  // Per-question option counts (multiple-choice) for the bar chart.
  const questionResults = questions
    .filter((q) => q.type === "multiple-choice" && q.options.length > 0)
    .map((q) => {
      const counts: Record<string, number> = {}
      for (const opt of q.options) counts[opt] = 0
      for (const r of responses) {
        const ans = r.answers?.[q.id]
        if (ans && counts[ans] !== undefined) {
          counts[ans] += 1
        } else if (ans) {
          // free-form answer not in declared options
          counts[ans] = (counts[ans] ?? 0) + 1
        }
      }
      return { question: q, counts }
    })

  // Build stacked-bar dataset: x-axis = option name, series = question text.
  // Only include questions that actually received responses to keep the chart
  // readable for very small campaigns.
  const answeredQuestionResults = questionResults.filter((qr) =>
    Object.values(qr.counts).some((v) => v > 0),
  )
  const allOptionNames = Array.from(
    new Set(answeredQuestionResults.flatMap((qr) => Object.keys(qr.counts))),
  )
  const questionResponsesData = allOptionNames.map((opt) => {
    const row: Record<string, string | number> = { name: opt }
    answeredQuestionResults.forEach((qr, idx) => {
      const safeKey = `Q${idx + 1}`
      row[safeKey] = qr.counts[opt] ?? 0
    })
    return row
  })

  // Drop-off per question: number of respondents who didn't answer this
  // question but answered an earlier one. Useful for spotting where users
  // abandon the survey.
  const falloffData = questions.map((q, idx) => {
    const started = responses.filter((r) => {
      // respondent "started" if they answered any question with id <= this one
      const ids = Object.keys(r.answers ?? {}).map(Number)
      return ids.some((id) => id <= q.id)
    })
    const droppedHere = started.filter(
      (r) => (r.answers?.[q.id] ?? "").toString().trim() === "",
    ).length
    return {
      question: `Q${idx + 1}`,
      dropOffs: droppedHere,
    }
  })

  // Demographics from per-response top-level fields (gender, education, ...).
  // If a demographic key isn't present on any response, the card is rendered
  // in an empty state rather than fabricating numbers.
  const demographicData: Record<
    string,
    { label: string; icon: React.ComponentType<{ className?: string }>; horizontal?: boolean; data: { name: string; value: number }[] }
  > = {}

  for (const field of DEMOGRAPHIC_FIELDS) {
    const counts: Record<string, number> = {}
    for (const r of responses) {
      const value = (r.answers as any)?.[field.key]
      if (typeof value === "string" && value.trim() !== "") {
        counts[value] = (counts[value] ?? 0) + 1
      }
    }
    const data = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    demographicData[field.key] = {
      label: field.label,
      icon: field.icon,
      horizontal: (field as DemographicField & { horizontal?: boolean }).horizontal,
      data,
    }
  }

  // ---- Render ----
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 gap-2">
            <Link href="/dashboard/campaigns">
              <ArrowLeft className="h-4 w-4" /> Back to campaigns
            </Link>
          </Button>
          <h2 className="text-3xl font-headline font-bold tracking-tight">
            Campaign Report: {campaign.name}
          </h2>
          <p className="text-muted-foreground">
            Detailed analytics and real-time results for your campaign.
          </p>
          <div className="flex gap-2 mt-2">
            <Badge
              variant={
                campaign.status === "Active"
                  ? "default"
                  : campaign.status === "Completed"
                    ? "secondary"
                    : "outline"
              }
              className="capitalize"
            >
              {campaign.status}
            </Badge>
            {campaign.startDate && (
              <Badge variant="outline">
                Started {campaign.startDate.toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Responses"
          value={totalResponses.toLocaleString()}
          subtitle={
            totalResponses > 0
              ? "Real responses from Firestore"
              : "Waiting for first response"
          }
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Completion Rate"
          value={completionRate === null ? "—" : `${completionRate}%`}
          subtitle={
            completionRate === null
              ? "Needs at least one response"
              : "Fully answered surveys"
          }
          icon={<CheckSquare className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg. Time"
          value="—"
          subtitle="Not tracked yet"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Drop-off Rate"
          value={
            totalResponses === 0
              ? "—"
              : `${Math.max(
                  0,
                  100 - (completionRate ?? 0),
                ).toFixed(1)}%`
          }
          subtitle={
            totalResponses === 0
              ? "Needs at least one response"
              : "Respondents who didn't finish"
          }
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-Time Question Results</CardTitle>
          <CardDescription>
            See how respondents are answering each question as it happens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {answeredQuestionResults.length === 0 ? (
            <EmptyChart
              message="No multiple-choice responses yet"
              hint="Once respondents start answering, you'll see a breakdown here."
            />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={questionResponsesData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Legend />
                {answeredQuestionResults.map((_, idx) => (
                  <Bar
                    key={idx}
                    dataKey={`Q${idx + 1}`}
                    stackId="a"
                    fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    radius={idx === answeredQuestionResults.length - 1 ? [4, 4, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participant Fall-off by Question</CardTitle>
          <CardDescription>
            Identify which questions cause respondents to abandon the survey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 || totalResponses === 0 ? (
            <EmptyChart
              message="No fall-off data yet"
              hint={
                questions.length === 0
                  ? "Add questions to your campaign to track fall-off."
                  : "Once responses start coming in, fall-off will be tracked per question."
              }
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={falloffData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <XAxis dataKey="question" stroke="#888888" fontSize={12} />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Line
                  type="monotone"
                  dataKey="dropOffs"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-2xl font-headline font-bold tracking-tight mb-4">
          Respondent Demographics
        </h3>
        {totalResponses === 0 ? (
          <EmptyChart
            message="No responses yet"
            hint="Demographics will appear here once people start responding."
          />
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {DEMOGRAPHIC_FIELDS.map((field) => {
              const entry = demographicData[field.key]
              return (
                <DemographicCard
                  key={field.key}
                  title={entry.label}
                  icon={<field.icon className="h-4 w-4" />}
                  data={entry.data}
                  horizontal={entry.horizontal}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Sub-components ----

type MetricCardProps = {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}

const MetricCard = ({ title, value, subtitle, icon }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
)

type DemographicCardProps = {
  title: string
  icon: React.ReactNode
  data: { name: string; value: number }[]
  horizontal?: boolean
}

const DemographicCard = ({
  title,
  icon,
  data,
  horizontal = false,
}: DemographicCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-base font-medium flex items-center gap-2">
        {icon} {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-2 py-6 text-muted-foreground">
          <Inbox className="h-6 w-6" />
          <p className="text-sm">No demographic data collected yet.</p>
        </div>
      ) : horizontal ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis
              type="number"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              hide
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name} ${(Number(percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              cursor={{ fill: "hsl(var(--muted))" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>
)

const EmptyChart = ({
  message,
  hint,
}: {
  message: string
  hint: string
}) => (
  <div className="flex flex-col items-center justify-center text-center gap-2 py-12 text-muted-foreground">
    <Inbox className="h-8 w-8" />
    <p className="font-medium">{message}</p>
    <p className="text-sm max-w-sm">{hint}</p>
  </div>
)

const ReportSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-20 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[350px] w-full" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)
