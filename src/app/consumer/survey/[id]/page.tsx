
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@/app/(app)/dashboard/campaigns/page";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { LoaderCircle, ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type Question = {
    id: number;
    text: string;
    type: 'multiple-choice' | 'open-text';
    options: string[];
};

type Answers = {
    [key: number]: string;
}

export default function SurveyPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [user, authLoading, authError] = useAuthState(auth);

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        const fetchCampaign = async () => {
            if (authLoading) return;
            if (!user) {
                router.push('/login');
                return;
            }

            const campaignId = params.id as string;
            if (!campaignId) {
                toast({ title: "No campaign ID provided.", variant: "destructive" });
                router.push("/consumer/dashboard");
                return;
            }

            try {
                const docRef = doc(db, "campaigns", campaignId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const campaignData = docSnap.data() as Campaign;
                    setCampaign(campaignData);
                    setQuestions(campaignData.questions || []);
                } else {
                    toast({ title: "Survey not found.", variant: "destructive" });
                    router.push("/consumer/dashboard");
                }
            } catch (error) {
                console.error("Error fetching survey: ", error);
                toast({ title: "Error fetching survey data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [params.id, user, authLoading, router, toast]);

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!user || !campaign) return;
        setSubmitting(true);
        try {
            const campaignId = params.id as string;
            const responseData = {
                userId: user.uid,
                answers: answers,
                submittedAt: Timestamp.now(),
            };
            const responsesColRef = collection(db, `campaigns/${campaignId}/responses`);
            
            await addDoc(responsesColRef, responseData)
              .catch((serverError) => {
                  const permissionError = new FirestorePermissionError({
                      path: responsesColRef.path,
                      operation: 'create',
                      requestResourceData: responseData,
                  });
                  errorEmitter.emit('permission-error', permissionError);
                  throw permissionError; // Re-throw to be caught by outer catch block
              });

            setCompleted(true);
        } catch (error: any) {
            if (!(error instanceof FirestorePermissionError)) {
               toast({ title: "Failed to submit response", description: "Please try again.", variant: "destructive" });
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoaderCircle className="animate-spin h-8 w-8" />
            </div>
        );
    }
    
    if (!campaign) {
        return null; // Should be redirected by useEffect
    }

    if (completed) {
        return (
            <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                    <CardTitle>Survey Complete!</CardTitle>
                    <CardDescription>Thank you for your valuable feedback.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <PartyPopper className="h-16 w-16 text-green-500" />
                    <p>Your response has been submitted. Your account will be credited shortly.</p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/consumer/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const isAnswered = currentQuestion && answers[currentQuestion.id] && answers[currentQuestion.id].trim() !== '';

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{campaign.name}</CardTitle>
                <CardDescription>Please answer the following questions.</CardDescription>
                <div className="space-y-2 pt-4">
                    <Progress value={progress} />
                    <p className="text-sm text-muted-foreground text-center">Question {currentQuestionIndex + 1} of {questions.length}</p>
                </div>
            </CardHeader>
            <CardContent className="min-h-[200px]">
                {currentQuestion ? (
                    <div className="space-y-4">
                        <Label className="text-lg font-semibold">{currentQuestion.text}</Label>
                        {currentQuestion.type === 'multiple-choice' ? (
                            <RadioGroup
                                value={answers[currentQuestion.id] || ''}
                                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                                className="space-y-2"
                            >
                                {currentQuestion.options.map((option, index) => (
                                    <div key={index} className="flex items-center">
                                        <RadioGroupItem value={option} id={`q-${currentQuestion.id}-o-${index}`} />
                                        <Label htmlFor={`q-${currentQuestion.id}-o-${index}`} className="ml-2 cursor-pointer">{option}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        ) : (
                            <Textarea
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                placeholder="Type your answer here..."
                            />
                        )}
                    </div>
                ) : (
                     <Alert>
                        <AlertTitle>No Questions Found</AlertTitle>
                        <AlertDescription>This survey doesn't have any questions yet.</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                {currentQuestionIndex === questions.length - 1 ? (
                    <Button onClick={handleSubmit} disabled={!isAnswered || submitting}>
                        {submitting ? <LoaderCircle className="animate-spin" /> : "Submit"}
                    </Button>
                ) : (
                    <Button onClick={handleNext} disabled={!isAnswered}>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
