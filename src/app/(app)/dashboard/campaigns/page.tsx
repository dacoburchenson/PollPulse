
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, deleteDoc, doc, Timestamp, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';


export type Campaign = {
    id: string; // Firestore document ID
    name: string;
    description?: string;
    audience?: string;
    responses: string;
    status: "Active" | "Draft" | "Completed";
    startDate?: Date;
    endDate?: Date;
    questions?: any[];
    userId?: string;
};

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [user, loading, error] = useAuthState(auth);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!user) {
                if(!loading) {
                    router.push("/login");
                }
                return;
            };

            try {
                const q = query(collection(db, "campaigns"), where("userId", "==", user.uid));
                const querySnapshot = await getDocs(q);
                const campaignsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name,
                        description: data.description,
                        audience: data.audience,
                        responses: data.responses || "0",
                        status: data.status,
                        startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : undefined,
                        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : undefined,
                        questions: data.questions,
                    }
                }) as Campaign[];
                setCampaigns(campaignsData);
            } catch (error) {
                console.error("Error fetching campaigns: ", error);
                toast({
                    title: "Error fetching campaigns",
                    description: "Could not retrieve campaigns from the database.",
                    variant: "destructive"
                })
            }
        };

        if(user && !loading) {
            fetchCampaigns();
        }

    }, [user, loading, router, toast]);

    const handleEdit = (id: string) => {
        router.push(`/dashboard/campaigns/edit/${id}`);
    }
    
    const handleViewReport = (id: string) => {
        router.push(`/dashboard/campaigns/${id}/report`);
    }

    const handleDelete = async (id: string) => {
        if(confirm("Are you sure you want to delete this campaign?")) {
            try {
                await deleteDoc(doc(db, "campaigns", id));
                const updatedCampaigns = campaigns.filter(c => c.id !== id);
                setCampaigns(updatedCampaigns);
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
            }
        }
    }

  if (loading) {
    return <div>Loading campaigns...</div>
  }
  if (!user) {
    return <div>Redirecting to login...</div>
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
                    <TableCell>{campaign.startDate?.toLocaleDateString()}</TableCell>
                    <TableCell>{campaign.endDate?.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{campaign.responses}</TableCell>
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
                              onClick={() => handleDelete(campaign.id)}
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
