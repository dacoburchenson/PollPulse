
"use client"

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Bot, LoaderCircle, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { generateQuestionsAction } from "../../new/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { GenerateQuestionsOutput } from "@/ai/flows/generate-questions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Campaign } from "../../page";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';


type Question = {
    id: number;
    text: string;
    type: 'multiple-choice' | 'open-text';
    options: string[];
}

type GeneratedQuestion = GenerateQuestionsOutput["questions"][0];

const initialState: {
  result: GenerateQuestionsOutput | null;
  error: string | null;
} = {
  result: null,
  error: null,
};


function GenerateButton({ hasGenerated }: { hasGenerated: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="animate-spin" /> : (hasGenerated ? <RefreshCw /> : <Bot />)}
      {hasGenerated ? "Regenerate" : "Generate Questions with AI"}
    </Button>
  );
}


export default function EditCampaignPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [user, loading, authError] = useAuthState(auth);

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [campaignName, setCampaignName] = useState("");
    const [campaignDescription, setCampaignDescription] = useState("");
    const [audience, setAudience] = useState("all");
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [status, setStatus] = useState<Campaign['status']>('Draft');

    const [campaignGoal, setCampaignGoal] = useState("");
    const [questions, setQuestions] = useState<Question[]>([
        { id: 1, text: '', type: 'multiple-choice', options: [''] }
    ]);
    const [selectedGeneratedQuestions, setSelectedGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const [state, formAction] = useActionState(generateQuestionsAction, initialState);
    const [isSaving, setIsSaving] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);

    useEffect(() => {
      const fetchCampaign = async () => {
        if (!user) {
          if(!loading) router.push('/login');
          return;
        }

        const campaignId = params.id as string;
        if (!campaignId) return;
        
        try {
            const docRef = doc(db, "campaigns", campaignId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const campaignData = docSnap.data();

                // Security check: ensure the user owns this campaign
                if (campaignData.userId !== user.uid) {
                    toast({ title: "Unauthorized", description: "You don't have permission to edit this campaign.", variant: "destructive" });
                    router.push('/dashboard/campaigns');
                    return;
                }

                const campaignToEdit: Campaign = {
                    id: docSnap.id,
                    ...campaignData,
                    startDate: campaignData.startDate instanceof Timestamp ? campaignData.startDate.toDate() : undefined,
                    endDate: campaignData.endDate instanceof Timestamp ? campaignData.endDate.toDate() : undefined,
                } as Campaign;

                setCampaign(campaignToEdit);
                setCampaignName(campaignToEdit.name);
                setCampaignDescription(campaignToEdit.description || "");
                setAudience(campaignToEdit.audience || "all");
                setStatus(campaignToEdit.status);
                setStartDate(campaignToEdit.startDate);
                setEndDate(campaignToEdit.endDate);
                setQuestions(campaignToEdit.questions || [{ id: 1, text: '', type: 'multiple-choice', options: [''] }]);
            } else {
                toast({ title: "Campaign not found", variant: "destructive" });
                router.push('/dashboard/campaigns');
            }
        } catch (error) {
            console.error("Error fetching campaign: ", error);
            toast({ title: "Error fetching campaign data", variant: "destructive" });
        }
      };

      if (!loading) {
          fetchCampaign();
      }
    }, [params.id, router, toast, user, loading]);

    const addQuestion = () => {
        setQuestions([...questions, { id: Date.now(), text: '', type: 'multiple-choice', options: [''] }]);
    };

    const removeQuestion = (id: number) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleQuestionChange = (id: number, field: 'text' | 'type', value: string) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value, options: value === 'open-text' ? [] : q.options } : q));
    };

    const handleOptionChange = (qId: number, oIndex: number, value: string) => {
        setQuestions(questions.map(q => q.id === qId ? { ...q, options: q.options.map((o, i) => i === oIndex ? value : o) } : q));
    };

    const addOption = (qId: number) => {
        setQuestions(questions.map(q => q.id === qId ? { ...q, options: [...q.options, ''] } : q));
    };

    const removeOption = (qId: number, oIndex: number) => {
        setQuestions(questions.map(q => q.id === qId ? { ...q, options: q.options.filter((o, i) => i !== oIndex) } : q));
    };

    const handleSubmit = async (e: React.FormEvent, newStatus?: Campaign['status']) => {
        e.preventDefault();
        if (!campaign || !user) return;

        const isLaunchingFlow = newStatus === 'Active';
        if (isLaunchingFlow) {
            setIsLaunching(true);
        } else {
            setIsSaving(true);
        }
        
        const finalStatus = newStatus || status;

        try {
            const campaignRef = doc(db, "campaigns", campaign.id);
            await updateDoc(campaignRef, {
                name: campaignName,
                description: campaignDescription,
                audience: audience,
                status: finalStatus,
                startDate: startDate ? Timestamp.fromDate(startDate) : null,
                endDate: endDate ? Timestamp.fromDate(endDate) : null,
                questions: questions,
                // No need to update userId, it's set on creation
            });

            toast({
                title: "Campaign Updated!",
                description: "Your campaign has been successfully updated.",
            });
            router.push("/dashboard/campaigns");

        } catch (error) {
            console.error("Error updating document: ", error);
             toast({
                title: "Error updating campaign",
                description: "Could not update the campaign in the database.",
                variant: "destructive"
            });
        } finally {
            if (isLaunchingFlow) {
                setIsLaunching(false);
            } else {
                setIsSaving(false);
            }
        }
    };
    
    const handleGeneratedQuestionSelect = (question: GeneratedQuestion, checked: boolean) => {
        setSelectedGeneratedQuestions(prev => 
            checked ? [...prev, question] : prev.filter(q => q.text !== question.text)
        );
    };

    const handleAddSelectedQuestions = () => {
        if (selectedGeneratedQuestions.length > 0) {
            const newQuestions = selectedGeneratedQuestions.map(q => ({
                id: Date.now() + Math.random(), // ensure unique id
                text: q.text,
                type: q.type,
                options: q.type === 'multiple-choice' ? q.options : [],
            }));
            const filteredOldQuestions = questions.filter(q => q.text.trim() !== "");
            setQuestions([...filteredOldQuestions, ...newQuestions]);
            toast({
                title: "Questions Added!",
                description: `${newQuestions.length} AI-generated question(s) have been added.`,
            });
            setSelectedGeneratedQuestions([]);
            state.result = null; 
        }
    }

  if (loading || !campaign) {
    return <div>Loading...</div>
  }
  
  if (!user) {
    return <div>Please log in to edit campaigns</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <form>
            <div>
                <h2 className="text-3xl font-headline font-bold tracking-tight">Edit Campaign</h2>
                <p className="text-muted-foreground">
                    Make changes to your campaign configuration and questions.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>Provide a name, description, and target audience for your campaign.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input id="campaign-name" placeholder="e.g., Spring Collection Feedback" required value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="campaign-description">Description</Label>
                    <Textarea id="campaign-description" placeholder="Briefly describe the goal of this campaign." value={campaignDescription} onChange={(e) => setCampaignDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="audience-segment">Target Audience</Label>
                    <Select value={audience} onValueChange={setAudience}>
                        <SelectTrigger id="audience-segment">
                        <SelectValue placeholder="Select an audience segment" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="frequent-shoppers">Frequent Shoppers</SelectItem>
                        <SelectItem value="new-subscribers">New Subscribers</SelectItem>
                        <SelectItem value="lapsed-customers">Lapsed Customers</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={(value: Campaign['status']) => setStatus(value)}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </form>

        <Card>
            <CardHeader>
                <CardTitle>AI-Powered Question Generation</CardTitle>
                <CardDescription>Describe the goal of your campaign, and let our AI suggest relevant questions based on best practices in brand research.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="campaign-goal">Campaign Goal</Label>
                        <Textarea 
                            id="campaign-goal" 
                            name="campaignGoal"
                            value={campaignGoal}
                            onChange={(e) => setCampaignGoal(e.target.value)}
                            placeholder="e.g., To understand if consumers like the new red stripe bottle design." 
                            required 
                        />
                    </div>
                    <div className="flex justify-end">
                       <GenerateButton hasGenerated={!!state.result} />
                    </div>
                </form>
            </CardContent>
        </Card>

        {state.error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
            </Alert>
        )}

        {state.result && state.result.questions.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>AI-Generated Questions</CardTitle>
                    <CardDescription>Here are some questions suggested by our AI. Select the ones you want to add to your campaign.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {state.result.questions.map((q, index) => (
                           <div key={index} className="flex items-start gap-3 p-3 rounded-md border bg-muted/20">
                                <Checkbox 
                                    id={`gen-q-${index}`} 
                                    onCheckedChange={(checked) => handleGeneratedQuestionSelect(q, !!checked)}
                                    checked={selectedGeneratedQuestions.some(sq => sq.text === q.text)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor={`gen-q-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                         <span className="font-semibold text-foreground">{q.text}</span>
                                    </label>
                                    {q.type === 'multiple-choice' && (
                                        <p className="text-sm text-muted-foreground italic"> (Options: {q.options.join(', ')})</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleAddSelectedQuestions} disabled={selectedGeneratedQuestions.length === 0}>
                        Add Selected Questions
                    </Button>
                </CardFooter>
            </Card>
        )}


        <Card>
            <CardHeader>
                <CardTitle>Campaign Questions</CardTitle>
                <CardDescription>Add and edit the questions you want to ask your audience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={q.id} className="p-4 border rounded-lg space-y-4 relative">
                        <div className="space-y-2">
                            <Label htmlFor={`q-text-${q.id}`}>Question {qIndex + 1}</Label>
                            <Input id={`q-text-${q.id}`} value={q.text} onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} placeholder="e.g., What is your favorite color?" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`q-type-${q.id}`}>Question Type</Label>
                             <Select value={q.type} onValueChange={(value: 'multiple-choice' | 'open-text') => handleQuestionChange(q.id, 'type', value)}>
                                <SelectTrigger id={`q-type-${q.id}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="open-text">Open Text</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {q.type === 'multiple-choice' && (
                            <div className="space-y-2 pl-4 border-l-2">
                                <Label>Options</Label>
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <Input value={opt} onChange={e => handleOptionChange(q.id, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} required />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(q.id, oIndex)} disabled={q.options.length <= 1}>
                                            <Trash2 className="text-destructive h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => addOption(q.id)}>Add Option</Button>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeQuestion(q.id)}
                            disabled={questions.length <= 1}
                        >
                            <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                    </div>
                ))}

                <Button type="button" variant="outline" onClick={addQuestion}>
                    <PlusCircle />
                    Add Question
                </Button>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.push('/dashboard/campaigns')} disabled={isSaving || isLaunching}>Cancel</Button>
            <Button type="button" onClick={(e) => handleSubmit(e)} disabled={isSaving || isLaunching}>
                 {isSaving ? <LoaderCircle className="animate-spin" /> : null}
                Save Changes</Button>
            {status === 'Draft' && <Button type="button" onClick={(e) => handleSubmit(e, "Active")} disabled={isSaving || isLaunching}>
                 {isLaunching ? <LoaderCircle className="animate-spin" /> : null}
                Launch Campaign</Button>}
        </div>
      </div>
  );
}
