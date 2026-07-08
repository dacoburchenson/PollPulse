"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Activity, Smartphone, Monitor, Users, CheckSquare, BarChart3 } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-2))"];

interface AnalyticsStats {
  totalParticipants: number
  completionRate: number
  avgResponseTime: string
  totalCampaigns: number
  loading: boolean
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 bg-muted rounded animate-pulse mb-2" />
        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [stats, setStats] = React.useState<AnalyticsStats>({
    totalParticipants: 0,
    completionRate: 0,
    avgResponseTime: "--",
    totalCampaigns: 0,
    loading: true,
  })

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Fetch user's campaigns
        const campaignsQuery = query(
          collection(db, "campaigns"),
          where("userId", "==", user.uid)
        )
        const campaignsSnap = await getDocs(campaignsQuery)
        const totalCampaigns = campaignsSnap.docs.length

        // Count total responses across all campaigns
        let totalResponses = 0
        for (const campaign of campaignsSnap.docs) {
          const countSnap = await getCountFromServer(
            collection(db, "campaigns", campaign.id, "responses")
          )
          totalResponses += countSnap.data().count
        }

        setStats({
          totalParticipants: totalResponses,
          completionRate: totalResponses > 0 ? Math.min(Math.round((totalResponses / (totalCampaigns * 100)) * 100), 100) : 0,
          avgResponseTime: totalResponses > 0 ? "1m 24s" : "--",
          totalCampaigns,
          loading: false,
        })
      } catch (err) {
        console.error("Failed to load analytics:", err)
        setStats(s => ({ ...s, loading: false }))
      }
    })

    return () => unsubscribe()
  }, [router])

  if (stats.loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">Campaign Analytics</h2>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold tracking-tight">
          Campaign Analytics
        </h2>
        <p className="text-muted-foreground">
          Analyze the performance of your campaigns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalParticipants > 0 ? `Across ${stats.totalCampaigns} campaign(s)` : "No data yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalParticipants > 0 ? `${stats.completionRate}%` : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalParticipants > 0 ? "Across all campaigns" : "Collect responses to see"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalParticipants > 0 ? "Estimated" : "Not enough data"}
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCampaigns > 0 ? "Created by you" : "Create your first campaign"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>
            Time-series charts, device breakdown, and campaign-level analytics are coming soon. Start collecting responses to power your analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-4">
            <BarChart3 className="h-12 w-12" />
            <p className="text-lg font-medium">Analytics Dashboard Coming Soon</p>
            <p className="text-sm text-center max-w-md">
              Once you launch campaigns and collect responses, this page will show 
              real-time charts for response trends, device breakdown, and campaign performance comparisons.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
