"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CircleDollarSign, Gift } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

interface RewardEntry {
  id: string
  date: string
  description: string
  amount: string
  type: "Survey Reward"
  isPositive: boolean
}

interface RewardsState {
  availableBalance: number
  lifetimeEarnings: number
  history: RewardEntry[]
  loading: boolean
}

function parseRewardAmount(reward?: string): number {
  if (!reward) return 1
  const match = reward.replace(/[^0-9.]/g, "")
  const num = parseFloat(match)
  return Number.isFinite(num) ? num : 1
}

function SkeletonHistoryRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-5 w-24 bg-muted rounded animate-pulse" />
      </TableCell>
      <TableCell className="text-right">
        <div className="h-4 w-14 bg-muted rounded animate-pulse ml-auto" />
      </TableCell>
    </TableRow>
  )
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

export default function RewardsPage() {
  const [state, setState] = useState<RewardsState>({
    availableBalance: 0,
    lifetimeEarnings: 0,
    history: [],
    loading: true,
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState((s) => ({ ...s, loading: false }))
        return
      }

      try {
        // Scan all campaigns for the user's responses. The responses
        // subcollection is where survey submissions actually live.
        const campaignsSnap = await getDocs(collection(db, "campaigns"))

        const history: RewardEntry[] = []
        let lifetimeEarnings = 0

        for (const campaignDoc of campaignsSnap.docs) {
          const responsesQuery = query(
            collection(db, "campaigns", campaignDoc.id, "responses"),
            where("userId", "==", user.uid)
          )
          const responsesSnap = await getDocs(responsesQuery)
          if (responsesSnap.empty) continue

          // Get campaign metadata (name + reward)
          const campaignSnap = await getDoc(doc(db, "campaigns", campaignDoc.id))
          const campaignData = campaignSnap.exists() ? campaignSnap.data() : {}
          const campaignName: string = campaignData.name ?? "Survey"
          const rewardAmount = parseRewardAmount(campaignData.reward)
          lifetimeEarnings += rewardAmount * responsesSnap.size

          for (const response of responsesSnap.docs) {
            const data = response.data() as {
              submittedAt?: Timestamp
            }
            const submittedAt = data.submittedAt
            const date =
              submittedAt instanceof Timestamp
                ? submittedAt.toDate()
                : new Date()

            history.push({
              id: response.id,
              date: date.toISOString().slice(0, 10),
              description: campaignName,
              amount: `$${rewardAmount.toFixed(2)}`,
              type: "Survey Reward",
              isPositive: true,
            })
          }
        }

        // Newest first
        history.sort((a, b) => (a.date < b.date ? 1 : -1))
        const trimmedHistory = history.slice(0, 50)

        // Available balance is the lifetime total until a payouts
        // collection exists to subtract withdrawals.
        setState({
          availableBalance: lifetimeEarnings,
          lifetimeEarnings,
          history: trimmedHistory,
          loading: false,
        })
      } catch (err) {
        console.error("Failed to load rewards:", err)
        setState((s) => ({ ...s, loading: false }))
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold tracking-tight">
          Your Rewards
        </h2>
        <p className="text-muted-foreground">
          View your earnings history and available balance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {state.loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Balance
                </CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${state.availableBalance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  $10.00 minimum for payout
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lifetime Earnings
                </CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${state.lifetimeEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {state.history.length > 0
                    ? `From ${state.history.length} survey${
                        state.history.length === 1 ? "" : "s"
                      } completed`
                    : "No earnings yet"}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>
            A log of all your rewards and payouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonHistoryRow key={i} />
                ))}
              </TableBody>
            </Table>
          ) : state.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p className="font-medium">No data yet.</p>
              <p className="text-sm">
                Complete a survey to start earning rewards.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        item.isPositive ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {item.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
