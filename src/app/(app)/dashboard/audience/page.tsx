"use client";

import { useState } from "react";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from "lucide-react";

type Segment = {
    id: number;
    name: string;
    size: string;
    status: "Active" | "Inactive" | "Archived";
};

const initialAudienceSegments: Segment[] = [
    { id: 1, name: "Frequent Shoppers", size: "12,450", status: "Active" },
    { id: 2, name: "New Subscribers", size: "5,820", status: "Active" },
    { id: 3, name: "Lapsed Customers", size: "2,180", status: "Inactive" },
    { id: 4, name: "High-Value Clients", size: "850", status: "Active" },
    { id: 5, name: "Gen Z - Urban", size: "25,300", status: "Active" },
    { id: 6, name: "Millennials - Tech Savvy", size: "18,900", status: "Archived" },
];

export default function AudiencePage() {
    const [segments, setSegments] = useState<Segment[]>(initialAudienceSegments);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingSegmentId, setDeletingSegmentId] = useState<number | null>(null);

    const handleOpenCreateDialog = () => {
        setEditingSegment(null);
        setIsDialogOpen(true);
    };

    const handleOpenEditDialog = (segment: Segment) => {
        setEditingSegment(segment);
        setIsDialogOpen(true);
    };

    const handleOpenDeleteDialog = (id: number) => {
        setDeletingSegmentId(id);
        setIsDeleteDialogOpen(true);
    };
    
    const handleDeleteSegment = () => {
        if (deletingSegmentId !== null) {
            setSegments(segments.filter((s) => s.id !== deletingSegmentId));
            setDeletingSegmentId(null);
        }
        setIsDeleteDialogOpen(false);
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const status = formData.get("status") as Segment["status"];

        if (editingSegment) {
            // Update existing segment
            setSegments(
                segments.map((s) =>
                    s.id === editingSegment.id ? { ...s, name, status } : s
                )
            );
        } else {
            // Create new segment
            const newSegment: Segment = {
                id: Math.max(...segments.map(s => s.id), 0) + 1,
                name,
                status,
                size: (Math.floor(Math.random() * 20000) + 1000).toLocaleString(), // Random size for demo
            };
            setSegments([...segments, newSegment]);
        }
        setIsDialogOpen(false);
        setEditingSegment(null);
    };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">
              Audience Management
            </h2>
            <p className="text-muted-foreground">
              Create, manage, and analyze your audience segments.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleOpenCreateDialog}>
              <PlusCircle />
              Create New Segment
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audience Segments</CardTitle>
            <CardDescription>
              A list of your saved audience segments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment Name</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">{segment.name}</TableCell>
                    <TableCell className="text-right">{segment.size}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          segment.status === "Active"
                            ? "default"
                            : segment.status === 'Inactive' ? "destructive" : "secondary"
                        }
                        className="capitalize"
                      >
                        {segment.status}
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
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(segment)}>
                              <Edit /> Edit Segment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleOpenDeleteDialog(segment.id)}
                            >
                              <Trash2 /> Delete Segment
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSegment ? "Edit Segment" : "Create New Segment"}</DialogTitle>
              <DialogDescription>
                {editingSegment ? "Make changes to your existing segment." : "Add a new segment to your audience list."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingSegment?.name}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select name="status" defaultValue={editingSegment?.status ?? "Active"}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingSegment ? "Save Changes" : "Create Segment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this audience segment.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSegment}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
