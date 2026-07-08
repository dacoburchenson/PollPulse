
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { User, Mail, Lock, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [userType, setUserType] = useState("consumer");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        toast({
            title: "Account Created!",
            description: "Welcome to PollPulse.",
        });
        
        if (userType === 'brand') {
            router.push('/dashboard');
        } else {
            router.push('/consumer/dashboard');
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            toast({
                title: "Login Successful!",
                description: "Welcome back.",
            });
            if (userType === "brand") {
                router.push('/dashboard');
            } else {
                router.push('/consumer/dashboard');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }


  return (
    <>
        <form onSubmit={handleSignup} className="space-y-6">
           {isClient && (
            <>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="mt-2 relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" name="name" type="text" autoComplete="name" required className="pl-10" placeholder="John Doe"/>
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <div className="mt-2 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" name="email" type="email" autoComplete="email" required className="pl-10" placeholder="you@example.com"/>
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" name="password" type="password" required className="pl-10" placeholder="••••••••"/>
                </div>
              </div>

              <div>
                  <Label>I am a...</Label>
                  <RadioGroup value={userType} onValueChange={setUserType} className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                          <Label htmlFor="consumer" className="flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
                              <RadioGroupItem value="consumer" id="consumer" />
                              Consumer
                          </Label>
                      </div>
                      <div>
                          <Label htmlFor="brand" className="flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
                              <RadioGroupItem value="brand" id="brand" />
                              Brand
                          </Label>
                      </div>
                  </RadioGroup>
              </div>
            </>
           )}
            
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Signup Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div>
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading && <LoaderCircle className="animate-spin" />}
                Create account
              </Button>
            </div>
        </form>

        <div className="mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <div className="mt-6">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                    {loading && <LoaderCircle className="animate-spin" />}
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 173.5 58.5l-65.2 65.2C314.5 99.8 282.7 80 248 80c-81.6 0-148.2 66.6-148.2 148.2s66.6 148.2 148.2 148.2c87.7 0 129.2-61.2 133.8-93.5H248v-73.6h236.2c2.4 12.7 3.8 26.1 3.8 40.2z"></path></svg>
                    Google
                </Button>
            </div>
        </div>
        <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
                Already a member?{' '}
                <Link href="/login" className="font-medium text-primary hover:text-primary/90">
                Sign in
                </Link>
            </p>
        </div>
    </>
  );
}
