
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import {
      Table,
      TableHeader,
      TableRow,
      TableHead,
      TableBody,
      TableCell,
    } from "@/components/ui/table";
  import { Badge } from "@/components/ui/badge";
  import { CircleDollarSign, Gift } from "lucide-react";
  
  const rewardHistory = [
    { id: 1, date: "2024-05-28", description: "Starbucks Holiday Drink Survey", amount: "$3.50", type: "Survey Reward" },
    { id: 2, date: "2024-05-25", description: "Nike Sneaker Feedback", amount: "$2.00", type: "Survey Reward" },
    { id: 3, date: "2024-05-22", description: "PayPal Payout", amount: "-$10.00", type: "Withdrawal" },
    { id: 4, date: "2024-05-20", description: "Coca-Cola 'Spiced' Flavor Survey", amount: "$1.00", type: "Survey Reward" },
    { id: 5, date: "2024-05-18", description: "Apple iPhone Survey", amount: "$5.00", type: "Survey Reward" },
    { id: 6, date: "2024-05-15", description: "Signup Bonus", amount: "$1.00", type: "Bonus" },
  ];
  
  export default function RewardsPage() {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">
            Your Rewards
          </h2>
          <p className="text-muted-foreground">
            View your earnings history and available balance.
          </p>
        </div>
  
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Available Balance
                    </CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$42.75</div>
                    <p className="text-xs text-muted-foreground">
                    $10.00 minimum for payout
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Lifetime Earnings
                    </CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$142.75</div>
                    <p className="text-xs text-muted-foreground">
                    Keep it up!
                    </p>
                </CardContent>
            </Card>
        </div>
  
        <Card>
            <CardHeader>
                <CardTitle>Earnings History</CardTitle>
                <CardDescription>
                A log of all your rewards and payouts.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rewardHistory.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell>
                        <Badge
                            variant={
                            item.type === "Withdrawal" ? "destructive" : "secondary"
                            }
                            className="capitalize"
                        >
                            {item.type}
                        </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${item.amount.startsWith('-') ? 'text-destructive' : 'text-green-600'}`}>
                            {item.amount}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    )
  }
  