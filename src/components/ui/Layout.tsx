import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Home, Send, Wallet, History, LogOut, Users, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/transfer", label: "Transfer", icon: Send },
    { href: "/loans", label: "Loans", icon: Wallet },
    { href: "/history", label: "History", icon: History },
  ];

  if (user?.isAdmin) {
    navItems.push({ href: "/admin", label: "Class Admin", icon: Users });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="bg-primary text-white p-2 rounded-xl">WK</span>
            The Watts Kingdom Bank
          </h1>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 font-semibold",
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/30 translate-x-1" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-primary"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Signed in as</p>
            <p className="font-bold text-slate-700 truncate">{user?.username}</p>
            {user?.isAdmin ? (
              <span className="inline-block px-2 py-0.5 mt-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-bold">
                Admin
              </span>
            ) : (
              <span className="inline-block px-2 py-0.5 mt-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                Basic
              </span>
            )}
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-12 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
