"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Activity, Smartphone, Monitor, Users, CheckSquare } from "lucide-react"

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-2))"];

export default function AnalyticsPage() {
  const [timeData, setTimeData] = React.useState<any[]>([])
  const [campaignData, setCampaignData] = React.useState<any[]>([])
  const [deviceData, setDeviceData] = React.useState<any[]>([])

  React.useEffect(() => {
    // Generate random data for charts
    setTimeData([
      { date: "2024-05-01", responses: Math.floor(Math.random() * 500) + 100 },
      { date: "2024-05-02", responses: Math.floor(Math.random() * 500) + 120 },
      { date: "2024-05-03", responses: Math.floor(Math.random() * 500) + 150 },
      { date: "2024-05-04", responses: Math.floor(Math.random() * 500) + 200 },
      { date: "2024-05-05", responses: Math.floor(Math.random() * 500) + 180 },
      { date: "2024-05-06", responses: Math.floor(Math.random() * 500) + 250 },
      { date: "2024-05-07", responses: Math.floor(Math.random() * 500) + 300 },
    ]);

    setCampaignData([
        { name: "Summer Sale Feedback", responses: Math.floor(Math.random() * 1000) + 500, rate: Math.floor(Math.random() * 20) + 70 },
        { name: "New Feature Poll", responses: Math.floor(Math.random() * 1000) + 500, rate: Math.floor(Math.random() * 20) + 70 },
        { name: "Brand Perception", responses: Math.floor(Math.random() * 1000) + 500, rate: Math.floor(Math.random() * 20) + 70 },
        { name: "Website UX Survey", responses: Math.floor(Math.random() * 1000) + 500, rate: Math.floor(Math.random() * 20) + 70 },
        { name: "Customer Support Score", responses: Math.floor(Math.random() * 1000) + 500, rate: Math.floor(Math.random() * 20) + 70 },
    ]);

    setDeviceData([
        { name: 'Mobile', value: Math.floor(Math.random() * 7000) + 3000 },
        { name: 'Desktop', value: Math.floor(Math.random() * 3000) + 1000 },
        { name: 'Tablet', value: Math.floor(Math.random() * 1000) + 500 },
    ]);

  }, [])

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
            <div className="text-2xl font-bold">12,834</div>
            <p className="text-xs text-muted-foreground">+15.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88.4%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1m 24s</div>
            <p className="text-xs text-muted-foreground">-5s from average</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+3 since last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Responses Over Time</CardTitle>
            <CardDescription>Daily response volume for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData}>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}}  />
                <Line type="monotone" dataKey="responses" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>How respondents are taking surveys.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {deviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}}  />
                </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>Based on total number of responses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={campaignData} layout="vertical">
                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={150} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}}  />
                    <Bar dataKey="responses" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
      </Card>
    </div>
  )
}
