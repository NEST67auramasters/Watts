import { useTransactions } from "@/hooks/use-banking";
import { useUser } from "@/hooks/use-auth";
import { ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { data: user } = useUser();
  const { data: transactions, isLoading } = useTransactions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 mb-6 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user || !transactions) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 font-heading">Transaction History</h2>
        <p className="text-slate-500">A record of every penny sent and received.</p>
      </div>

      {transactions.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 rounded-3xl border-dashed">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <p className="text-lg">No transactions yet!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => {
            const isIncoming = tx.toUserId === user.id;
            
            return (
              <div 
                key={tx.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${
                    isIncoming ? 'bg-green-100 text-green-600 group-hover:bg-green-200' : 'bg-red-100 text-red-600 group-hover:bg-red-200'
                  }`}>
                    {isIncoming ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">
                      {tx.type === 'transfer' 
                        ? (isIncoming ? "Received Payment" : "Sent Payment")
                        : tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      {tx.description || (isIncoming ? "From User #" + tx.fromUserId : "To User #" + tx.toUserId)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end pl-16 sm:pl-0">
                   <p className={`text-xl font-bold ${isIncoming ? 'text-green-600' : 'text-slate-800'}`}>
                    {isIncoming ? "+" : "-"}${(tx.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 font-semibold">
                    {tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a') : 'Unknown Date'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
