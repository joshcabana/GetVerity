import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, BarChart3, Users, Settings, Play, Ban,
  MessageSquare, Check, X, TrendingUp, Activity, Eye, Search,
  ChevronRight, Bell, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type AdminSection = "moderation" | "appeals" | "analytics" | "users" | "guardian" | "settings";

const chartConfig = {
  sparks: { label: "Sparks", color: "hsl(43 72% 55%)" },
  value: { label: "Users", color: "hsl(43 72% 55%)" },
};

const pieColors = ["hsl(43 72% 55%)", "hsl(43 60% 70%)", "hsl(0 0% 40%)", "hsl(40 10% 60%)"];

const navItems: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "moderation", label: "Moderation", icon: Shield },
  { id: "appeals", label: "Appeals", icon: MessageSquare },
  { id: "guardian", label: "Guardian", icon: AlertTriangle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const Admin = () => {
  const [section, setSection] = useState<AdminSection>("moderation");
  const [userSearch, setUserSearch] = useState("");
  const queryClient = useQueryClient();

  // ═══ REAL DATA QUERIES ═══

  const { data: moderationFlags = [] } = useQuery({
    queryKey: ["admin-moderation-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_flags")
        .select("*")
        .is("action_taken", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: appeals = [] } = useQuery({
    queryKey: ["admin-appeals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appeals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles", userSearch],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (userSearch.trim()) {
        query = query.or(`display_name.ilike.%${userSearch}%,handle.ilike.%${userSearch}%,user_id.eq.${userSearch.trim()}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: platformStats } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_stats")
        .select("*")
        .order("stat_date", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("runtime_alert_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: roomStats = [] } = useQuery({
    queryKey: ["admin-room-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("name, active_users")
        .order("active_users", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data.map((r) => ({ name: r.name, value: r.active_users ?? 0 }));
    },
  });

  const { data: guardianAlerts = [] } = useQuery({
    queryKey: ["admin-guardian-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardian_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Aggregate guardian alerts per user
  const guardianByUser = (() => {
    const map = new Map<string, { count: number; latest: string }>();
    for (const a of guardianAlerts) {
      const existing = map.get(a.user_id);
      if (existing) {
        existing.count++;
        if (a.created_at > existing.latest) existing.latest = a.created_at;
      } else {
        map.set(a.user_id, { count: 1, latest: a.created_at });
      }
    }
    return Array.from(map.entries())
      .map(([userId, { count, latest }]) => ({ userId, count, latest }))
      .sort((a, b) => b.count - a.count);
  })();

  // ═══ MUTATIONS ═══

  const flagActionMutation = useMutation({
    mutationFn: async ({ flagId, action }: { flagId: string; action: "ban" | "warn" | "clear" }) => {
      const { error } = await supabase
        .from("moderation_flags")
        .update({ action_taken: action, reviewed_at: new Date().toISOString() })
        .eq("id", flagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-moderation-flags"] });
      toast.success("Action applied");
    },
  });

  const appealActionMutation = useMutation({
    mutationFn: async ({ appealId, status }: { appealId: string; status: "upheld" | "denied" }) => {
      const { error } = await supabase
        .from("appeals")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", appealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appeals"] });
      toast.success("Appeal updated");
    },
  });

  const genderBalance = platformStats?.gender_balance as { men?: number; women?: number; nonbinary?: number } | null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card/50 p-4 gap-1">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-serif text-lg text-foreground">Admin</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}

        {/* Alerts */}
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-2 px-2 mb-3">
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-luxury">Alerts</span>
          </div>
          <div className="space-y-2">
            {alerts.length === 0 && (
              <p className="text-[11px] text-muted-foreground/40 px-2">No recent alerts</p>
            )}
            {alerts.map((alert) => (
              <div key={alert.id} className="px-2 py-1.5 rounded-md bg-secondary/30">
                <p className="text-[11px] text-foreground/80 leading-tight">{alert.message}</p>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 py-6 md:py-8 mt-12 md:mt-0">
          <AnimatePresence mode="wait">
            {/* ═══ MODERATION ═══ */}
            {section === "moderation" && (
              <motion.div key="mod" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <h1 className="font-serif text-2xl text-foreground mb-1">Moderation Queue</h1>
                <p className="text-sm text-muted-foreground/60 mb-6">{moderationFlags.length} items require attention</p>

                {moderationFlags.length === 0 && (
                  <p className="text-center text-muted-foreground/50 py-16 text-sm">Queue is clear — no pending flags.</p>
                )}

                <div className="space-y-3">
                  {moderationFlags.map((flag, i) => (
                    <motion.div
                      key={flag.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground font-mono">{flag.flagged_user_id.slice(0, 8)}</span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {new Date(flag.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground/70">{flag.reason ?? "No reason provided"}</p>
                          {flag.ai_confidence != null && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-destructive/70"
                                  style={{ width: `${Number(flag.ai_confidence) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground/50">
                                AI confidence: {Math.round(Number(flag.ai_confidence) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => flagActionMutation.mutate({ flagId: flag.id, action: "ban" })}>
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => flagActionMutation.mutate({ flagId: flag.id, action: "warn" })}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary"
                            onClick={() => flagActionMutation.mutate({ flagId: flag.id, action: "clear" })}>
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══ APPEALS ═══ */}
            {section === "appeals" && (
              <motion.div key="appeals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <h1 className="font-serif text-2xl text-foreground mb-1">Appeals Inbox</h1>
                <p className="text-sm text-muted-foreground/60 mb-6">Review user appeals with care and fairness</p>

                {appeals.length === 0 && (
                  <p className="text-center text-muted-foreground/50 py-16 text-sm">No appeals to review.</p>
                )}

                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appeals.map((appeal) => (
                        <TableRow key={appeal.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{appeal.user_id.slice(0, 8)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{appeal.explanation}</TableCell>
                          <TableCell className="text-muted-foreground/60 text-sm">{new Date(appeal.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={appeal.status === "pending" ? "outline" : "secondary"}
                              className={`text-[10px] ${
                                appeal.status === "upheld" ? "text-primary border-primary/30" :
                                appeal.status === "denied" ? "text-destructive border-destructive/30" : ""
                              }`}
                            >
                              {appeal.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {appeal.status === "pending" && (
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary"
                                  onClick={() => appealActionMutation.mutate({ appealId: appeal.id, status: "upheld" })}>
                                  <Check className="w-3 h-3 mr-1" />
                                  Uphold
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive"
                                  onClick={() => appealActionMutation.mutate({ appealId: appeal.id, status: "denied" })}>
                                  <X className="w-3 h-3 mr-1" />
                                  Deny
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}

            {/* ═══ GUARDIAN ═══ */}
            {section === "guardian" && (
              <motion.div key="guardian" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <h1 className="font-serif text-2xl text-foreground mb-1">Guardian Alerts</h1>
                <p className="text-sm text-muted-foreground/60 mb-6">
                  {guardianAlerts.length} total alerts from {guardianByUser.length} users
                </p>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50" />
                      <span className="text-[11px] text-muted-foreground/60">Total Alerts</span>
                    </div>
                    <span className="font-serif text-xl text-foreground">{guardianAlerts.length}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
                      <span className="text-[11px] text-muted-foreground/60">Unique Users</span>
                    </div>
                    <span className="font-serif text-xl text-foreground">{guardianByUser.length}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground/50" />
                      <span className="text-[11px] text-muted-foreground/60">Repeat Offenders (3+)</span>
                    </div>
                    <span className="font-serif text-xl text-foreground">
                      {guardianByUser.filter((u) => u.count >= 3).length}
                    </span>
                  </div>
                </div>

                {/* Per-user table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Alert Count</TableHead>
                        <TableHead>Last Alert</TableHead>
                        <TableHead>Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guardianByUser.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground/50 py-8">
                            No guardian alerts recorded
                          </TableCell>
                        </TableRow>
                      )}
                      {guardianByUser.map((row) => (
                        <TableRow key={row.userId}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{row.userId.slice(0, 8)}</TableCell>
                          <TableCell className="tabular-nums text-foreground font-medium">{row.count}</TableCell>
                          <TableCell className="text-muted-foreground/60 text-sm">
                            {new Date(row.latest).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                row.count >= 5
                                  ? "text-destructive border-destructive/30"
                                  : row.count >= 3
                                  ? "text-primary border-primary/30"
                                  : ""
                              }`}
                            >
                              {row.count >= 5 ? "High" : row.count >= 3 ? "Medium" : "Low"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}

            {/* ═══ ANALYTICS ═══ */}
            {section === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <h1 className="font-serif text-2xl text-foreground mb-1">Analytics</h1>
                <p className="text-sm text-muted-foreground/60 mb-6">Platform health and engagement overview</p>

                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {[
                    { label: "Total sparks", value: String(platformStats?.total_sparks ?? 0), icon: Activity },
                    { label: "Active users", value: String(platformStats?.active_users ?? 0), icon: Users },
                    { label: "Moderation flags", value: String(platformStats?.moderation_flags_count ?? 0), icon: Shield },
                    { label: "AI accuracy", value: `${platformStats?.ai_accuracy ?? 0}%`, icon: TrendingUp },
                  ].map((kpi, i) => (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <kpi.icon className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-[11px] text-muted-foreground/60">{kpi.label}</span>
                      </div>
                      <span className="font-serif text-xl text-foreground">{kpi.value}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-lg border border-border bg-card p-5">
                    <h3 className="text-sm font-medium text-foreground mb-4">Gender Balance</h3>
                    <ChartContainer config={chartConfig} className="h-48 w-full">
                      <BarChart data={[
                        { gender: "Women", count: genderBalance?.women ?? 0 },
                        { gender: "Men", count: genderBalance?.men ?? 0 },
                        { gender: "Non-binary", count: genderBalance?.nonbinary ?? 0 },
                      ]} layout="vertical">
                        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis type="category" dataKey="gender" tickLine={false} axisLine={false} fontSize={12} width={80} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(43 72% 55%)" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ChartContainer>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-5">
                    <h3 className="text-sm font-medium text-foreground mb-4">Room Popularity</h3>
                    {roomStats.length > 0 ? (
                      <ChartContainer config={chartConfig} className="h-48 w-full">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie data={roomStats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                            {roomStats.map((_: unknown, i: number) => (
                              <Cell key={i} fill={pieColors[i % pieColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 text-center py-16">No room data yet</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ USERS ═══ */}
            {section === "users" && (
              <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <h1 className="font-serif text-2xl text-foreground mb-1">Users</h1>
                <p className="text-sm text-muted-foreground/60 mb-6">Search and manage user accounts</p>

                <div className="relative mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <Input
                    placeholder="Search by name or handle…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Tokens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground/50 py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{profile.user_id.slice(0, 8)}</TableCell>
                          <TableCell className="font-medium text-foreground">{profile.display_name ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${
                              profile.verification_status === "verified" ? "text-primary border-primary/30" :
                              profile.is_active === false ? "text-destructive border-destructive/30" :
                              ""
                            }`}>
                              {profile.is_active === false ? "inactive" : profile.verification_status ?? "unverified"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{profile.subscription_tier ?? "free"}</TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">{profile.token_balance}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}

            {/* ═══ SETTINGS ═══ */}
            {section === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <h1 className="font-serif text-2xl text-foreground mb-1">Settings</h1>
                <p className="text-sm text-muted-foreground/60 mb-6">Platform configuration and controls</p>

                <div className="space-y-4">
                  {[
                    { title: "AI moderation sensitivity", description: "Adjust the confidence threshold for automatic flagging", value: "0.60" },
                    { title: "Call duration", description: "Default video call length in seconds", value: "45" },
                    { title: "Spark decision window", description: "Time after call ends to decide (seconds)", value: "30" },
                    { title: "Minimum engagement time", description: "Seconds before Pass button becomes active", value: "15" },
                  ].map((setting) => (
                    <div key={setting.title} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{setting.title}</p>
                        <p className="text-xs text-muted-foreground/60">{setting.description}</p>
                      </div>
                      <Input className="w-20 text-center text-sm" defaultValue={setting.value} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Admin;
