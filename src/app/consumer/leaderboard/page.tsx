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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

const leaderboardData = [
    { rank: 1, user: "Alex R.", points: 12580, avatar: "https://placehold.co/40x40.png" },
    { rank: 2, user: "Samantha G.", points: 11920, avatar: "https://placehold.co/40x40.png" },
    { rank: 3, user: "Mike L.", points: 11850, avatar: "https://placehold.co/40x40.png" },
    { rank: 4, user: "Consumer User", points: 11500, avatar: "https://placehold.co/40x40.png", isCurrentUser: true },
    { rank: 5, user: "Jessica W.", points: 11200, avatar: "https://placehold.co/40x40.png" },
    { rank: 6, user: "David C.", points: 10850, avatar: "https://placehold.co/40x40.png" },
    { rank: 7, user: "Emily T.", points: 10500, avatar: "https://placehold.co/40x40.png" },
    { rank: 8, user: "Chris P.", points: 10210, avatar: "https://placehold.co/40x40.png" },
    { rank: 9, user: "Fatima A.", points: 9980, avatar: "https://placehold.co/40x40.png" },
    { rank: 10, user: "Kevin H.", points: 9800, avatar: "https://placehold.co/40x40.png" },
];

export default function LeaderboardPage() {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">
            Leaderboard
          </h2>
          <p className="text-muted-foreground">
            See how you stack up against other top responders.
          </p>
        </div>
  
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    Top Responders - All Time
                </CardTitle>
                <CardDescription>
                Points are earned for completing surveys and providing quality responses.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[80px]">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboardData.map((player) => (
                        <TableRow key={player.rank} className={player.isCurrentUser ? "bg-primary/10" : ""}>
                            <TableCell className="font-bold text-lg">{player.rank}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={player.avatar} alt={player.user} />
                                        <AvatarFallback>{player.user.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{player.user}{player.isCurrentUser && " (You)"}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{player.points.toLocaleString()}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    )
  }
  