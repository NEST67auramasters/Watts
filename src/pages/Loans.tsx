import { useState } from "react";
import { useUser } from "@/hooks/use-auth";
import { useLoans, useApplyLoan, useRepayLoan } from "@/hooks/use-banking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Wallet, CheckCircle2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function Loans() {
  const { data: user } = useUser();
  const { data: loans, isLoading } = useLoans();
  const { mutate: apply, isPending: isApplying } = useApplyLoan();
  const { mutate: repay, isPending: isRepaying } = useRepayLoan();
  const { toast } = useToast();

  const [applyAmount, setApplyAmount] = useState("");
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const activeLoans = loans?.filter(l => l.status === "active") || [];
  const paidLoans = loans?.filter(l => l.status === "paid") || [];

  const handleApply = () => {
    const amount = parseFloat(applyAmount);
    if (!amount || amount <= 0) return;

    apply({ amount: Math.round(amount * 100) }, {
      onSuccess: () => {
        setIsApplyOpen(false);
        setApplyAmount("");
        toast({
          title: "Loan Approved!",
          description: "Funds have been added to your balance.",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      },
      onError: () => {
        toast({
          title: "Application Failed",
          description: "Something went wrong.",
          variant: "destructive",
        });
      }
    });
  };

  const handleRepay = (loanId: number, remainingAmount: number) => {
    // For simplicity, repay full remaining amount
    repay({ id: loanId, amount: remainingAmount }, {
      onSuccess: () => {
        toast({
          title: "Loan Repaid! 🎉",
          description: "Great job clearing your debt!",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      },
      onError: (error) => {
        toast({
          title: "Repayment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) return <div>Loading loans...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 font-heading">Loans & Credit</h2>
          <p className="text-slate-500">Borrow money wisely. Pay it back to build credit!</p>
        </div>

        <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 btn-bouncy text-white">
              <Wallet className="mr-2 w-5 h-5" /> Get a Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Apply for a Loan</DialogTitle>
              <DialogDescription>
                Borrowed money must be paid back. Your credit score determines your limit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  Loan Limits by Credit Score
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between">
                    <span className="text-slate-500 font-bold">300-499:</span>
                    <span className="text-red-500 font-bold">Denied</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between">
                    <span className="text-slate-500 font-bold">500-599:</span>
                    <span className="text-amber-500 font-bold">$50</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between">
                    <span className="text-slate-500 font-bold">600-699:</span>
                    <span className="text-blue-500 font-bold">$200</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between">
                    <span className="text-slate-500 font-bold">700-850:</span>
                    <span className="text-green-500 font-bold">$500</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="font-bold">Amount Needed ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="rounded-xl h-12 text-lg"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                />
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Warning: Missing payments will lower your credit score significantly!
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleApply} 
                disabled={isApplying}
                className="w-full rounded-xl h-12 text-lg font-bold"
              >
                {isApplying ? "Processing..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeLoans.length === 0 && (
        <Card className="bg-slate-50 border-dashed border-2 border-slate-200 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Debt Free!</h3>
            <p className="text-slate-500 max-w-sm mt-2">
              You don't have any active loans. Keep up the good work!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {activeLoans.map((loan) => {
          const progress = ((loan.amount - loan.remainingAmount) / loan.amount) * 100;
          return (
            <Card key={loan.id} className="rounded-3xl shadow-lg border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold text-slate-700">Loan #{loan.id}</CardTitle>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase">Active</span>
                </div>
                <CardDescription>
                  Original Amount: ${(loan.amount / 100).toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-500">Repaid</span>
                    <span className="text-slate-700 font-bold">${((loan.amount - loan.remainingAmount) / 100).toFixed(2)}</span>
                  </div>
                  <Progress value={progress} className="h-3 rounded-full bg-slate-100" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Remaining</p>
                    <p className="text-2xl font-bold text-indigo-600">${(loan.remainingAmount / 100).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4">
                <Button 
                  className="w-full rounded-xl font-bold" 
                  onClick={() => handleRepay(loan.id, loan.remainingAmount)}
                  disabled={isRepaying || (user?.balance || 0) < loan.remainingAmount}
                >
                  {isRepaying ? "Paying..." : "Pay Off Full Amount"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {paidLoans.length > 0 && (
        <div className="pt-8">
          <h3 className="text-xl font-bold text-slate-700 mb-4 ml-2">Loan History</h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {paidLoans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Loan #{loan.id} Repaid</p>
                    <p className="text-xs text-slate-500">{(loan.amount / 100).toFixed(2)} paid back</p>
                  </div>
                </div>
                <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">Completed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
