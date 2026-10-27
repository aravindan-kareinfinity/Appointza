import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AdminService } from "@/services/admin.service";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("aravindan9302@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const service = new AdminService();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ctx = await service.login(email, password);
      toast({
        title: "Superadmin signed in",
        description: `Welcome, ${ctx.adminname || ctx.adminemail}`,
      });
      navigate("/admin", { replace: true });
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121a2b] p-8 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#7dd3fc]">Appointza</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Superadmin login</h1>
        <p className="mt-1 text-sm text-slate-400">Platform console — not organisation login.</p>

        <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <Label htmlFor="admin-email" className="text-slate-300">
              Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 border-white/10 bg-[#0b1220] text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="admin-password" className="text-slate-300">
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-11 border-white/10 bg-[#0b1220] text-white"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-[#38bdf8] text-[#0b1220] hover:bg-[#7dd3fc]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Organisation users:{" "}
          <Link to="/login" className="text-[#7dd3fc] underline-offset-2 hover:underline">
            /login
          </Link>
        </p>
      </div>
    </div>
  );
}
