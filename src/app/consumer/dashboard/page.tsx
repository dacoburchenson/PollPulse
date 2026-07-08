"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, BarChart, Trophy, ArrowRight, Loader2 } from "lucide-react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type Campaign = {
    id: string;
    name: string;
    description?: string;
    status: "Active" | "Draft" | "Completed";
    questions?: any[];
    reward?: string;
    brandName?: string;
    brandColor?: string;
};

export default function ConsumerDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [availableSurveys, setAvailableSurveys] = useState<Campaign[]>([]);
  const [surveysCompleted, setSurveysCompleted] = useState(0);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  // Parse a reward string like "$1.50" or "JMD $200" into a number.
  // Falls back to 1 when the field is missing or unparseable (the
  // consumer dashboard also defaults reward to "$1.00").
  const parseRewardAmount = (reward?: string): number => {
    if (!reward) return 1
    const match = reward.replace(/[^0-9.]/g, "")
    const num = parseFloat(match)
    return Number.isFinite(num) ? num : 1
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || authLoading) return;

      try {
        // Fetch active campaigns
        const q = query(collection(db, "campaigns"), where("status", "==", "Active"));
        const querySnapshot = await getDocs(q);

        const campaignsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                questions: data.questions || [],
                reward: data.reward || "$1.00",
                brandName: data.brandName || "A Brand",
                brandColor: data.brandColor || "bg-gray-500",
                status: data.status,
            }
        }) as Campaign[];
        setAvailableSurveys(campaignsData);

        // Count surveys the user has completed (responses they've submitted)
        // and sum the per-campaign reward for lifetime earnings.
        let completedCount = 0;
        let totalEarnings = 0;
        for (const campaign of querySnapshot.docs) {
          const responsesQuery = query(
            collection(db, "campaigns", campaign.id, "responses"),
            where("userId", "==", user.uid)
          );
          const responsesSnap = await getDocs(responsesQuery);
          const responsesForCampaign = responsesSnap.docs.length;
          if (responsesForCampaign === 0) continue;
          completedCount += responsesForCampaign;
          // Fetch the campaign's reward string (e.g. "$1.50") to compute
          // the user's actual earnings from this campaign.
          const campaignSnap = await getDoc(doc(db, "campaigns", campaign.id));
          const rewardStr = campaignSnap.exists()
            ? (campaignSnap.data() as { reward?: string }).reward
            : undefined;
          totalEarnings += parseRewardAmount(rewardStr) * responsesForCampaign;
        }
        setSurveysCompleted(completedCount);
        setLifetimeEarnings(totalEarnings);
      } catch (err: any) {
        console.error("Error fetching data: ", err);
        toast({
            title: "Error loading surveys",
            description: "Could not retrieve available surveys.",
            variant: "destructive"
        });
      } finally {
        setStatsLoading(false);
      }
    };

    if (user && !authLoading) {
        fetchData();
    }
  }, [user, authLoading, toast]);

  if (authLoading || !user) {
      return (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin mr-2" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold tracking-tight">
          Welcome Back, {user?.displayName || 'User'}!
        </h2>
        <p className="text-muted-foreground">
          Here are the latest surveys available for you.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lifetime Earnings
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-20 bg-muted rounded animate-pulse mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${lifetimeEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {surveysCompleted > 0 ? `From ${surveysCompleted} survey${surveysCompleted === 1 ? "" : "s"} completed` : "Complete surveys to earn"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Surveys Completed
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">{surveysCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  {availableSurveys.length} new surveys available
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {surveysCompleted > 0 ? "Active" : "Newcomer"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {surveysCompleted > 0 ? `Based on ${surveysCompleted} survey(s)` : "Start your first survey"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-2xl font-headline font-bold tracking-tight mb-4">
          Available Surveys
        </h3>
        {availableSurveys.length === 0 && !statsLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
              <BarChart className="h-8 w-8" />
              <p>No surveys available right now. Check back later!</p>
            </CardContent>
          </Card>
        ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {availableSurveys.map((survey) => (
            <Card key={survey.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{survey.name}</CardTitle>
                    <div className={`w-8 h-8 rounded-full ${survey.brandColor}`} />
                </div>
                <CardDescription>From {survey.brandName}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{survey.questions?.length || 0} Questions</span>
                    <Badge variant="secondary" className="text-base">{survey.reward}</Badge>
                </div>
              </CardContent>
              <CardFooter>
                 <Button asChild className="w-full">
                  <Link href={`/consumer/survey/${survey.id}`}>
                    Start Survey <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        )}
      </div>
    </div>
  )
}
