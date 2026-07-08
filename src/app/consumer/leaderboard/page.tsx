"use client"

import { useState, useEffect } from "react"
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
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface LeaderboardEntry {
  rank: number
  uid: string
  name: string
  initials: string
  avatar: string | null
  surveysCompleted: number
  isCurrentUser: boolean
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="h-5 w-8 bg-muted rounded animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" />
      </TableCell>
    </TableRow>
  )
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // No user signed in — show empty leaderboard, stop loading
      if (!user) {
        setEntries([])
        setLoading(false)
        return
      }

      try {
        // Step 1: get all consumer profiles. Filtering by userType
        // avoids showing brand accounts in the responder ranking.
        const profilesSnap = await getDocs(
          query(collection(db, "userProfiles"), where("userType", "==", "consumer"))
        );

        // Step 2: for each consumer, count their responses across every
        // campaign. We use getCountFromServer per user per campaign so
        // we never have to download the response documents themselves.
        // Note: the responses subcollection isn't filterable by userId
        // in getCountFromServer (it doesn't accept a where clause), so
        // we fetch the userIds and sum the matches client-side. This
        // still beats loading all response documents for the page.
        const campaignsSnap = await getDocs(collection(db, "campaigns"));
        const campaignIds = campaignsSnap.docs.map(d => d.id);

        const rows: LeaderboardEntry[] = [];
        for (const profileDoc of profilesSnap.docs) {
          const data = profileDoc.data() as {
            displayName?: string
            email?: string
            photoURL?: string
          };
          const name = data.displayName || data.email || "Anonymous";
          let count = 0;
          for (const campaignId of campaignIds) {
            const responsesSnap = await getDocs(
              query(
                collection(db, "campaigns", campaignId, "responses"),
                where("userId", "==", profileDoc.id)
              )
            );
            count += responsesSnap.size;
          }
          rows.push({
            rank: 0,
            uid: profileDoc.id,
            name,
            initials: name.substring(0, 2).toUpperCase(),
            avatar: data.photoURL ?? null,
            surveysCompleted: count,
            isCurrentUser: profileDoc.id === user.uid,
          });
        }

        // Sort by surveys completed (desc), then alphabetically for
        // deterministic ordering when two users have the same count.
        rows.sort((a, b) => {
          if (b.surveysCompleted !== a.surveysCompleted) {
            return b.surveysCompleted - a.surveysCompleted
          }
          return a.name.localeCompare(b.name)
        });

        const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));
        setEntries(ranked);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">Leaderboard</h2>
          <p className="text-muted-foreground">Loading rankings...</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Surveys</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold tracking-tight">
          Leaderboard
        </h2>
        <p className="text-muted-foreground">
          See how you stack up against other top responders.
        </p>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Trophy className="text-yellow-500" />
                  Top Responders - All Time
              </CardTitle>
              <CardDescription>
              Rankings are based on the total number of surveys completed.
              </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Couldn't load the leaderboard. Please try again later.</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
                <Trophy className="h-8 w-8" />
                <p className="font-medium">No data yet.</p>
                <p className="text-sm">Complete a survey to claim the top spot.</p>
              </div>
            ) : (
              <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Surveys</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {entries.map((player) => (
                      <TableRow key={player.uid} className={player.isCurrentUser ? "bg-primary/10" : ""}>
                          <TableCell className="font-bold text-lg">{player.rank}</TableCell>
                          <TableCell>
                              <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                      {player.avatar ? (
                                        <AvatarImage src={player.avatar} alt={player.name} />
                                      ) : null}
                                      <AvatarFallback>{player.initials}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{player.name}{player.isCurrentUser && " (You)"}</span>
                              </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{player.surveysCompleted.toLocaleString()}</TableCell>
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
