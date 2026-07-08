
"use client";

import * as React from "react";
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
import { CircleDollarSign, BarChart, Trophy, ArrowRight } from "lucide-react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
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
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  const [availableSurveys, setAvailableSurveys] = React.useState<Campaign[]>([]);

  React.useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user && !loading) {
        router.push("/login");
        return;
      }
      if (user) {
        try {
          const q = query(collection(db, "campaigns"), where("status", "==", "Active"));
          const querySnapshot = await getDocs(q).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
              path: 'campaigns',
              operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            // Return an empty snapshot to avoid breaking the app flow
            return { docs: [] };
          });

          const campaignsData = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                  id: doc.id,
                  name: data.name,
                  questions: data.questions || [],
                  reward: data.reward || "$1.00", // Default reward
                  brandName: data.brandName || "A Brand", // Default brand name
                  brandColor: data.brandColor || "bg-gray-500", // Default color
                  status: data.status,
              }
          }) as Campaign[];
          setAvailableSurveys(campaignsData);
        } catch (error: any) {
             // This will catch other errors, but permission errors are handled above
            console.error("Error fetching campaigns: ", error);
            if (!(error instanceof FirestorePermissionError)) {
                toast({
                    title: "Error fetching surveys",
                    description: "Could not retrieve available surveys.",
                    variant: "destructive"
                })
            }
        }
      }
    };

    if (!loading) {
        fetchCampaigns();
    }
  }, [user, loading, router, toast]);

  if (loading || !user) {
      return <div>Loading...</div>;
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
            <div className="text-2xl font-bold">$142.75</div>
            <p className="text-xs text-muted-foreground">
              + $12.50 from last week
            </p>
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
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">
              {availableSurveys.length} new surveys available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gold Tier</div>
            <p className="text-xs text-muted-foreground">
              Top 15% of responders
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-2xl font-headline font-bold tracking-tight mb-4">
          Available Surveys
        </h3>
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
      </div>
    </div>
  )
}
