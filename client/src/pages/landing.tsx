import { useState } from "react";
  import { useMutation, useQueryClient } from "@tanstack/react-query";
  import { Card, CardContent } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { useToast } from "@/hooks/use-toast";
  import { apiRequest } from "@/lib/queryClient";
  import { Ship, Globe, TrendingUp, Shield, Lock, ArrowLeftRight, Factory, Truck, LogIn } from "lucide-react";

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
        toast({ title: "\u062E\u0637\u0623 \u0641\u064A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644", description: err.message, variant: "destructive" });
      },
    });

    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim() || !password.trim()) {
        toast({ title: "\u064A\u0631\u062C\u0649 \u0645\u0644\u0621 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644", variant: "destructive" });
        return;
      }
      loginMutation.mutate({ username: username.trim(), password });
    };

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-amber-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500 rounded-full blur-3xl opacity-30" />
        </div>

        <nav className="relative z-10 border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20">
                <Factory className="w-6 h-6 text-emerald-950" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base leading-tight" data-testid="text-landing-logo">\u0645\u062C\u0645\u0648\u0639\u0629 \u062A\u062C\u0627\u0646\u064A \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629</h1>
                <p className="text-emerald-300/70 text-xs">TEDJANI INDUSTRIAL GROUP</p>
              </div>
            </div>
          </div>
        </nav>

        <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-12 max-w-6xl mx-auto w-full">
          <div className="flex-1 text-center lg:text-right space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-emerald-200 text-sm backdrop-blur-sm">
              <Globe className="w-4 h-4" />
              <span>\u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0645\u062A\u0643\u0627\u0645\u0644</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              \u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u062D\u0648\u064A\u0644\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-amber-500">\u0648\u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629</span>
            </h2>
            <p className="text-emerald-200/70 text-lg leading-relaxed">
              \u0625\u062F\u0627\u0631\u0629 \u0634\u0627\u0645\u0644\u0629 \u0644\u0644\u062A\u062D\u0648\u064A\u0644\u0627\u062A \u0628\u064A\u0646 \u0627\u0644\u0634\u0631\u0643\u0627\u062A\u060C \u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u0635\u0646\u0639\u060C \u0627\u0644\u0634\u0627\u062D\u0646\u0627\u062A\u060C \u0627\u0644\u0639\u0645\u0627\u0644 \u0648\u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639 \u0641\u064A \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-emerald-100 text-sm font-medium">\u062A\u062D\u0648\u064A\u0644\u0627\u062A \u0645\u0627\u0644\u064A\u0629</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Ship className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-emerald-100 text-sm font-medium">\u0634\u062D\u0646 \u0648\u0627\u0633\u062A\u064A\u0631\u0627\u062F</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-teal-400" />
                </div>
                <span className="text-emerald-100 text-sm font-medium">\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0634\u0627\u062D\u0646\u0627\u062A</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-emerald-100 text-sm font-medium">\u062A\u0642\u0627\u0631\u064A\u0631 \u0645\u0627\u0644\u064A\u0629</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm">
            <Card className="border-0 shadow-2xl shadow-black/20 bg-white/95 backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644</h2>
                  <p className="text-sm text-gray-500 mt-1">\u0623\u062F\u062E\u0644 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700 font-medium">\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645</Label>
                    <Input
                      id="username"
                      data-testid="input-username"
                      placeholder="\u0623\u062F\u062E\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645"
                      dir="ltr"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</Label>
                    <Input
                      id="password"
                      data-testid="input-password"
                      type="password"
                      placeholder="\u0623\u062F\u062E\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/20 transition-all duration-200"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        \u062C\u0627\u0631\u064A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogIn className="w-4 h-4" />
                        \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="relative z-10 border-t border-white/10 py-4 text-center text-xs text-emerald-300/50">
          \u0645\u062C\u0645\u0648\u0639\u0629 \u062A\u062C\u0627\u0646\u064A \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629 &copy; {new Date().getFullYear()} | TEDJANI INDUSTRIAL GROUP
        </footer>
      </div>
    );
  }
  