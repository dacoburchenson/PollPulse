
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield } from "lucide-react";

export default function BrandProfilePage() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

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
              {isClient && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Brand Name</Label>
                    <Input id="name" defaultValue="Acme Inc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="contact@acme.inc" />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
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
              {isClient && (
                <>
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                          <Label className="text-base">Campaign Summary Emails</Label>
                          <p className="text-sm text-muted-foreground">
                              Receive weekly summaries of your campaign performance.
                          </p>
                      </div>
                      <Switch defaultChecked />
                  </div>
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                          <Label className="text-base">Product Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified about new features and platform updates.
                          </p>
                      </div>
                      <Switch />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button>Update Privacy Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
