import { useState } from "react";
import { useUsers, useFine } from "@/hooks/use-banking";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Search, Gavel } from "lucide-react";
import { useLocation } from "wouter";

export default function Admin() {
  const { data: currentUser } = useUser();
  const { data: users, isLoading } = useUsers();
  const { mutate: issueFine, isPending } = useFine();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [fineAmount, setFineAmount] = useState("");
  const [fineReason, setFineReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFineOpen, setIsFineOpen] = useState(false);

  if (currentUser && !currentUser.isAdmin) {
    setLocation("/");
    return null;
  }

  const handleFine = () => {
    if (!selectedUser) return;
    const amount = parseFloat(fineAmount);
    
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    issueFine({
      userId: selectedUser,
      amount: Math.round(amount * 100),
      description: fineReason || "Disciplinary Fine"
    }, {
      onSuccess: () => {
        setIsFineOpen(false);
        setFineAmount("");
        setFineReason("");
        setSelectedUser(null);
        toast({
          title: "Fine Issued",
          description: "Student balance has been deducted.",
          className: "bg-red-50 border-red-200 text-red-800",
        });
      }
    });
  };

  const filteredUsers = users?.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) && !u.isAdmin
  ) || [];

  if (isLoading) return <div>Loading class list...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 font-heading flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-8 h-8" /> Teacher Dashboard
          </h2>
          <p className="text-slate-500">Manage student accounts and issue fines.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input 
            placeholder="Search student..." 
            className="pl-10 h-12 rounded-xl bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Dialog open={isFineOpen} onOpenChange={setIsFineOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 text-2xl">
              <Gavel className="w-6 h-6" /> Issue Fine
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fine Amount ($)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="h-12 rounded-xl"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input 
                placeholder="e.g. Late homework, disruptive behavior..." 
                className="h-12 rounded-xl"
                value={fineReason}
                onChange={(e) => setFineReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={handleFine} 
              disabled={isPending}
              className="w-full h-12 rounded-xl font-bold"
            >
              {isPending ? "Issuing..." : "Deduct Funds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-6 rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{user.username}</h3>
                <p className="text-slate-500 text-sm">ID: #{user.id}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-primary">${(user.balance / 100).toFixed(2)}</p>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 justify-end">
                  Score: <span className={user.creditScore < 600 ? "text-red-500" : "text-green-500"}>{user.creditScore}</span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-xl h-10"
              onClick={() => {
                setSelectedUser(user.id);
                setIsFineOpen(true);
              }}
            >
              Issue Fine
            </Button>
          </Card>
        ))}
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            No students found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}
