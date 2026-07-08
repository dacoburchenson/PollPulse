"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
  } from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, Edit, Trash2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, deleteDoc, doc, Timestamp, query, where, getCountFromServer } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged } from "firebase/auth";


export type Campaign = {
    id: string;
    name: string;
    description?: string;
    audience?: string;
    responses: string;
    responseCount: number;
    status: "Active" | "Draft" | "Completed";
    startDate?: Date;
    endDate?: Date;
    questions?: any[];
    userId?: string;
};

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!user || authLoading) return;
            setPageLoading(true);

            try {
                const q = query(collection(db, "campaigns"), where("userId", "==", user.uid));
                const querySnapshot = await getDocs(q);
                const campaignsData: Campaign[] = [];

                for (const docSnap of querySnapshot.docs) {
                    const data = docSnap.data();
                    // Count actual responses for each campaign
                    let responseCount = 0;
                    try {
                        const countSnap = await getCountFromServer(
                            collection(db, "campaigns", docSnap.id, "responses")
                        );
                        responseCount = countSnap.data().count;
                    } catch {
                        // Responses subcollection may not exist yet
                    }

                    campaignsData.push({
                        id: docSnap.id,
                        name: data.name,
                        description: data.description,
                        audience: data.audience,
                        responses: responseCount.toString(),
                        responseCount,
                        status: data.status,
                        startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : undefined,
                        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : undefined,
                        questions: data.questions,
                    } as Campaign);
                }
                setCampaigns(campaignsData);
            } catch (error) {
                console.error("Error fetching campaigns: ", error);
                toast({
                    title: "Error fetching campaigns",
                    description: "Could not retrieve campaigns from the database.",
                    variant: "destructive"
                })
            } finally {
                setPageLoading(false);
            }
        };

        if (user && !authLoading) {
            fetchCampaigns();
        }
    }, [user, authLoading, toast]);

    const handleEdit = (id: string) => {
        router.push(`/dashboard/campaigns/edit/${id}`);
    }
    
    const handleViewReport = (id: string) => {
        router.push(`/dashboard/campaigns/${id}/report`);
    }

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteDoc(doc(db, "campaigns", deleteTarget));
            setCampaigns(prev => prev.filter(c => c.id !== deleteTarget));
            toast({
                title: "Campaign Deleted",
                description: "The campaign has been successfully deleted."
            })
        } catch (error) {
             console.error("Error deleting campaign: ", error);
             toast({
                title: "Error deleting campaign",
                description: "Could not delete the campaign from the database.",
                variant: "destructive"
            })
        } finally {
            setDeleteTarget(null);
        }
    }

  if (authLoading) {
    return <div className="p-8 text-muted-foreground">Loading campaigns...</div>
  }
  if (!user) {
    router.push('/login');
    return <div className="p-8 text-muted-foreground">Redirecting to login...</div>
  }


  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">
              Campaigns
            </h2>
            <p className="text-muted-foreground">
              Manage all your campaigns in one place.
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

        <Card>
          <CardHeader>
            <CardTitle>Your Campaigns</CardTitle>
            <CardDescription>
              A list of all your active, draft, and completed campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pageLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <p>No campaigns yet.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/campaigns/new">Create your first campaign</Link>
                </Button>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Responses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.startDate?.toLocaleDateString() || "--"}</TableCell>
                    <TableCell>{campaign.endDate?.toLocaleDateString() || "--"}</TableCell>
                    <TableCell className="text-right">{campaign.responseCount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === "Active"
                            ? "default"
                            : campaign.status === 'Completed' ? "secondary" : "outline"
                        }
                        className="capitalize"
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewReport(campaign.id)}>
                                <BarChart3 /> View Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(campaign.id)}>
                              <Edit /> Edit Campaign
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(campaign.id)}
                            >
                              <Trash2 /> Delete Campaign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this campaign and all of its responses.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
