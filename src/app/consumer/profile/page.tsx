
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
import { User, Wallet, Shield, Users, Heart, ShoppingBag, Tv, LoaderCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const interestCategories = [
    { id: "tech", label: "Technology & Electronics" },
    { id: "fashion", label: "Fashion & Apparel" },
    { id: "health", label: "Health & Wellness" },
    { id: "food", label: "Food & Beverages" },
    { id: "home", label: "Home & Garden" },
    { id: "auto", label: "Automotive" },
    { id: "travel", label: "Travel & Hospitality" },
    { id: "media", label: "Entertainment & Media" },
    { id: "finance", label: "Financial Services" },
    { id: "beauty", label: "Beauty & Personal Care" },
    { id: "sports", label: "Sports & Fitness" },
    { id: "education", label: "Education" },
];

const socialPlatforms = [
    { id: "facebook", label: "Facebook" },
    { id: "instagram", label: "Instagram" },
    { id: "twitter", label: "Twitter/X" },
    { id: "tiktok", label: "TikTok" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "youtube", label: "YouTube" },
    { id: "snapchat", label: "Snapchat" },
    { id: "pinterest", label: "Pinterest" },
    { id: "none", label: "None" },
];

const devices = [
    { id: "smartphone", label: "Smartphone" },
    { id: "computer", label: "Laptop/Desktop computer" },
    { id: "tablet", label: "Tablet" },
    { id: "smarttv", label: "Smart TV" },
    { id: "wearable", label: "Smartwatch/wearable" },
];

const influences = [
    { id: "price", label: "Price/value" },
    { id: "quality", label: "Product quality" },
    { id: "brand", label: "Brand reputation" },
    { id: "reviews", label: "Reviews and ratings" },
    { id: "sustainability", label: "Sustainability/ethics" },
    { id: "convenience", label: "Convenience" },
    { id: "innovation", label: "Innovation/new features" },
    { id: "service", label: "Customer service" },
];

const priorities = [
    { id: "sustainability", label: "Environmental sustainability" },
    { id: "social", label: "Social responsibility" },
    { id: "diversity", label: "Diversity and inclusion" },
    { id: "privacy", label: "Data privacy and security" },
    { id: "local", label: "Local/community support" },
    { id: "transparency", label: "Transparency and honesty" },
    { id: "tech", label: "Innovation and technology" },
    { id: "value", label: "Value for money" },
];

type UserProfile = {
    ageRange?: string;
    gender?: string;
    location?: string;
    income?: string;
    interests?: string[];
    shoppingFrequency?: string;
    householdShoppingFrequency?: string;
    preferredShopping?: string;
    shoppingApproach?: string;
    purchaseInfluences?: string[];
    productDiscovery?: string;
    brandCommunication?: string;
    socialMedia?: string[];
    devices?: string[];
    brandPriorities?: string[];
};


export default function ConsumerProfilePage() {
    const [user, loading, error] = useAuthState(auth);
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);
    const [profile, setProfile] = React.useState<UserProfile>({});

    React.useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const docRef = doc(db, "userProfiles", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile);
                }
            }
        };
        if (!loading) {
            fetchProfile();
        }
    }, [user, loading]);


    const handleSingleSelectChange = (field: keyof UserProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleMultiSelectChange = (field: keyof UserProfile, value: string, isChecked: boolean) => {
        setProfile(prev => {
            const existing = (prev[field] as string[] || []) as string[];
            if (isChecked) {
                return { ...prev, [field]: [...existing, value] };
            } else {
                return { ...prev, [field]: existing.filter(item => item !== value) };
            }
        });
    };

    const handleSaveChanges = async () => {
        if (!user) {
            toast({ title: "You must be logged in to save.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        const docRef = doc(db, "userProfiles", user.uid);
        const profileData = { 
            ...profile,
            updatedAt: Timestamp.now()
        };

        setDoc(docRef, profileData, { merge: true })
            .then(() => {
                toast({
                    title: "Profile Updated!",
                    description: "Your information has been successfully saved.",
                });
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: profileData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSaving(false);
            });
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64"><LoaderCircle className="animate-spin h-8 w-8" /></div>
    }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold tracking-tight">Your Profile</h2>
        <p className="text-muted-foreground">
          Manage your personal information, payout methods, and privacy settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4"/>Profile</TabsTrigger>
          <TabsTrigger value="payout"><Wallet className="mr-2 h-4 w-4"/>Payout</TabsTrigger>
          <TabsTrigger value="privacy"><Shield className="mr-2 h-4 w-4"/>Privacy</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Demographic & Lifestyle Information</CardTitle>
              <CardDescription>
                This information must be completed to access surveys. It helps us find relevant opportunities for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                
                {/* Demographics */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg flex items-center"><Users className="mr-2 h-5 w-5" /> Demographics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>What is your age range?</Label>
                            <Select required value={profile.ageRange} onValueChange={(v) => handleSingleSelectChange('ageRange', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="18-24">18-24</SelectItem>
                                    <SelectItem value="25-34">25-34</SelectItem>
                                    <SelectItem value="35-44">35-44</SelectItem>
                                    <SelectItem value="45-54">45-54</SelectItem>
                                    <SelectItem value="55-64">55-64</SelectItem>
                                    <SelectItem value="65+">65+</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>What is your gender identity?</Label>
                            <Select required value={profile.gender} onValueChange={(v) => handleSingleSelectChange('gender', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="non-binary">Non-binary</SelectItem>
                                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Where do you live?</Label>
                            <Select required value={profile.location} onValueChange={(v) => handleSingleSelectChange('location', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="urban">Urban area</SelectItem>
                                    <SelectItem value="suburban">Suburban area</SelectItem>
                                    <SelectItem value="rural">Rural area</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Monthly household income (JMD)?</Label>
                            <Select required value={profile.income} onValueChange={(v) => handleSingleSelectChange('income', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="<45k">Under $45,000</SelectItem>
                                    <SelectItem value="45k-100k">$45,000-$100,000</SelectItem>
                                    <SelectItem value="100k-200k">$100,000-$200,000</SelectItem>
                                    <SelectItem value="200k-300k">$200,000-$300,000</SelectItem>
                                    <SelectItem value=">300k">Over $300,000</SelectItem>
                                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                
                {/* Lifestyle & Interests */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg flex items-center"><Heart className="mr-2 h-5 w-5" /> Lifestyle & Interests</h3>
                    <div className="space-y-2">
                        <Label>Which categories are you interested in? (Select all that apply)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {interestCategories.map(cat => (
                                <div key={cat.id} className="flex items-center space-x-2">
                                    <Checkbox id={`interest-${cat.id}`} checked={profile.interests?.includes(cat.id)} onCheckedChange={(c) => handleMultiSelectChange('interests', cat.id, !!c)} />
                                    <Label htmlFor={`interest-${cat.id}`} className="text-sm font-normal">{cat.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>How often do you shop online?</Label>
                        <Select required value={profile.shoppingFrequency} onValueChange={(v) => handleSingleSelectChange('shoppingFrequency', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="several-weekly">Several times a week</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="rarely">Rarely</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Consumer Behavior */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg flex items-center"><ShoppingBag className="mr-2 h-5 w-5" /> Consumer Behavior</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>How often do you shop for household needs?</Label>
                            <Select required value={profile.householdShoppingFrequency} onValueChange={(v) => handleSingleSelectChange('householdShoppingFrequency', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>What is your preferred way to shop?</Label>
                            <Select required value={profile.preferredShopping} onValueChange={(v) => handleSingleSelectChange('preferredShopping', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="online">Online/website</SelectItem>
                                    <SelectItem value="mobile-app">Mobile app</SelectItem>
                                    <SelectItem value="in-store">In-store</SelectItem>
                                    <SelectItem value="mixed">Mix of online and in-store</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>What best describes your shopping approach?</Label>
                            <Select required value={profile.shoppingApproach} onValueChange={(v) => handleSingleSelectChange('shoppingApproach', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="research">I research extensively before buying</SelectItem>
                                    <SelectItem value="compare">I compare a few options</SelectItem>
                                    <SelectItem value="quick">I buy what I need quickly</SelectItem>
                                    <SelectItem value="impulse">I'm an impulse shopper</SelectItem>
                                    <SelectItem value="sales">I wait for sales and deals</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>How do you prefer to discover new products?</Label>
                            <Select required value={profile.productDiscovery} onValueChange={(v) => handleSingleSelectChange('productDiscovery', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="social">Social media</SelectItem>
                                    <SelectItem value="ads">Online ads</SelectItem>
                                    <SelectItem value="wom">Word of mouth/recommendations</SelectItem>
                                    <SelectItem value="search">Search engines</SelectItem>
                                    <SelectItem value="email">Email newsletters</SelectItem>
                                    <SelectItem value="tv">TV/traditional media</SelectItem>
                                    <SelectItem value="instore">In-store browsing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>What influences your purchasing decisions most? (Select top 3)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {influences.map(inf => (
                                <div key={inf.id} className="flex items-center space-x-2">
                                    <Checkbox id={`influence-${inf.id}`} checked={profile.purchaseInfluences?.includes(inf.id)} onCheckedChange={(c) => handleMultiSelectChange('purchaseInfluences', inf.id, !!c)} />
                                    <Label htmlFor={`influence-${inf.id}`} className="text-sm font-normal">{inf.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>How do you prefer to hear from brands?</Label>
                        <Select required value={profile.brandCommunication} onValueChange={(v) => handleSingleSelectChange('brandCommunication', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="sms">SMS/text messages</SelectItem>
                                <SelectItem value="push">App Push notifications</SelectItem>
                                <SelectItem value="social">Social media</SelectItem>
                                <SelectItem value="mail">Direct mail</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Media & Technology */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg flex items-center"><Tv className="mr-2 h-5 w-5" /> Media & Technology</h3>
                     <div className="space-y-2">
                        <Label>Which social media platforms do you use regularly? (Select all that apply)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {socialPlatforms.map(platform => (
                                <div key={platform.id} className="flex items-center space-x-2">
                                    <Checkbox id={`social-${platform.id}`} checked={profile.socialMedia?.includes(platform.id)} onCheckedChange={(c) => handleMultiSelectChange('socialMedia', platform.id, !!c)} />
                                    <Label htmlFor={`social-${platform.id}`} className="text-sm font-normal">{platform.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>What devices do you use most? (Select all that apply)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {devices.map(device => (
                                <div key={device.id} className="flex items-center space-x-2">
                                    <Checkbox id={`device-${device.id}`} checked={profile.devices?.includes(device.id)} onCheckedChange={(c) => handleMultiSelectChange('devices', device.id, !!c)} />
                                    <Label htmlFor={`device-${device.id}`} className="text-sm font-normal">{device.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Values & Priorities */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg flex items-center"><Heart className="mr-2 h-5 w-5" /> Values & Priorities</h3>
                     <div className="space-y-2">
                        <Label>What matters most to you when engaging with brands? (Rank top 3)</Label>
                        <p className="text-sm text-muted-foreground">This question type (ranking) will be supported soon.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {priorities.map(p => (
                                <div key={p.id} className="flex items-center space-x-2">
                                    <Checkbox id={`priority-${p.id}`} checked={profile.brandPriorities?.includes(p.id)} onCheckedChange={(c) => handleMultiSelectChange('brandPriorities', p.id, !!c)} />
                                    <Label htmlFor={`priority-${p.id}`} className="text-sm font-normal">{p.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <LoaderCircle className="animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="payout">
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>
                Choose how you want to receive your earnings. Minimum payout is $10.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Select Payout Method</Label>
                    <Select defaultValue="paypal">
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="mobile-credit">Mobile Phone Credit (Digicel/Flow)</SelectItem>
                            <SelectItem value="charity">Charity Donation</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              <div className="space-y-2">
                <Label htmlFor="payout-detail">Payout Detail</Label>
                <Input id="payout-detail" type="text" placeholder="Your PayPal email or Phone Number"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="charity-select">Select Charity (if applicable)</Label>
                <Select>
                    <SelectTrigger id="charity-select">
                        <SelectValue placeholder="Choose a charity to support" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unicef">UNICEF</SelectItem>
                        <SelectItem value="red-cross">Red Cross</SelectItem>
                        <SelectItem value="wwf">World Wildlife Fund</SelectItem>
                         <SelectItem value="local-food-bank">Local Food Bank</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges}>Save Payout Settings</Button>
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
                        <Label className="text-base">Enable Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Get notified instantly when new surveys are available.
                        </p>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Allow Location-based Surveys</Label>
                        <p className="text-sm text-muted-foreground">
                           Receive hyper-local surveys based on your location.
                        </p>
                    </div>
                    <Switch />
                </div>
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Targeted Advertising</Label>
                        <p className="text-sm text-muted-foreground">
                           Allow us to use your anonymized data for ad targeting.
                        </p>
                    </div>
                    <Switch defaultChecked />
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges}>Update Privacy Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    

    

    