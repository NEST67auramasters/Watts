import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransfer, useUsers } from "@/hooks/use-banking";
import { useUser } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Send, DollarSign } from "lucide-react";

const transferSchema = z.object({
  toUserId: z.coerce.number().min(1, "Select a recipient"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
});

export default function Transfer() {
  const { data: currentUser } = useUser();
  const { data: users } = useUsers();
  const { mutate: transfer, isPending } = useTransfer();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      description: "",
    },
  });

  // Filter out current user from recipients list
  const recipients = users?.filter(u => u.id !== currentUser?.id) || [];

  function onSubmit(values: z.infer<typeof transferSchema>) {
    // Convert dollars to cents for backend
    const amountInCents = Math.round(values.amount * 100);

    transfer({ ...values, amount: amountInCents }, {
      onSuccess: () => {
        toast({
          title: "Money Sent! 💸",
          description: `Successfully sent $${values.amount.toFixed(2)}`,
          className: "bg-green-50 border-green-200 text-green-800",
        });
        setLocation("/");
      },
      onError: (error) => {
        toast({
          title: "Transfer Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800 font-heading">Send Money</h2>
        <p className="text-slate-500">Pay a friend or classmate quickly.</p>
      </div>

      <Card className="rounded-3xl shadow-xl border-slate-100 overflow-hidden">
        <div className="bg-primary/5 p-6 flex items-center justify-between border-b border-primary/10">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Available Balance</p>
            <p className="text-3xl font-bold text-primary">${currentUser ? (currentUser.balance / 100).toFixed(2) : "..."}</p>
          </div>
          <div className="bg-white p-3 rounded-full shadow-sm text-primary">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="toUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-bold text-slate-700">Who are you sending to?</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-slate-200 text-lg">
                          <SelectValue placeholder="Select a classmate..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-100 shadow-lg">
                        {recipients.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()} className="text-base py-3 cursor-pointer">
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-bold text-slate-700">Amount ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">$</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          className="pl-8 h-14 text-2xl font-bold rounded-xl bg-slate-50 border-slate-200" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-bold text-slate-700">What's this for? (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Lunch money, group project..." 
                        className="h-14 rounded-xl bg-slate-50 border-slate-200" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 btn-bouncy mt-4"
                disabled={isPending}
              >
                {isPending ? "Sending..." : (
                  <>
                    Send Money <Send className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
