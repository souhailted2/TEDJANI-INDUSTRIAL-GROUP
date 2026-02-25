import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building, ArrowLeftRight, Shield, Users, LogIn } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ في تسجيل الدخول", description: err.message, variant: "destructive" });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
              <Building className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm" data-testid="text-landing-logo">التحويلات المالية</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center space-y-6 mb-10">
          <h1 className="text-4xl font-bold leading-tight" data-testid="text-hero-title">
            نظام التحويلات المالية بين الشركات
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            إدارة التحويلات المالية بين الشركات المختلفة عبر شركة أم مركزية.
            ارسل واستقبل الأموال بسهولة مع نظام موافقات متكامل.
          </p>
        </div>

        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <LogIn className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">تسجيل الدخول</h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  placeholder="أدخل اسم المستخدم"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-4xl w-full">
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">تحويلات آمنة</h3>
              <p className="text-xs text-muted-foreground">ارسل واستقبل الأموال بين الشركات عبر نظام موافقات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">تتبع الديون</h3>
              <p className="text-xs text-muted-foreground">متابعة المديونيات بين الشركات والشركة الأم بشفافية</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">إشعارات واتساب</h3>
              <p className="text-xs text-muted-foreground">إرسال إشعارات فورية عبر واتساب عند إتمام التحويلات</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        نظام التحويلات المالية &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
