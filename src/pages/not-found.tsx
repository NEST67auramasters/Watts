import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-auto rounded-3xl shadow-xl">
        <CardContent className="pt-6 pb-8 text-center">
          <div className="mb-4 text-red-500 flex justify-center">
            <AlertCircle className="h-16 w-16" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-heading">Page Not Found</h1>
          <p className="text-gray-500 mb-6">
            Uh oh! It looks like you've wandered into a restricted vault.
          </p>

          <Link href="/">
            <Button className="w-full h-12 rounded-xl bg-primary text-lg font-bold">
              Return to Safety
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
