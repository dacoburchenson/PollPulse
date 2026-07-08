
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts"
import { Users, Book, Briefcase, Wallet, MapPin, Building, Activity, TrendingUp, CheckSquare, Clock } from "lucide-react"

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

// Mock data - in a real app, this would be fetched from Firestore
const genderData = [
  { name: 'Female', value: 245 },
  { name: 'Male', value: 187 },
  { name: 'Other', value: 12 },
];
const educationData = [
  { name: 'Secondary', value: 150 },
  { name: 'Tertiary', value: 200 },
  { name: 'University', value: 80 },
  { name: 'Post-Grad', value: 14 },
];
const occupationData = [
    { name: 'Employed', value: 250 },
    { name: 'Self-employed', value: 120 },
    { name: 'Student', value: 40 },
    { name: 'Unemployed', value: 34 },
];
const incomeData = [
    { name: '< $2M', value: 150 },
    { name: '$2M - $5M', value: 180 },
    { name: '$5M - $10M', value: 90 },
    { name: '> $10M', value: 24 },
];
const parishData = [
    { name: "Kingston", value: 120 },
    { name: "St. Andrew", value: 95 },
    { name: "St. Catherine", value: 80 },
    { name: "St. James", value: 60 },
    { name: "Clarendon", value: 45 },
    { name: "Other", value: 44 },
];
const townTypeData = [
  { name: 'Urban', value: 310 },
  { name: 'Rural', value: 134 },
];
const falloffData = [
    { question: 'Q1', dropOffs: 5 },
    { question: 'Q2', dropOffs: 12 },
    { question: 'Q3', dropOffs: 8 },
    { question: 'Q4', dropOffs: 25 },
    { question: 'Q5', dropOffs: 3 },
];
const questionResponsesData = [
    { name: 'Option A', 'Q1': 100, 'Q2': 150, 'Q3': 80 },
    { name: 'Option B', 'Q1': 200, 'Q2': 120, 'Q3': 180 },
    { name: 'Option C', 'Q1': 130, 'Q2': 90, 'Q3': 110 },
    { name: 'Option D', 'Q1': 70, 'Q2': 140, 'Q3': 30 },
]

export default function CampaignReportPage() {

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold tracking-tight">
          Campaign Report: Summer Sale Feedback
        </h2>
        <p className="text-muted-foreground">
          Detailed analytics and real-time results for your campaign.
        </p>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">444</div>
            <p className="text-xs text-muted-foreground">+20% since yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.5%</div>
            <p className="text-xs text-muted-foreground">-1.2% from campaign average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45s</div>
            <p className="text-xs text-muted-foreground">Avg. time to complete</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drop-off Rate</CardTitle>
             <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.5%</div>
            <p className="text-xs text-muted-foreground">Most drop-offs at Q4</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Real-Time Question Results</CardTitle>
            <CardDescription>See how respondents are answering each question as it happens.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
              <BarChart data={questionResponsesData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}}  />
                  <Legend />
                  <Bar dataKey="Q1" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Q2" stackId="a" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="Q3" stackId="a" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
            <CardTitle>Participant Fall-off by Question</CardTitle>
            <CardDescription>Identify which questions cause respondents to abandon the survey.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={falloffData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="question" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}}  />
                <Line type="monotone" dataKey="dropOffs" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div>
        <h3 className="text-2xl font-headline font-bold tracking-tight mb-4">
            Respondent Demographics
        </h3>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
             <DemographicCard title="Gender" icon={<Users />} data={genderData} />
             <DemographicCard title="Town Type" icon={<Building />} data={townTypeData} />
             <DemographicCard title="Education Level" icon={<Book />} data={educationData} />
             <DemographicCard title="Occupation" icon={<Briefcase />} data={occupationData} />
             <DemographicCard title="Income (JMD)" icon={<Wallet />} data={incomeData} />
             <DemographicCard title="Parish" icon={<MapPin />} data={parishData} horizontal />
        </div>
      </div>


    </div>
  )
}


type DemographicCardProps = {
    title: string;
    icon: React.ReactNode;
    data: { name: string; value: number }[];
    horizontal?: boolean;
}

const DemographicCard = ({ title, icon, data, horizontal = false }: DemographicCardProps) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
            {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {horizontal ? (
             <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} hide />
                    <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                         {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" labelLine={false} innerRadius={50} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} cursor={{fill: 'hsl(var(--muted))'}}  />
                </PieChart>
            </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
)
