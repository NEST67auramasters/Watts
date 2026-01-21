import { useUser } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-banking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowUpRight, ArrowDownLeft, DollarSign, TrendingUp, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: transactions, isLoading: isTxLoading } = useTransactions();

  if (isUserLoading || isTxLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  const recentTransactions = transactions?.slice(0, 5) || [];
  
  // Credit Score Color Logic
  const getScoreColor = (score: number) => {
    if (score >= 750) return "bg-green-500";
    if (score >= 650) return "bg-blue-500";
    if (score >= 550) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreText = (score: number) => {
    if (score >= 750) return "Excellent!";
    if (score >= 650) return "Good";
    if (score >= 550) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 font-heading">
            Hi, {user.username}! 👋
          </h2>
          <p className="text-slate-500">Here's what's happening with your money.</p>
        </div>
        <Link href="/transfer">
          <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 btn-bouncy">
            Send Money <ArrowUpRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Balance Card */}
        <Card className="rounded-3xl border-none shadow-xl shadow-indigo-100 bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <DollarSign className="w-32 h-32" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-indigo-100 text-lg font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-bold tracking-tight mb-2">
              ${(user.balance / 100).toFixed(2)}
            </div>
            <p className="text-indigo-100 bg-white/10 inline-block px-3 py-1 rounded-full text-sm backdrop-blur-sm">
              Available to spend
            </p>
          </CardContent>
        </Card>

        {/* Credit Score Card */}
        <Card className="rounded-3xl border-slate-100 shadow-lg bg-white card-hover">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-slate-500 text-lg font-medium">Credit Score</CardTitle>
            <ShieldCheck className="w-6 h-6 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-4">
              <span className={`text-5xl font-bold ${getScoreColor(user.creditScore).replace("bg-", "text-")}`}>
                {user.creditScore}
              </span>
              <span className="text-slate-400 font-semibold mb-2">/ 850</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">Status: {getScoreText(user.creditScore)}</span>
                <span className="text-slate-400">Target: 800</span>
              </div>
              <Progress value={(user.creditScore / 850) * 100} className="h-3 rounded-full bg-slate-100" indicatorClassName={getScoreColor(user.creditScore)} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="rounded-3xl border-slate-100 shadow-lg bg-white card-hover hidden md:block">
          <CardHeader>
            <CardTitle className="text-slate-500 text-lg font-medium">Financial Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-2xl">
              <div className="bg-green-100 p-2 rounded-xl text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-700">Good Standing</p>
                <p className="text-xs text-slate-500">Keep it up!</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Paying back loans on time increases your credit score. Missing payments will lower it!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">Recent Activity</h3>
          <Link href="/history">
            <Button variant="ghost" className="text-primary hover:text-primary/80">View All</Button>
          </Link>
        </div>

        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p>No transactions yet.</p>
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tx.toUserId === user.id ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.toUserId === user.id ? <ArrowDownLeft /> : <ArrowUpRight />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">
                      {tx.type === 'transfer' 
                        ? (tx.toUserId === user.id ? "Received money" : "Sent money")
                        : tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </p>
                    <p className="text-sm text-slate-500">{tx.description || "No description"}</p>
                  </div>
                </div>
                <div className={`font-bold text-lg ${
                  tx.toUserId === user.id ? 'text-green-600' : 'text-slate-800'
                }`}>
                  {tx.toUserId === user.id ? "+" : "-"}${(tx.amount / 100).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-4">
      <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}
