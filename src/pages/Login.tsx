import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PiggyBank, School, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { mutate: login, isPending } = useLogin();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    login(values, {
      onSuccess: () => {
        setLocation("/");
        toast({
          title: "Welcome back!",
          description: "Ready to manage some money?",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      },
      onError: (error) => {
        toast({
          title: "Oops!",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-blue-900/5 p-8 md:p-10 border-4 border-white">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary animate-bounce">
            <PiggyBank className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 font-heading">The Watts Kingdom Bank</h1>
          <p className="text-slate-500 mt-2">Log in to check your balance!</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-600 font-bold ml-1">Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your student ID..." 
                      className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:ring-primary/20 focus:border-primary text-slate-900" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-600 font-bold ml-1">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:ring-primary/20 focus:border-primary text-slate-900 pr-12" 
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/30 btn-bouncy"
              disabled={isPending}
            >
              {isPending ? "Opening Vault..." : "Enter Bank"}
            </Button>
            
            <div className="text-center pt-4">
              <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                <School className="w-4 h-4" />
                Class Circle Banking System
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
