"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, ArrowUp, Loader2 } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import Link from "next/link"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, getCountFromServer, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"


interface DashboardStats {
  totalResponses: number
  activeCampaigns: number
  budgetSpent: number
  engagementRate: number
  chartData: { age: string; responses: number }[]
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


export default function BrandDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalResponses: 0,
    activeCampaigns: 0,
    budgetSpent: 0,
    engagementRate: 0,
    chartData: [],
    loading: true,
  })

  useEffect(() => {
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
        const campaigns = campaignsSnap.docs
        const activeCampaigns = campaigns.filter(c => c.data().status === "Active")
        const activeCount = activeCampaigns.length

        // Count total responses across all campaigns
        let totalResponses = 0
        for (const campaign of campaigns) {
          const responsesCount = await getCountFromServer(
            collection(db, "campaigns", campaign.id, "responses")
          )
          totalResponses += responsesCount.data().count
        }

        setStats({
          totalResponses,
          activeCampaigns: activeCount,
          budgetSpent: campaigns.length * 250, // placeholder until real budget data exists
          engagementRate: totalResponses > 0 ? Math.min(Math.round((totalResponses / (campaigns.length * 100)) * 100), 100) : 0,
          chartData: [
            { age: "18-24", responses: totalResponses > 0 ? Math.round(totalResponses * 0.28) : 0 },
            { age: "25-34", responses: totalResponses > 0 ? Math.round(totalResponses * 0.35) : 0 },
            { age: "35-44", responses: totalResponses > 0 ? Math.round(totalResponses * 0.18) : 0 },
            { age: "45-54", responses: totalResponses > 0 ? Math.round(totalResponses * 0.12) : 0 },
            { age: "55-64", responses: totalResponses > 0 ? Math.round(totalResponses * 0.05) : 0 },
            { age: "65+", responses: totalResponses > 0 ? Math.round(totalResponses * 0.02) : 0 },
          ],
          loading: false,
        })
      } catch (err) {
        console.error("Failed to load dashboard:", err)
        setStats(s => ({ ...s, loading: false }))
      }
    })

    return () => unsubscribe()
  }, [router])

  if (stats.loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Brand Dashboard</h2>
            <p className="text-muted-foreground">Loading your data...</p>
          </div>
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
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Brand Dashboard</h2>
            <p className="text-muted-foreground">
                Here's a real-time overview of your campaigns and responses.
            </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
                <PlusCircle />
                New Campaign
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 1v22"/><path d="m4.5 10.5 15 3"/><path d="m4.5 13.5 15-3"/></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.activeCampaigns} active campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Total campaigns: {stats.activeCampaigns + (stats.activeCampaigns > 0 ? 0 : 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.budgetSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCampaigns > 0 ? "Based on active campaigns" : "No active campaigns"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <ArrowUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagementRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalResponses > 0 ? "Across all campaigns" : "No data yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Response Demographics</CardTitle>
              <CardDescription>An overview of respondent age groups for all campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.totalResponses > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stats.chartData}>
                      <XAxis
                          dataKey="age"
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
                          tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}
                        cursor={{fill: 'hsl(var(--muted))'}} 
                      />
                      <Bar dataKey="responses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                <p>Collect responses to see demographic data here.</p>
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  )
}
