import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CheckSquare,
  FileText,
  Inbox,
  Kanban,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Target,
  Workflow,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const crmNavTriggerClass =
  "relative flex h-auto w-full items-center justify-start gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-[#5b6572] no-underline shadow-none transition-colors hover:bg-[#f4f6f9] hover:text-[#1a1a1a]";

const crmNavActiveClass =
  "bg-[#eef2f7] text-[#1a1a1a] hover:bg-[#eef2f7] hover:text-[#1a1a1a] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-[#2a5af5]";

const crmLinks = [
  { to: "/organization/crm", label: "CRM Dashboard", icon: LayoutDashboard, end: true },
  {
    to: "/organization/crm/business-profile",
    label: "Business Profile",
    icon: Building2,
    end: false,
  },
  { to: "/organization/crm/contacts", label: "Leads & Contacts", icon: Target, end: false },
  { to: "/organization/crm/pipeline", label: "Sales Pipeline", icon: Kanban, end: false },
  { to: "/organization/crm/whatsapp/inbox", label: "WhatsApp Inbox", icon: Inbox, end: false },
  { to: "/organization/crm/email-campaigns", label: "Email Campaigns", icon: Mail, end: false },
  {
    to: "/organization/crm/whatsapp-campaigns",
    label: "WhatsApp Campaigns",
    icon: MessageCircle,
    end: false,
  }, // Phase 5 campaign builder
  { to: "/organization/crm/templates", label: "WhatsApp Templates", icon: FileText, end: false },
  {
    to: "/organization/crm/whatsapp/automations",
    label: "WhatsApp Automations",
    icon: Workflow,
    end: false,
  },
  { to: "/organization/crm/tasks", label: "Tasks & Follow-ups", icon: CheckSquare, end: false },
  { to: "/organization/crm/reports", label: "Campaign Reports", icon: BarChart3, end: false },
] as const;

function isCrmLinkActive(pathname: string, to: string, end: boolean): boolean {
  if (end) return pathname === to || pathname === `${to}/`;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function CrmLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activePath =
    [...crmLinks]
      .reverse()
      .find((item) => isCrmLinkActive(location.pathname, item.to, item.end))?.to ??
    "/organization/crm";

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f5f7f9] lg:flex-row">
      <aside className="shrink-0 border-b border-[#e6eaf0] bg-white lg:h-full lg:w-56 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="px-3 py-3 md:px-4 lg:px-2 lg:py-4">
          <p className="mb-2 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2] lg:block">
            CRM
          </p>
          <div className="lg:hidden">
            <label htmlFor="crm-nav" className="sr-only">
              CRM
            </label>
            <Select value={activePath} onValueChange={(value) => navigate(value)}>
              <SelectTrigger id="crm-nav" className="h-11 min-h-11 border-stone-200 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="item-aligned" className="z-[110] max-h-[min(24rem,70dvh)]">
                {crmLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SelectItem key={item.to} value={item.to} className="min-h-11">
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {item.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <nav className="mt-0 hidden flex-col gap-0.5 lg:flex">
            {crmLinks.map((item) => {
              const Icon = item.icon;
              const active = isCrmLinkActive(location.pathname, item.to, item.end);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={cn(crmNavTriggerClass, active && crmNavActiveClass)}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[#f5f7f9]">
        <Outlet />
      </div>
    </div>
  );
}
