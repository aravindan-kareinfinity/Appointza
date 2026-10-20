import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Award,
  Gift,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  SegmentTabsContent,
  SegmentTabsList,
  SegmentTabsTrigger,
} from "@/components/ui/segment-tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import {
  APPLY_ON_OPTIONS,
  ClientLoyaltyWallet,
  LoyaltyDashboard,
  LoyaltyRule,
  LoyaltyScheme,
  LoyaltyTier,
  OrganisationLoyaltySettings,
  REWARD_TYPE_OPTIONS,
  TRIGGER_TYPE_OPTIONS,
} from "@/models/loyalty.model";
import { loyaltyService } from "@/services/loyalty.service";
import { resolveOrganisationId } from "@/utils/organisationContext.util";

function rewardLabel(type: string, value: number, maxDiscount = 0) {
  switch (type) {
    case "percentage_discount":
      return maxDiscount > 0 ? `${value}% off (max ₹${maxDiscount})` : `${value}% discount`;
    case "fixed_discount":
      return `₹${value} off`;
    case "loyalty_points":
      return `${value} points`;
    case "free_service":
      return "1 free service";
    case "cashback":
      return `₹${value} cashback`;
    case "coupon":
      return "Coupon";
    case "free_addon":
      return "Free add-on";
    case "upgrade":
      return "Service upgrade";
    default:
      return type.replace(/_/g, " ");
  }
}

function triggerLabel(rule: LoyaltyRule) {
  const trigger = TRIGGER_TYPE_OPTIONS.find((t) => t.value === rule.trigger_type)?.label ?? rule.trigger_type;
  const prefix =
    rule.trigger_type === "spend_amount"
      ? "₹"
      : rule.trigger_type === "purchases_in_period" && rule.trigger_period_days > 0
        ? `${rule.trigger_period_days}d: `
        : "";
  return `${trigger} ${rule.trigger_operator} ${prefix}${rule.trigger_value}`;
}

const emptyScheme = (organisationId: number): LoyaltyScheme => ({
  id: 0,
  organisation_id: organisationId,
  name: "",
  description: "",
  status: "inactive",
  start_date: "",
  end_date: "",
  eligible_customer_ids: [],
  eligible_service_ids: [],
  min_completed_services: 0,
  reward_type: "loyalty_points",
  reward_value: 0,
  max_reward_limit: 0,
  reward_expiry_days: 30,
  terms_and_conditions: "",
  sort_order: 0,
  isactive: true,
  rules: [],
});

const emptyRule = (organisationId: number, schemeId: number): LoyaltyRule => ({
  id: 0,
  organisation_id: organisationId,
  scheme_id: schemeId,
  name: "",
  trigger_type: "completed_services",
  trigger_operator: ">=",
  trigger_value: 5,
  trigger_period_days: 0,
  reward_type: "percentage_discount",
  reward_value: 20,
  apply_on: "next_service",
  max_discount_amount: 500,
  reward_expiry_days: 30,
  free_service_id: 0,
  priority: 0,
  isactive: true,
});

const emptyTier = (organisationId: number): LoyaltyTier => ({
  id: 0,
  organisation_id: organisationId,
  name: "",
  min_services: 0,
  max_services: null,
  discount_percent: 0,
  benefits: [],
  sort_order: 0,
  isactive: true,
});

export default function OrganizationLoyalty({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const organisationId = resolveOrganisationId(user?.organisationid);

  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [dashboard, setDashboard] = useState<LoyaltyDashboard | null>(null);
  const [settings, setSettings] = useState<OrganisationLoyaltySettings>(new OrganisationLoyaltySettings());
  const [schemes, setSchemes] = useState<LoyaltyScheme[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [wallets, setWallets] = useState<ClientLoyaltyWallet[]>([]);
  const [walletSearch, setWalletSearch] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<ClientLoyaltyWallet | null>(null);

  const [schemeDialogOpen, setSchemeDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<LoyaltyScheme | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LoyaltyRule | null>(null);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [tierBenefitsText, setTierBenefitsText] = useState("");

  const loadAll = useCallback(async () => {
    if (organisationId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [dash, sett, schemeList, tierList] = await Promise.all([
        loyaltyService.getDashboard(organisationId),
        loyaltyService.getSettings(organisationId),
        loyaltyService.selectSchemes(organisationId),
        loyaltyService.selectTiers(organisationId),
      ]);
      setDashboard(dash);
      setSettings({ ...new OrganisationLoyaltySettings(), ...sett, organisation_id: organisationId });
      setSchemes(schemeList);
      setTiers(tierList);
    } catch (error) {
      console.error(error);
      toast({
        title: "Could not load loyalty program",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [organisationId, toast]);

  const loadWallets = useCallback(async () => {
    if (organisationId <= 0) return;
    try {
      const list = await loyaltyService.selectCustomerWallets(organisationId, walletSearch);
      setWallets(list);
    } catch (error) {
      console.error(error);
      toast({
        title: "Could not load customer wallets",
        variant: "destructive",
      });
    }
  }, [organisationId, walletSearch, toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (tab === "customers") void loadWallets();
  }, [tab, loadWallets]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const saved = await loyaltyService.saveSettings({ ...settings, organisation_id: organisationId });
      setSettings(saved);
      toast({ title: "Points configuration saved" });
      void loadAll();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedSample = async () => {
    setSeeding(true);
    try {
      await loyaltyService.seedSampleProgram(organisationId);
      toast({
        title: "Sample program created",
        description: "Service Loyalty Program with tiers and rules is ready.",
      });
      void loadAll();
    } catch (error) {
      toast({
        title: "Could not create sample",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const openSchemeEditor = (scheme?: LoyaltyScheme) => {
    setEditingScheme(scheme ? { ...scheme, rules: [...(scheme.rules ?? [])] } : emptyScheme(organisationId));
    setSchemeDialogOpen(true);
  };

  const saveScheme = async () => {
    if (!editingScheme?.name.trim()) {
      toast({ title: "Scheme name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await loyaltyService.saveScheme({ ...editingScheme, organisation_id: organisationId });
      setSchemeDialogOpen(false);
      toast({ title: editingScheme.id ? "Scheme updated" : "Scheme created" });
      void loadAll();
    } catch (error) {
      toast({
        title: "Could not save scheme",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteScheme = async (id: number) => {
    if (!confirm("Delete this scheme and its rules?")) return;
    try {
      await loyaltyService.deleteScheme(organisationId, id);
      toast({ title: "Scheme deleted" });
      void loadAll();
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const openRuleEditor = (schemeId: number, rule?: LoyaltyRule) => {
    setEditingRule(rule ? { ...rule } : emptyRule(organisationId, schemeId));
    setRuleDialogOpen(true);
  };

  const saveRule = async () => {
    if (!editingRule) return;
    setSaving(true);
    try {
      await loyaltyService.saveRule({ ...editingRule, organisation_id: organisationId });
      setRuleDialogOpen(false);
      toast({ title: editingRule.id ? "Rule updated" : "Rule created" });
      void loadAll();
    } catch (error) {
      toast({
        title: "Could not save rule",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: number) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await loyaltyService.deleteRule(organisationId, id);
      toast({ title: "Rule deleted" });
      void loadAll();
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const openTierEditor = (tier?: LoyaltyTier) => {
    const t = tier ? { ...tier } : emptyTier(organisationId);
    setEditingTier(t);
    setTierBenefitsText((t.benefits ?? []).join("\n"));
    setTierDialogOpen(true);
  };

  const saveTier = async () => {
    if (!editingTier?.name.trim()) {
      toast({ title: "Tier name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const benefits = tierBenefitsText
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean);
      await loyaltyService.saveTier({
        ...editingTier,
        organisation_id: organisationId,
        benefits,
      });
      setTierDialogOpen(false);
      toast({ title: editingTier.id ? "Tier updated" : "Tier created" });
      void loadAll();
    } catch (error) {
      toast({
        title: "Could not save tier",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTier = async (id: number) => {
    if (!confirm("Delete this tier?")) return;
    try {
      await loyaltyService.deleteTier(organisationId, id);
      toast({ title: "Tier deleted" });
      void loadAll();
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const openWalletDetails = async (wallet: ClientLoyaltyWallet) => {
    try {
      const [txns, grants] = await Promise.all([
        loyaltyService.selectTransactions(organisationId, wallet.client_user_id),
        loyaltyService.selectRewardGrants(organisationId, wallet.client_user_id),
      ]);
      setSelectedWallet({
        ...wallet,
        recent_transactions: txns,
        available_rewards: grants.filter((g) => g.status === "available"),
      });
    } catch {
      setSelectedWallet(wallet);
    }
  };

  const statCards = useMemo(
    () => [
      { label: "Active schemes", value: dashboard?.active_schemes ?? 0, icon: Gift },
      { label: "Enrolled customers", value: dashboard?.enrolled_customers ?? 0, icon: Users },
      { label: "Points issued", value: dashboard?.points_issued ?? 0, icon: Sparkles },
      { label: "Available rewards", value: dashboard?.available_rewards ?? 0, icon: Award },
    ],
    [dashboard],
  );

  const actionButtons = (
    <>
      <Button variant="outline" size="sm" onClick={() => void loadAll()} disabled={loading}>
        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
        Refresh
      </Button>
      <Button variant="outline" size="sm" onClick={() => void handleSeedSample()} disabled={seeding}>
        {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        Load sample program
      </Button>
    </>
  );

  if (organisationId <= 0) {
    return (
      <OrganizationPageShell embedded={embedded}>
        {embedded ? (
          <SettingsEmbeddedHeader
            icon={Award}
            title="Loyalty & Rewards"
            description="Configure schemes, points, tiers, and customer wallets."
          />
        ) : null}
        <div className={embedded ? settingsEmbedded.sectionBody : undefined}>
          <Card className={org.panel}>
            <CardContent className="py-10 text-center text-stone-500">
              Organisation context is required to manage loyalty settings.
            </CardContent>
          </Card>
        </div>
      </OrganizationPageShell>
    );
  }

  return (
    <OrganizationPageShell
      embedded={embedded}
      actions={embedded ? undefined : actionButtons}
    >
      {embedded ? (
        <SettingsEmbeddedHeader
          icon={Award}
          title="Loyalty & Rewards"
          description="Configure schemes, points, tiers, and customer wallets — all scoped to your organisation."
        />
      ) : null}
      <div className={cn(embedded ? settingsEmbedded.sectionBody : undefined)}>
        {embedded ? (
          <div className="mb-4 flex flex-wrap justify-end gap-2">{actionButtons}</div>
        ) : null}
      {loading && !dashboard ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <SegmentTabsList className="flex-wrap">
            <SegmentTabsTrigger value="dashboard">Dashboard</SegmentTabsTrigger>
            <SegmentTabsTrigger value="schemes">Schemes & Rules</SegmentTabsTrigger>
            <SegmentTabsTrigger value="points">Points Config</SegmentTabsTrigger>
            <SegmentTabsTrigger value="tiers">Tiers</SegmentTabsTrigger>
            <SegmentTabsTrigger value="customers">Customers</SegmentTabsTrigger>
          </SegmentTabsList>

          <SegmentTabsContent value="dashboard">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ label, value, icon: Icon }) => (
                <Card key={label} className={org.panel}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-stone-500">{label}</p>
                      <p className="text-2xl font-bold text-stone-900">{value.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className={cn(org.panel, "mt-6")}>
              <CardHeader>
                <CardTitle>Program status</CardTitle>
                <CardDescription>
                  {settings.isactive
                    ? "Loyalty program is active — customers earn points and rewards on completed services."
                    : "Loyalty program is inactive — no new points or rewards will be issued."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-stone-500">Redemption rate</p>
                  <p className="font-semibold">
                    {settings.redemption_points_per_rupee} pts = ₹{settings.redemption_rupee_value}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Min redemption</p>
                  <p className="font-semibold">{settings.min_redemption_points} points</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Points expiry</p>
                  <p className="font-semibold">{settings.points_expiry_days} days</p>
                </div>
              </CardContent>
            </Card>
          </SegmentTabsContent>

          <SegmentTabsContent value="schemes">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => openSchemeEditor()}>
                <Plus className="mr-2 h-4 w-4" />
                New scheme
              </Button>
            </div>

            {schemes.length === 0 ? (
              <Card className={org.panel}>
                <CardContent className="py-12 text-center">
                  <Gift className="mx-auto mb-3 h-10 w-10 text-stone-300" />
                  <p className="text-stone-600">No loyalty schemes yet.</p>
                  <p className="mt-1 text-sm text-stone-400">
                    Create a scheme or load the sample &quot;Service Loyalty Program&quot;.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {schemes.map((scheme) => (
                  <Card key={scheme.id} className={org.panel}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-lg">{scheme.name}</CardTitle>
                          <Badge variant={scheme.status === "active" ? "default" : "secondary"}>
                            {scheme.status}
                          </Badge>
                        </div>
                        {scheme.description ? (
                          <CardDescription className="mt-1">{scheme.description}</CardDescription>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => openSchemeEditor(scheme)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void deleteScheme(scheme.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-stone-700">Rules (WHEN → THEN)</h4>
                        <Button size="sm" variant="outline" onClick={() => openRuleEditor(scheme.id)}>
                          <Plus className="mr-1 h-3 w-3" />
                          Add rule
                        </Button>
                      </div>
                      {(scheme.rules ?? []).length === 0 ? (
                        <p className="text-sm text-stone-400">No rules configured for this scheme.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Rule</TableHead>
                              <TableHead>WHEN</TableHead>
                              <TableHead>THEN</TableHead>
                              <TableHead>Apply on</TableHead>
                              <TableHead className="w-[80px]" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(scheme.rules ?? []).map((rule) => (
                              <TableRow key={rule.id}>
                                <TableCell className="font-medium">{rule.name || "—"}</TableCell>
                                <TableCell>{triggerLabel(rule)}</TableCell>
                                <TableCell>
                                  {rewardLabel(rule.reward_type, rule.reward_value, rule.max_discount_amount)}
                                </TableCell>
                                <TableCell>
                                  {APPLY_ON_OPTIONS.find((a) => a.value === rule.apply_on)?.label ?? rule.apply_on}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openRuleEditor(scheme.id, rule)}>
                                      Edit
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => void deleteRule(rule.id)}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </SegmentTabsContent>

          <SegmentTabsContent value="points">
            <Card className={org.panel}>
              <CardHeader>
                <CardTitle>Points configuration</CardTitle>
                <CardDescription>
                  Example: ₹100 spent = 10 points when points per ₹ = 0.1 · 100 points = ₹50 discount
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="flex items-center justify-between rounded-xl border border-stone-200 p-4">
                  <div>
                    <Label>Loyalty program active</Label>
                    <p className="text-sm text-stone-500">When off, no points or rewards are issued</p>
                  </div>
                  <Switch
                    checked={settings.isactive}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, isactive: v }))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Points per completed service</Label>
                    <NumberInput
                      value={settings.points_per_service}
                      onValueChange={(v) => setSettings((s) => ({ ...s, points_per_service: v ?? 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points per ₹ spent</Label>
                    <NumberInput
                      float
                      value={settings.points_per_rupee_spent}
                      onValueChange={(v) => setSettings((s) => ({ ...s, points_per_rupee_spent: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bonus points (signup)</Label>
                    <NumberInput
                      value={settings.bonus_points}
                      onValueChange={(v) => setSettings((s) => ({ ...s, bonus_points: v ?? 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Referral points</Label>
                    <NumberInput
                      value={settings.referral_points}
                      onValueChange={(v) => setSettings((s) => ({ ...s, referral_points: v ?? 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Birthday bonus</Label>
                    <NumberInput
                      value={settings.birthday_bonus_points}
                      onValueChange={(v) => setSettings((s) => ({ ...s, birthday_bonus_points: v ?? 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Anniversary bonus</Label>
                    <NumberInput
                      value={settings.anniversary_bonus_points}
                      onValueChange={(v) => setSettings((s) => ({ ...s, anniversary_bonus_points: v ?? 0 }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Redemption: points per ₹</Label>
                    <NumberInput
                      value={settings.redemption_points_per_rupee}
                      onValueChange={(v) => setSettings((s) => ({ ...s, redemption_points_per_rupee: v ?? 100 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Redemption: ₹ value</Label>
                    <NumberInput
                      float
                      value={settings.redemption_rupee_value}
                      onValueChange={(v) => setSettings((s) => ({ ...s, redemption_rupee_value: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum points to redeem</Label>
                    <NumberInput
                      value={settings.min_redemption_points}
                      onValueChange={(v) => setSettings((s) => ({ ...s, min_redemption_points: v ?? 100 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points expiry (days)</Label>
                    <NumberInput
                      value={settings.points_expiry_days}
                      onValueChange={(v) => setSettings((s) => ({ ...s, points_expiry_days: v ?? 365 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max points per transaction (0 = unlimited)</Label>
                    <NumberInput
                      value={settings.max_points_per_transaction}
                      onValueChange={(v) => setSettings((s) => ({ ...s, max_points_per_transaction: v ?? 0 }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-xl border border-stone-200 p-4">
                    <Label className="text-sm">Combine with discounts</Label>
                    <Switch
                      checked={settings.combine_with_discounts}
                      onCheckedChange={(v) => setSettings((s) => ({ ...s, combine_with_discounts: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-stone-200 p-4">
                    <Label className="text-sm">Allow transfer</Label>
                    <Switch
                      checked={settings.allow_transfer}
                      onCheckedChange={(v) => setSettings((s) => ({ ...s, allow_transfer: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-stone-200 p-4">
                    <Label className="text-sm">Partial redemption</Label>
                    <Switch
                      checked={settings.allow_partial_redemption}
                      onCheckedChange={(v) => setSettings((s) => ({ ...s, allow_partial_redemption: v }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => void handleSaveSettings()} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SegmentTabsContent>

          <SegmentTabsContent value="tiers">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => openTierEditor()}>
                <Plus className="mr-2 h-4 w-4" />
                New tier
              </Button>
            </div>
            {tiers.length === 0 ? (
              <Card className={org.panel}>
                <CardContent className="py-12 text-center text-stone-500">
                  No tiers configured. Load the sample program or add Bronze / Silver / Gold / Platinum tiers.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {tiers.map((tier) => (
                  <Card key={tier.id} className={org.panel}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle>{tier.name}</CardTitle>
                        <CardDescription>
                          {tier.min_services}
                          {tier.max_services != null ? `–${tier.max_services}` : "+"} services
                          {tier.discount_percent > 0 ? ` · ${tier.discount_percent}% discount` : ""}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openTierEditor(tier)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void deleteTier(tier.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    {(tier.benefits ?? []).length > 0 && (
                      <CardContent>
                        <ul className="list-inside list-disc text-sm text-stone-600">
                          {tier.benefits.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </SegmentTabsContent>

          <SegmentTabsContent value="customers">
            <Card className={org.panel}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Customer loyalty wallets
                </CardTitle>
                <CardDescription>Points, tiers, rewards, and transaction history per customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Input
                    placeholder="Search by name or mobile…"
                    value={walletSearch}
                    onChange={(e) => setWalletSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void loadWallets()}
                  />
                  <Button variant="outline" onClick={() => void loadWallets()}>
                    Search
                  </Button>
                </div>
                {wallets.length === 0 ? (
                  <p className="py-8 text-center text-stone-500">
                    No customer wallets yet. Wallets are created when customers complete services.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Spend</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wallets.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>
                            <div className="font-medium">{w.client_name || `User #${w.client_user_id}`}</div>
                            {w.client_mobile ? (
                              <div className="text-xs text-stone-500">{w.client_mobile}</div>
                            ) : null}
                          </TableCell>
                          <TableCell>{w.current_points.toLocaleString()}</TableCell>
                          <TableCell>{w.completed_services_count}</TableCell>
                          <TableCell>{w.current_tier_name || "—"}</TableCell>
                          <TableCell>₹{Number(w.total_spend).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => void openWalletDetails(w)}>
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </SegmentTabsContent>
        </Tabs>
      )}
      </div>

      {/* Scheme dialog */}
      <Dialog open={schemeDialogOpen} onOpenChange={setSchemeDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScheme?.id ? "Edit scheme" : "Create scheme"}</DialogTitle>
          </DialogHeader>
          {editingScheme && (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingScheme.name}
                  onChange={(e) => setEditingScheme({ ...editingScheme, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingScheme.description}
                  onChange={(e) => setEditingScheme({ ...editingScheme, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingScheme.status}
                    onValueChange={(v: "active" | "inactive") =>
                      setEditingScheme({ ...editingScheme, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Min completed services</Label>
                  <NumberInput
                    value={editingScheme.min_completed_services}
                    onValueChange={(v) =>
                      setEditingScheme({ ...editingScheme, min_completed_services: v ?? 0 })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={editingScheme.start_date?.slice(0, 10) ?? ""}
                    onChange={(e) => setEditingScheme({ ...editingScheme, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={editingScheme.end_date?.slice(0, 10) ?? ""}
                    onChange={(e) => setEditingScheme({ ...editingScheme, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Terms & conditions</Label>
                <Textarea
                  value={editingScheme.terms_and_conditions}
                  onChange={(e) =>
                    setEditingScheme({ ...editingScheme, terms_and_conditions: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchemeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveScheme()} disabled={saving}>
              Save scheme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule?.id ? "Edit rule" : "Create rule"}</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Rule name</Label>
                <Input
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="e.g. 5 services → 20% off next visit"
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">WHEN</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Trigger</Label>
                  <Select
                    value={editingRule.trigger_type}
                    onValueChange={(v) =>
                      setEditingRule({ ...editingRule, trigger_type: v as LoyaltyRule["trigger_type"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <Select
                    value={editingRule.trigger_operator}
                    onValueChange={(v) => setEditingRule({ ...editingRule, trigger_operator: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">=">&gt;=</SelectItem>
                      <SelectItem value="=">=</SelectItem>
                      <SelectItem value=">">&gt;</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <NumberInput
                    value={editingRule.trigger_value}
                    onValueChange={(v) => setEditingRule({ ...editingRule, trigger_value: v ?? 0 })}
                  />
                </div>
                {editingRule.trigger_type === "purchases_in_period" && (
                  <div className="col-span-2 space-y-2">
                    <Label>Period (days)</Label>
                    <NumberInput
                      value={editingRule.trigger_period_days}
                      onValueChange={(v) =>
                        setEditingRule({ ...editingRule, trigger_period_days: v ?? 0 })
                      }
                    />
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">THEN</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Reward type</Label>
                  <Select
                    value={editingRule.reward_type}
                    onValueChange={(v) =>
                      setEditingRule({ ...editingRule, reward_type: v as LoyaltyRule["reward_type"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REWARD_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reward value</Label>
                  <NumberInput
                    value={editingRule.reward_value}
                    onValueChange={(v) => setEditingRule({ ...editingRule, reward_value: v ?? 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apply on</Label>
                  <Select
                    value={editingRule.apply_on}
                    onValueChange={(v) =>
                      setEditingRule({ ...editingRule, apply_on: v as LoyaltyRule["apply_on"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLY_ON_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(editingRule.reward_type === "percentage_discount" ||
                  editingRule.reward_type === "fixed_discount") && (
                  <div className="col-span-2 space-y-2">
                    <Label>Max discount (₹)</Label>
                    <NumberInput
                      value={editingRule.max_discount_amount}
                      onValueChange={(v) =>
                        setEditingRule({ ...editingRule, max_discount_amount: v ?? 0 })
                      }
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Reward expiry (days)</Label>
                  <NumberInput
                    value={editingRule.reward_expiry_days}
                    onValueChange={(v) =>
                      setEditingRule({ ...editingRule, reward_expiry_days: v ?? 30 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <NumberInput
                    value={editingRule.priority}
                    onValueChange={(v) => setEditingRule({ ...editingRule, priority: v ?? 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveRule()} disabled={saving}>
              Save rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTier?.id ? "Edit tier" : "Create tier"}</DialogTitle>
          </DialogHeader>
          {editingTier && (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingTier.name}
                  onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Min services</Label>
                  <NumberInput
                    value={editingTier.min_services}
                    onValueChange={(v) => setEditingTier({ ...editingTier, min_services: v ?? 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max services</Label>
                  <NumberInput
                    value={editingTier.max_services ?? undefined}
                    onValueChange={(v) =>
                      setEditingTier({ ...editingTier, max_services: v ?? null })
                    }
                    placeholder="∞"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <NumberInput
                    value={editingTier.discount_percent}
                    onValueChange={(v) =>
                      setEditingTier({ ...editingTier, discount_percent: v ?? 0 })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Benefits (one per line)</Label>
                <Textarea value={tierBenefitsText} onChange={(e) => setTierBenefitsText(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveTier()} disabled={saving}>
              Save tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallet details dialog */}
      <Dialog open={!!selectedWallet} onOpenChange={(open) => !open && setSelectedWallet(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWallet?.client_name || `Customer #${selectedWallet?.client_user_id}`}
            </DialogTitle>
          </DialogHeader>
          {selectedWallet && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-stone-500">Current points</p>
                  <p className="text-lg font-bold">{selectedWallet.current_points}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total earned</p>
                  <p className="text-lg font-bold">{selectedWallet.total_points_earned}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Redeemed</p>
                  <p className="text-lg font-bold">{selectedWallet.total_points_redeemed}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Tier</p>
                  <p className="text-lg font-bold">{selectedWallet.current_tier_name || "—"}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Available rewards</h4>
                {(selectedWallet.available_rewards ?? []).length === 0 ? (
                  <p className="text-sm text-stone-400">No available rewards</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedWallet.available_rewards.map((r) => (
                      <li
                        key={r.id}
                        className="flex justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      >
                        <span>
                          {rewardLabel(r.reward_type, r.reward_value, r.max_discount_amount)}
                        </span>
                        {r.expires_at ? (
                          <span className="text-stone-400">
                            Expires {format(new Date(r.expires_at), "dd MMM yyyy")}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Points history</h4>
                {(selectedWallet.recent_transactions ?? []).length === 0 ? (
                  <p className="text-sm text-stone-400">No transactions yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedWallet.recent_transactions.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs">
                            {t.created_at ? format(new Date(t.created_at), "dd MMM yyyy HH:mm") : "—"}
                          </TableCell>
                          <TableCell className="capitalize">{t.transaction_type}</TableCell>
                          <TableCell className={t.points_delta >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {t.points_delta >= 0 ? "+" : ""}
                            {t.points_delta}
                          </TableCell>
                          <TableCell>{t.balance_after}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OrganizationPageShell>
  );
}
