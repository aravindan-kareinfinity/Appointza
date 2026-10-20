import { Link } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CheckSquare,
  ChevronRight,
  FileText,
  Inbox,
  Kanban,
  Mail,
  MessageCircle,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const cards = [
  {
    to: "/organization/crm/business-profile",
    title: "Business Profile",
    description: "Organisation details, services, events, and rooms.",
    icon: Building2,
  },
  {
    to: "/organization/crm/contacts",
    title: "Leads & Contacts",
    description: "Enquiries and contact follow-ups.",
    icon: Target,
  },
  {
    to: "/organization/crm/pipeline",
    title: "Sales Pipeline",
    description: "Track deal stages and conversions.",
    icon: Kanban,
  },
  {
    to: "/organization/crm/inbox",
    title: "Unified Inbox",
    description: "Email and WhatsApp conversations in one place.",
    icon: Inbox,
  },
  {
    to: "/organization/crm/email-campaigns",
    title: "Email Campaigns",
    description: "Bulk and scheduled email outreach.",
    icon: Mail,
  },
  {
    to: "/organization/crm/whatsapp-campaigns",
    title: "WhatsApp Campaigns",
    description: "Bulk and scheduled WhatsApp outreach.",
    icon: MessageCircle,
  },
  {
    to: "/organization/crm/templates",
    title: "Templates",
    description: "Email and WhatsApp message templates.",
    icon: FileText,
  },
  {
    to: "/organization/crm/tasks",
    title: "Tasks & Follow-ups",
    description: "Reminders and assigned next steps.",
    icon: CheckSquare,
  },
  {
    to: "/organization/crm/reports",
    title: "Reports",
    description: "CRM performance and conversion insights.",
    icon: BarChart3,
  },
  {
    to: "/organization/clients",
    title: "Customers",
    description: "Customer database, history, and bookings.",
    icon: Users,
  },
] as const;

export default function CrmDashboard() {
  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[#f5f7f9] p-4 md:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="rounded-lg border border-[#e6eaf0] bg-white px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-[#1a1a1a] sm:text-[20px]">
                CRM Dashboard
              </h2>
              <p className="mt-1 text-[13px] text-[#6b7280]">
                Leads, inbox, campaigns, and follow-ups — separate from day-to-day bookings.
              </p>
            </div>
            <Link
              to="/organization/crm/business-profile"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2a5af5] hover:underline"
            >
              View business profile
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className={cn(
                  "rounded-lg border border-[#e6eaf0] bg-white p-4 transition-colors",
                  "hover:border-[#cfd8f0] hover:bg-[#fafbff]",
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#eef2ff] text-[#2a5af5]">
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-3 text-[14px] font-semibold text-[#1a1a1a]">{card.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-[#6b7280]">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
