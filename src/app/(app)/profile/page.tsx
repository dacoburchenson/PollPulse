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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, LoaderCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged } from "firebase/auth";

export default function BrandProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [campaignEmails, setCampaignEmails] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setEmail(firebaseUser.email || "");
        setBrandName(firebaseUser.displayName || "");
        
        // Load profile from Firestore
        try {
          const profileDoc = await getDoc(doc(db, "userProfiles", firebaseUser.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            if (data.displayName) setBrandName(data.displayName);
            if (data.campaignEmails !== undefined) setCampaignEmails(data.campaignEmails);
            if (data.productUpdates !== undefined) setProductUpdates(data.productUpdates);
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "userProfiles", user.uid), {
        displayName: brandName,
        email: email,
        campaignEmails,
        productUpdates,
        userType: "brand",
      }, { merge: true });
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    } catch (err) {
      toast({ title: "Error saving profile", description: "Could not save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <LoaderCircle className="animate-spin mr-2" /> Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold tracking-tight">Your Profile</h2>
        <p className="text-muted-foreground">
          Manage your brand information and privacy settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4"/>Profile</TabsTrigger>
          <TabsTrigger value="privacy"><Shield className="mr-2 h-4 w-4"/>Privacy</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>
                Update your brand name and contact email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input id="name" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Your brand name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <LoaderCircle className="animate-spin mr-2" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Notifications</CardTitle>
              <CardDescription>
                Manage your privacy preferences and how we contact you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                      <Label className="text-base">Campaign Summary Emails</Label>
                      <p className="text-sm text-muted-foreground">
                          Receive weekly summaries of your campaign performance.
                      </p>
                  </div>
                  <Switch checked={campaignEmails} onCheckedChange={setCampaignEmails} />
              </div>
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                      <Label className="text-base">Product Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new features and platform updates.
                      </p>
                  </div>
                  <Switch checked={productUpdates} onCheckedChange={setProductUpdates} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <LoaderCircle className="animate-spin mr-2" />}
                Update Privacy Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
