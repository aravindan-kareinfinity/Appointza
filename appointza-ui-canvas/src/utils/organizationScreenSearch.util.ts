export type OrgScreenSearchItem = {
  id: string;
  label: string;
  to: string;
  group: string;
  keywords: string[];
};

/** All organisation screens searchable from the top-bar command search. */
export const ORGANIZATION_SCREEN_SEARCH_ITEMS: OrgScreenSearchItem[] = [
  // Main
  {
    id: "home",
    label: "Home",
    to: "/organization/dashboard",
    group: "Main",
    keywords: ["dashboard", "overview", "home"],
  },
  {
    id: "bookings",
    label: "Bookings",
    to: "/organization/appointments",
    group: "Main",
    keywords: [
      "appointments",
      "operations",
      "calendar",
      "booking",
      "schedule",
      "event bookings",
      "day view",
    ],
  },
  {
    id: "event-bookings",
    label: "Event bookings",
    to: "/organization/appointments?kind=events",
    group: "Main",
    keywords: ["events", "registrations", "tickets", "participants"],
  },

  // Catalogue
  {
    id: "services",
    label: "Services",
    to: "/organization/services?kind=services",
    group: "Catalogue",
    keywords: ["catalogue", "catalog", "offerings", "menu", "service"],
  },
  {
    id: "events",
    label: "Events",
    to: "/organization/services?kind=events",
    group: "Catalogue",
    keywords: ["classes", "workshops", "catalogue", "catalog"],
  },
  {
    id: "rooms",
    label: "Rooms",
    to: "/organization/hospitality?section=room-status",
    group: "Catalogue",
    keywords: ["stay", "hospitality", "hotel", "property", "room definitions", "occupancy"],
  },
  {
    id: "hospitality-policies",
    label: "Hospitality policies",
    to: "/organization/hospitality?section=policies",
    group: "Catalogue",
    keywords: ["check-in", "check-out", "booking rules", "hospitality"],
  },
  {
    id: "hospitality-packages",
    label: "Stay packages",
    to: "/organization/hospitality?section=packages",
    group: "Catalogue",
    keywords: ["hospitality", "packages", "add-ons"],
  },
  {
    id: "assets",
    label: "Assets",
    to: "/organization/assets",
    group: "Catalogue",
    keywords: ["images", "media", "photos", "library", "gallery"],
  },
  {
    id: "templates",
    label: "Website templates",
    to: "/organization/profile?tab=templates",
    group: "Catalogue",
    keywords: ["website", "booking page", "template builder", "templates"],
  },

  // Customers
  {
    id: "customers",
    label: "Customers",
    to: "/organization/clients",
    group: "Customers",
    keywords: ["clients", "users", "guests", "people"],
  },
  {
    id: "crm",
    label: "CRM Dashboard",
    to: "/organization/crm",
    group: "CRM",
    keywords: ["crm", "sales", "leads"],
  },
  {
    id: "crm-contacts",
    label: "Leads & Contacts",
    to: "/organization/crm/contacts",
    group: "CRM",
    keywords: ["leads", "contacts", "enquiries", "crm"],
  },
  {
    id: "crm-pipeline",
    label: "Sales Pipeline",
    to: "/organization/crm/pipeline",
    group: "CRM",
    keywords: ["pipeline", "stages", "deals", "crm"],
  },
  {
    id: "crm-whatsapp-inbox",
    label: "WhatsApp Inbox",
    to: "/organization/crm/whatsapp/inbox",
    group: "CRM",
    keywords: ["whatsapp", "inbox", "messages", "chat", "crm"],
  },
  {
    id: "crm-email-campaigns",
    label: "Email Campaigns",
    to: "/organization/crm/email-campaigns",
    group: "CRM",
    keywords: ["email", "campaigns", "bulk", "crm"],
  },
  {
    id: "crm-whatsapp-campaigns",
    label: "WhatsApp Campaigns",
    to: "/organization/crm/whatsapp-campaigns",
    group: "CRM",
    keywords: ["whatsapp", "campaigns", "broadcast", "crm"],
  },
  {
    id: "crm-templates",
    label: "WhatsApp Templates",
    to: "/organization/crm/templates",
    group: "CRM",
    keywords: ["whatsapp", "templates", "crm"],
  },
  {
    id: "crm-automations",
    label: "WhatsApp Automations",
    to: "/organization/crm/whatsapp/automations",
    group: "CRM",
    keywords: ["whatsapp", "automations", "flows", "crm"],
  },
  {
    id: "crm-tasks",
    label: "Tasks & Follow-ups",
    to: "/organization/crm/tasks",
    group: "CRM",
    keywords: ["tasks", "reminders", "follow-ups", "crm"],
  },
  {
    id: "crm-reports",
    label: "Campaign Reports",
    to: "/organization/crm/reports",
    group: "CRM",
    keywords: ["reports", "analytics", "campaigns", "crm"],
  },
  {
    id: "crm-business-profile",
    label: "CRM Business Profile",
    to: "/organization/crm/business-profile",
    group: "CRM",
    keywords: ["business profile", "catalogue", "crm"],
  },

  // Settings
  {
    id: "settings",
    label: "Account & Settings",
    to: "/organization/profile",
    group: "Settings",
    keywords: ["account", "profile", "settings"],
  },
  {
    id: "settings-profile",
    label: "Profile",
    to: "/organization/profile?tab=profile",
    group: "Settings",
    keywords: ["account", "name", "email", "settings"],
  },
  {
    id: "settings-hours",
    label: "Business hours",
    to: "/organization/profile?tab=business-hours",
    group: "Settings",
    keywords: ["timing", "hours", "schedule", "availability", "settings"],
  },
  {
    id: "settings-staff",
    label: "Staff",
    to: "/organization/profile?tab=staff",
    group: "Settings",
    keywords: ["team", "employees", "users", "settings", "add staff", "staff management"],
  },
  {
    id: "settings-organization",
    label: "Organization",
    to: "/organization/profile?tab=organization",
    group: "Settings",
    keywords: ["business", "company", "settings"],
  },
  {
    id: "settings-location",
    label: "Locations",
    to: "/organization/profile?tab=location",
    group: "Settings",
    keywords: ["branches", "address", "locations", "settings", "facilities"],
  },
  {
    id: "settings-payment",
    label: "Payment settings",
    to: "/organization/profile?tab=payment",
    group: "Settings",
    keywords: ["payments", "razorpay", "upi", "settings", "billing"],
  },
  {
    id: "settings-loyalty",
    label: "Loyalty",
    to: "/organization/profile?tab=loyalty",
    group: "Settings",
    keywords: ["rewards", "points", "loyalty", "settings"],
  },
  {
    id: "settings-billing",
    label: "Billing",
    to: "/organization/profile?tab=billing",
    group: "Settings",
    keywords: ["plan", "subscription", "invoice", "billing", "settings"],
  },
  {
    id: "settings-whatsapp",
    label: "WhatsApp integration",
    to: "/organization/profile?tab=whatsapp",
    group: "Settings",
    keywords: ["whatsapp", "integration", "settings"],
  },
  {
    id: "settings-email",
    label: "Email integration",
    to: "/organization/profile?tab=email",
    group: "Settings",
    keywords: ["email", "smtp", "integration", "settings"],
  },
  {
    id: "settings-appointment-values",
    label: "Reference values",
    to: "/organization/profile?tab=appointment-values",
    group: "Settings",
    keywords: ["appointment values", "lookups", "statuses", "tasks", "crm types", "settings"],
  },
  {
    id: "settings-account",
    label: "Account security",
    to: "/organization/profile?tab=account",
    group: "Settings",
    keywords: ["password", "logout", "security", "settings"],
  },
];

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export function filterOrganizationScreens(
  query: string,
  items: OrgScreenSearchItem[] = ORGANIZATION_SCREEN_SEARCH_ITEMS,
): OrgScreenSearchItem[] {
  const q = normalizeQuery(query);
  if (!q) return items;

  const tokens = q.split(" ").filter(Boolean);

  const scored = items
    .map((item) => {
      const haystack = [item.label, item.group, item.to, ...item.keywords]
        .join(" ")
        .toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (item.label.toLowerCase().startsWith(token)) score += 40;
        else if (item.label.toLowerCase().includes(token)) score += 25;
        else if (item.keywords.some((k) => k.toLowerCase().includes(token))) score += 15;
        else if (haystack.includes(token)) score += 8;
        else return null;
      }
      if (item.label.toLowerCase() === q) score += 50;
      return { item, score };
    })
    .filter((row): row is { item: OrgScreenSearchItem; score: number } => row != null)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));

  return scored.map((row) => row.item);
}

export function groupOrganizationScreens(
  items: OrgScreenSearchItem[],
): { group: string; items: OrgScreenSearchItem[] }[] {
  const order: string[] = [];
  const map = new Map<string, OrgScreenSearchItem[]>();
  for (const item of items) {
    if (!map.has(item.group)) {
      map.set(item.group, []);
      order.push(item.group);
    }
    map.get(item.group)!.push(item);
  }
  return order.map((group) => ({ group, items: map.get(group)! }));
}
