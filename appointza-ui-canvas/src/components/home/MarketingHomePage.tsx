import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Check,
  Star,
  Ticket,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Smartphone,
  Zap,
  ArrowRight,
  MessageSquare,
  TrendingUp,
  Globe,
  Activity,
  Menu,
  X,
  Scissors,
  HeartPulse,
  Dumbbell,
  GraduationCap,
  Briefcase,
  Wrench,
  ChevronRight,
  Sparkles,
  Gift,
  Clock,
  QrCode,
  PartyPopper,
  Palmtree,
  Loader2,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import { PlanCards } from "@/components/subscription/PlanCards";
import { cn } from "@/lib/utils";
import { HOME_FAQ_ITEMS } from "@/utils/homeSeo";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ─── Testimonials ────────────────────────────────────────────────────────── */
const testimonials = [
  {
    quote:
      "Appointza cut our no-shows by 60%. Customers now book online and we get paid upfront — no more chasing cash at the counter.",
    name: "Priya Suresh",
    role: "Owner, Glow Salon, Chennai",
    initials: "PS",
    color: "from-pink-500 to-rose-500",
  },
  {
    quote:
      "Managing 3 clinics used to mean 3 WhatsApp groups and daily confusion. Now everything is in one dashboard — appointments, staff, payments.",
    name: "Dr. Ramesh Iyer",
    role: "Director, CareFirst Clinics, Coimbatore",
    initials: "RI",
    color: "from-sky-500 to-blue-600",
  },
  {
    quote:
      "We sold 400 event tickets in 2 hours with QR check-in at the door. Our team didn't have to manage a single spreadsheet.",
    name: "Karthik Vijay",
    role: "Organizer, TechFest Tamil Nadu",
    initials: "KV",
    color: "from-orange-500 to-amber-500",
  },
];

/* ─── Industry segments (SEO-friendly labels) ─────────────────────────────── */
const segments = [
  { icon: Scissors, label: "Salon Booking Software", color: "text-pink-500 bg-pink-50" },
  { icon: HeartPulse, label: "Clinic Appointment Software", color: "text-red-500 bg-red-50" },
  { icon: Dumbbell, label: "Gym & Fitness Booking", color: "text-orange-500 bg-orange-50" },
  { icon: Calendar, label: "Event Ticket Booking", color: "text-violet-500 bg-violet-50" },
  { icon: GraduationCap, label: "Tutor & Coaching Booking", color: "text-sky-500 bg-sky-50" },
  { icon: Briefcase, label: "Consultants", color: "text-emerald-500 bg-emerald-50" },
  { icon: Wrench, label: "Service Center Booking", color: "text-zinc-600 bg-zinc-100" },
  { icon: Palmtree, label: "Resort & Hotel Booking", color: "text-teal-600 bg-teal-50" },
  { icon: PartyPopper, label: "Party Hall Booking", color: "text-fuchsia-600 bg-fuchsia-50" },
  { icon: Globe, label: "Sports Turf Booking", color: "text-indigo-500 bg-indigo-50" },
];

/* ─── Key highlights ────────────────────────────────────────────────────────── */
const keyHighlights = [
  { icon: Globe, title: "Free business website", desc: "Business website builder with your own booking website and online booking page." },
  { icon: Gift, title: "50 free bookings", desc: "Start your online booking system with 50 free bookings — no credit card required." },
  { icon: Calendar, title: "Online appointment booking", desc: "Appointment and event booking management in one online appointment system." },
  { icon: Clock, title: "Smart slot scheduling", desc: "Slot booking software with live availability, buffers, and conflict-free calendars." },
  { icon: CreditCard, title: "Online payments", desc: "Collect UPI, card, and wallet payments when customers book appointments online." },
  { icon: MessageSquare, title: "WhatsApp booking system", desc: "Automated WhatsApp and SMS booking reminders before every appointment." },
  { icon: Users, title: "Staff & multi-location", desc: "Appointment management software for teams, customers, and multiple branches." },
  { icon: BarChart3, title: "Business analytics", desc: "Booking management system dashboard for revenue, bookings, and performance." },
  { icon: QrCode, title: "QR check-in software", desc: "Fast event entry and event ticket booking with QR-based check-in." },
  { icon: Smartphone, title: "Appointment booking app", desc: "Mobile app with real-time notifications for bookings and payments." },
];

/* ─── Why choose Appointza ──────────────────────────────────────────────────── */
const whyChoose = [
  "Create your free business website and booking website in minutes",
  "Get started with 50 free bookings on our online booking platform",
  "Reduce no-shows with online payments and a WhatsApp booking system",
  "Manage bookings, staff, customers, and payments from one booking management system",
  "Scale from a single location to multiple branches across India",
];

/* ─── Core features ───────────────────────────────────────────────────────── */
const features = [
  {
    icon: Zap,
    title: "Smart Slot Scheduling Software",
    desc: "Slot booking software with live availability, buffer times, blackout dates, and multi-location calendars — all conflict-free.",
    color: "text-amber-600 bg-amber-50 border-amber-100",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Booking System",
    desc: "Automated confirmations, WhatsApp booking reminders, and rescheduling — zero manual follow-up for your online appointment system.",
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    icon: CreditCard,
    title: "Online Payment Collection",
    desc: "UPI, cards, and wallets via Razorpay with prepaid online appointment booking, invoicing, and revenue tracking.",
    color: "text-sky-600 bg-sky-50 border-sky-100",
  },
  {
    icon: Users,
    title: "Staff & Team Management",
    desc: "Appointment scheduling software with staff calendars, role permissions, and walk-in registration.",
    color: "text-violet-600 bg-violet-50 border-violet-100",
  },
  {
    icon: BarChart3,
    title: "Business Analytics Dashboard",
    desc: "Booking management system insights — revenue trends, no-show rates, peak hours, and staff performance.",
    color: "text-rose-600 bg-rose-50 border-rose-100",
  },
  {
    icon: Building2,
    title: "Multi-Branch Booking Software",
    desc: "Online booking platform for franchises — centralized reporting, branch controls, and branded booking websites.",
    color: "text-orange-600 bg-orange-50 border-orange-100",
  },
];

/* ─── Component ───────────────────────────────────────────────────────────── */
const MarketingHomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { plans, loading: plansLoading, error: plansError } = useSubscriptionPlans("appointza");

  const handleBookSlot = (orgId: number, locationId: number) => {
    const dest = `/book-appointment/${orgId}/${locationId}`;
    if (isAuthenticated) navigate(dest);
    else navigate("/login", { state: { from: dest } });
  };

  const handleBookTicket = (eventId: number) => {
    const dest = `/user/events/${eventId}/book`;
    if (isAuthenticated) navigate(dest);
    else navigate("/login", { state: { from: dest } });
  };

  // suppress unused-var lint for the two handlers (used conditionally via props/events)
  void handleBookSlot;
  void handleBookTicket;

  const navLink = "text-sm font-medium text-zinc-600 hover:text-orange-600 transition-colors";
  const mobileNavLink =
    "block rounded-xl px-4 py-3.5 text-base font-semibold text-zinc-800 hover:bg-zinc-100 active:bg-zinc-200 transition-colors";

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const closeMobileMenu = () => setMobileOpen(false);

  const mobileMenuPortal =
    mobileOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div className="fixed inset-0 z-[200] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <button
          type="button"
          className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px]"
          aria-label="Close menu"
          onClick={closeMobileMenu}
        />
        <div className="absolute inset-y-0 right-0 flex w-[min(100vw,20rem)] flex-col bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 safe-area-top">
            <span className="text-base font-bold text-zinc-900">Menu</span>
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100"
              aria-label="Close menu"
              onClick={closeMobileMenu}
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            <a href="#features" className={mobileNavLink} onClick={closeMobileMenu}>
              Features
            </a>
            <a href="#segments" className={mobileNavLink} onClick={closeMobileMenu}>
              Industries
            </a>
            <a href="#pricing" className={mobileNavLink} onClick={closeMobileMenu}>
              Pricing
            </a>
            <a href="#faq" className={mobileNavLink} onClick={closeMobileMenu}>
              FAQ
            </a>
            <hr className="my-2 border-zinc-200" />
            <Link
              to="/login"
              className="block rounded-xl border border-zinc-200 px-4 py-3.5 text-center text-base font-semibold text-zinc-800 hover:bg-zinc-50"
              onClick={closeMobileMenu}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="mt-1 block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3.5 text-center text-base font-semibold text-white shadow-md shadow-orange-500/20"
              onClick={closeMobileMenu}
            >
              Start Free
            </Link>
          </nav>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="bg-white text-zinc-900 antialiased">

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
            <img
              src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png"
              alt="Appointza — appointment booking software and online booking system"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-zinc-900">Appointza</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className={navLink}>Features</a>
            <a href="#segments" className={navLink}>Industries</a>
            <a href="#pricing" className={navLink}>Pricing</a>
            <a href="#faq" className={navLink}>FAQ</a>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-xl border border-transparent hover:border-zinc-200 transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:opacity-95 shadow-md shadow-orange-500/20 transition-opacity">
              Start Free
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {mobileMenuPortal}

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white pt-20 pb-16 md:pb-24">
        {/* background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="pointer-events-none absolute -top-40 -left-40 hidden h-[600px] w-[600px] rounded-full bg-orange-500/10 blur-[120px] md:block" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 hidden h-[500px] w-[500px] rounded-full bg-pink-500/10 blur-[120px] md:block" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          {/* headline block */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold mb-6 tracking-wide">
              <Sparkles className="size-3.5" aria-hidden />
              50 free bookings to get started — no credit card required
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Free Business Website &amp; Online Booking Software{" "}
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                for Every Service Business
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-3xl mx-auto">
              <strong className="font-semibold text-zinc-300">Appointza is an all-in-one appointment booking software and online booking platform</strong>{" "}
              that helps service businesses create a <strong className="font-semibold text-zinc-300">free business website</strong>, accept{" "}
              <strong className="font-semibold text-zinc-300">online appointments</strong>, manage{" "}
              <strong className="font-semibold text-zinc-300">slot bookings</strong>, collect payments, automate{" "}
              <strong className="font-semibold text-zinc-300">WhatsApp reminders</strong>, and track business performance from a single dashboard.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-xl shadow-orange-500/30 hover:opacity-95 transition-opacity"
              >
                Start Free <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-medium text-base border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                Explore Businesses
              </Link>
            </div>

            {/* trust bar */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" /> 500+ businesses</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" /> 2M+ appointments booked</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" /> ₹50Cr+ revenue processed</span>
            </div>
          </div>

          {/* ── floating dashboard mockup ─────────────────────────────────────── */}
          <div
            className="relative max-w-5xl mx-auto"
            role="img"
            aria-label="Appointment booking software dashboard with online booking calendar, business analytics, and WhatsApp booking reminders"
          >
            {/* main dashboard card */}
            <div className="rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
              {/* window chrome */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-zinc-950/60">
                <span className="size-3 rounded-full bg-red-500/80" />
                <span className="size-3 rounded-full bg-amber-500/80" />
                <span className="size-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs text-zinc-500 font-mono">appointza.com/organization/dashboard</span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* stat cards */}
                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Today's Bookings", value: "24", delta: "+3", color: "text-emerald-400" },
                    { label: "Revenue (MTD)", value: "₹1.2L", delta: "+12%", color: "text-sky-400" },
                    { label: "Pending Payments", value: "₹8,400", delta: "3 clients", color: "text-amber-400" },
                    { label: "Active Staff", value: "6 / 8", delta: "Online now", color: "text-violet-400" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                      <p className="text-xl font-bold text-white">{s.value}</p>
                      <p className={`text-xs mt-1 ${s.color}`}>{s.delta}</p>
                    </div>
                  ))}
                </div>

                {/* upcoming appointments */}
                <div className="md:col-span-2 rounded-2xl border border-white/8 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="size-4 text-orange-400" /> Upcoming Appointments
                  </p>
                  <div className="space-y-3">
                    {[
                      { name: "Priya S.", service: "Hair Color", time: "10:30 AM", staff: "Meena", paid: true },
                      { name: "Rahul K.", service: "Consultation", time: "11:00 AM", staff: "Dr. Ravi", paid: false },
                      { name: "Anitha M.", service: "Facial", time: "11:45 AM", staff: "Divya", paid: true },
                    ].map((a) => (
                      <div key={a.name} className="flex items-center justify-between py-2.5 border-b border-white/8 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {a.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{a.name}</p>
                            <p className="text-xs text-zinc-500">{a.service} · {a.staff}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-300">{a.time}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${a.paid ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                            {a.paid ? "Paid" : "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* revenue mini chart + mobile mockup */}
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-5 flex-1">
                    <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="size-4 text-sky-400" /> Revenue Trend
                    </p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[30, 55, 40, 70, 60, 85, 75].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-md bg-gradient-to-t from-orange-500 to-pink-400 opacity-80"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-zinc-600">
                      {(
                        [
                          { id: "mon", label: "M" },
                          { id: "tue", label: "T" },
                          { id: "wed", label: "W" },
                          { id: "thu", label: "T" },
                          { id: "fri", label: "F" },
                          { id: "sat", label: "S" },
                          { id: "sun", label: "S" },
                        ] as const
                      ).map((d) => (
                        <span key={d.id}>{d.label}</span>
                      ))}
                    </div>
                  </div>

                  {/* mobile notification pill */}
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="size-4 text-violet-400" />
                      <p className="text-xs font-semibold text-white">Mobile App</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                        New booking — Priya S.
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                        Payment received ₹1,200
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="size-1.5 rounded-full bg-sky-400 shrink-0" />
                        QR check-in — Event #12
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          1b. KEY HIGHLIGHTS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-zinc-200 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-3">Key Highlights</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
              Create Your Free Business Website
            </h2>
            <p className="text-zinc-600">
              Our online booking platform and appointment booking software is built for salon booking software,
              spa booking software, clinic appointment software, gym management software, event booking software,
              resort booking software, party hall booking software, and every appointment-based business in India.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {keyHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-zinc-300 hover:shadow-sm transition-all p-5 flex flex-col gap-3 h-full"
              >
                <div className="size-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0">
                  <item.icon className="size-5" strokeWidth={1.5} aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 text-sm mb-1">{item.title}</p>
                  <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. PROBLEM / SOLUTION
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-zinc-50 border-b border-zinc-200 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* problem */}
          <div>
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-3">The Problem</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-6 leading-tight">
              Still managing bookings manually?
            </h2>
            <div className="space-y-4">
              {[
                { title: "Missed calls & lost bookings", desc: "Customers call during busy hours — no answer, no booking. Revenue gone." },
                { title: "Double bookings & no-shows", desc: "Manual scheduling leads to overlap, angry customers, and wasted staff time." },
                { title: "Payment chasing", desc: "Collecting cash after service is awkward. No record, no accountability." },
                { title: "Scattered tools & zero visibility", desc: "WhatsApp for booking, Excel for records, paper for attendance — chaos at scale." },
              ].map((p) => (
                <div key={p.title} className="flex gap-3 p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm">
                  <span className="size-5 shrink-0 mt-0.5 rounded-full border-2 border-red-300 bg-red-50 flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-red-500" />
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900 text-sm">{p.title}</p>
                    <p className="text-zinc-500 text-sm mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* solution */}
          <div>
            <p className="text-xs font-bold tracking-widest text-emerald-600 uppercase mb-3">The Solution</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4 leading-tight">
              Appointment Scheduling Made Simple
            </h2>
            <p className="text-zinc-600 text-lg mb-8 leading-relaxed">
              Our booking management system eliminates manual scheduling, double bookings, and payment follow-ups —
              so you focus on service, not spreadsheets.
            </p>
            <div className="space-y-4">
              {[
                { icon: Calendar, label: "Live booking page — customers self-book 24/7", color: "text-orange-500 bg-orange-50" },
                { icon: CreditCard, label: "Online payment via UPI, card & wallets", color: "text-sky-500 bg-sky-50" },
                { icon: Activity, label: "Real-time dashboard with revenue & staff insights", color: "text-violet-500 bg-violet-50" },
                { icon: Ticket, label: "Event ticketing with QR check-in & capacity control", color: "text-pink-500 bg-pink-50" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm">
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                    <s.icon className="size-5" aria-hidden />
                  </div>
                  <p className="font-medium text-zinc-800">{s.label}</p>
                  <Check className="size-4 text-emerald-500 shrink-0 ml-auto" aria-hidden />
                </div>
              ))}
            </div>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold text-sm hover:opacity-95 shadow-lg shadow-orange-500/25 transition-opacity"
            >
              Get started free <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2b. VALUE PROPOSITION
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-zinc-200 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">

            {/* left — copy (sticky on desktop so it stays aligned while scrolling the grid) */}
            <div className="md:sticky md:top-28">
              <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-4">Why Choose Appointza</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight mb-5">
                Trusted Appointment Booking Software{" "}
                <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  in India
                </span>
              </h2>
              <p className="text-zinc-600 text-lg leading-relaxed mb-8">
                Appointza is service business software that combines a free business website builder, online
                appointment booking, payments, customer management, and business analytics in one online booking
                system.
              </p>
              <ul className="space-y-3 mb-8">
                {whyChoose.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-zinc-700">
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:opacity-95 transition-opacity"
                >
                  Start free today <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  to="/plans"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-zinc-300 text-zinc-700 font-medium text-sm hover:border-orange-400 hover:bg-orange-50/40 transition-colors"
                >
                  See pricing
                </Link>
              </div>
            </div>

            {/* right — benefit list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Globe,
                  title: "24/7 booking page",
                  desc: "Your own booking page customers can use any time — no calls needed.",
                  color: "bg-orange-50 text-orange-500 border-orange-100",
                },
                {
                  icon: CreditCard,
                  title: "Online payments & deposits",
                  desc: "Collect payment upfront via UPI, card or wallet to eliminate no-shows.",
                  color: "bg-sky-50 text-sky-500 border-sky-100",
                },
                {
                  icon: MessageSquare,
                  title: "Auto SMS & WhatsApp reminders",
                  desc: "Automatic confirmations and reminders sent before every booking.",
                  color: "bg-emerald-50 text-emerald-600 border-emerald-100",
                },
                {
                  icon: Calendar,
                  title: "One calendar for everything",
                  desc: "All staff, services, and branches in a single conflict-free view.",
                  color: "bg-violet-50 text-violet-600 border-violet-100",
                },
                {
                  icon: Users,
                  title: "Built-in customer CRM",
                  desc: "Every visit, preference, and payment history — remembered automatically.",
                  color: "bg-pink-50 text-pink-500 border-pink-100",
                },
                {
                  icon: BarChart3,
                  title: "Revenue & booking analytics",
                  desc: "Real-time insights on trends, no-show rates, and peak hours.",
                  color: "bg-amber-50 text-amber-600 border-amber-100",
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className="group rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-zinc-300 hover:shadow-md p-5 transition-all flex flex-col gap-3 h-full"
                >
                  <div className={`size-10 rounded-xl border flex items-center justify-center shrink-0 ${b.color}`}>
                    <b.icon className="size-5" strokeWidth={1.5} aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-sm mb-1">{b.title}</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. PRODUCT MOCKUPS — 3-column
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-zinc-200 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-3">Product</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">Online Appointment Booking System</h2>
            <p className="text-zinc-600 max-w-2xl mx-auto">
              From your public booking website to your appointment management software dashboard — one connected
              online booking platform for service businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Business Dashboard */}
            <div
              className="rounded-3xl border border-zinc-200 bg-zinc-950 p-6 text-white shadow-xl"
              role="img"
              aria-label="Business analytics dashboard for appointment booking software"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="size-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <BarChart3 className="size-4" />
                </div>
                <p className="font-semibold">Business Dashboard</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-white/8 p-3">
                  <p className="text-xs text-zinc-400 mb-2">Weekly Revenue</p>
                  <div className="flex items-end gap-1 h-10">
                    {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-orange-500 to-pink-400 opacity-80" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                {[
                  { label: "Appointments today", value: "18" },
                  { label: "Staff on duty", value: "5/7" },
                  { label: "Avg booking value", value: "₹680" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between items-center rounded-xl bg-white/5 px-3 py-2.5">
                    <span className="text-xs text-zinc-400">{r.label}</span>
                    <span className="text-sm font-semibold text-white">{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-4">Revenue trends · No-show rates · Peak hour heatmaps</p>
            </div>

            {/* Public Booking Page */}
            <div
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl"
              role="img"
              aria-label="Free business website with online booking and online booking calendar"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="size-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Globe className="size-4" />
                </div>
                <p className="font-semibold text-zinc-900">Public Booking Page</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500 mb-2">Select Service</p>
                  {["Hair Color — ₹800 · 60 min", "Facial — ₹600 · 45 min"].map((s) => (
                    <div key={s} className="flex justify-between items-center py-1.5 text-xs text-zinc-700 border-b border-zinc-100 last:border-0">
                      <span>{s.split("—")[0]}</span>
                      <span className="text-zinc-500">{s.split("—")[1]}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500 mb-2">Pick Date & Time</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["9:00", "10:30", "11:00", "2:00", "3:30", "4:00", "5:00", "6:30"].map((t, i) => (
                      <div key={t} className={`text-center py-1 rounded-lg text-xs font-medium ${i === 1 ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 p-3 text-center text-white text-sm font-semibold">
                  Pay ₹800 & Confirm →
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-4">UPI · Card · Wallet · Cash on arrival</p>
            </div>

            {/* Mobile App */}
            <div
              className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-violet-950 via-violet-900 to-zinc-900 p-6 text-white shadow-xl"
              role="img"
              aria-label="Appointment booking app with WhatsApp booking reminders and QR event check-in"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="size-8 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center">
                  <Smartphone className="size-4" />
                </div>
                <p className="font-semibold">Mobile App</p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "🔔", text: "New booking — Priya S. for 10:30 AM", color: "bg-white/8" },
                  { icon: "💰", text: "Payment ₹1,200 received via UPI", color: "bg-emerald-500/15" },
                  { icon: "📱", text: "WhatsApp reminder sent to 6 clients", color: "bg-white/8" },
                  { icon: "🎟️", text: "QR check-in — 34 / 50 event guests", color: "bg-amber-500/15" },
                  { icon: "⏰", text: "No-show flagged — Rahul K. 11:00 AM", color: "bg-red-500/15" },
                ].map((n) => (
                  <div key={n.text} className={`flex items-start gap-2.5 rounded-xl ${n.color} px-3 py-2.5`}>
                    <span className="text-base shrink-0">{n.icon}</span>
                    <p className="text-xs text-zinc-300 leading-snug">{n.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-4">Android & iOS · Push notifications · WhatsApp reminders</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3b. BOOKING JOURNEY
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-zinc-950 border-b border-white/8 py-20 md:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          {/* headline */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-xs font-bold tracking-widest text-orange-400 uppercase mb-4">Customer Journey</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
              From{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">'I want to book'</span>
              </span>
              {" "}to{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">'See you tomorrow'</span>
              {" "}— in seconds.
            </h2>
            <p className="text-zinc-400 text-lg">A booking journey your customers will actually enjoy.</p>
          </div>

          {/* steps */}
          <div className="relative">
            {/* connector line — visible md+ */}
            <div className="hidden md:block absolute top-[52px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px bg-gradient-to-r from-orange-500/0 via-orange-500/40 to-orange-500/0" aria-hidden />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
              {[
                {
                  step: "01",
                  title: "Discover",
                  desc: "Customers find your business through your booking link, branded microsite, or the Appointza Explore page.",
                  icon: Globe,
                  color: "from-orange-500 to-amber-500",
                  glow: "shadow-orange-500/25",
                },
                {
                  step: "02",
                  title: "Select",
                  desc: "They pick a service, preferred staff member, branch location, and a time slot that works for them.",
                  icon: Calendar,
                  color: "from-pink-500 to-rose-500",
                  glow: "shadow-pink-500/25",
                },
                {
                  step: "03",
                  title: "Slot & Pay",
                  desc: "Live availability prevents double-bookings. Secure online payment via Razorpay — UPI, card, or wallet.",
                  icon: CreditCard,
                  color: "from-violet-500 to-indigo-500",
                  glow: "shadow-violet-500/25",
                },
                {
                  step: "04",
                  title: "Confirmation",
                  desc: "Instant confirmation, automated reminders before the appointment, and a QR pass ready for check-in.",
                  icon: Ticket,
                  color: "from-emerald-500 to-teal-500",
                  glow: "shadow-emerald-500/25",
                },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center md:items-center group">
                  {/* icon circle */}
                  <div className={`relative size-[72px] rounded-2xl bg-gradient-to-br ${s.color} shadow-xl ${s.glow} flex items-center justify-center mb-6 shrink-0 group-hover:scale-105 transition-transform`}>
                    <s.icon className="size-8 text-white" strokeWidth={1.5} aria-hidden />
                    {/* step number badge */}
                    <span className="absolute -top-2.5 -right-2.5 size-6 rounded-full bg-zinc-900 border border-white/15 text-white text-[10px] font-bold flex items-center justify-center">
                      {s.step}
                    </span>
                  </div>

                  {/* text */}
                  <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* bottom CTA strip */}
          <div className="mt-16 rounded-3xl border border-white/8 bg-white/5 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-white font-semibold text-lg">Ready to give your customers this experience?</p>
              <p className="text-zinc-500 text-sm mt-0.5">Set up your booking page in under 5 minutes.</p>
            </div>
            <Link
              to="/register"
              className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              Start Free <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. CORE FEATURES GRID
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="scroll-mt-20 bg-zinc-50 border-b border-zinc-200 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
              Booking Management Software for Service Businesses
            </h2>
            <p className="text-zinc-600 max-w-2xl mx-auto">
              Six powerful modules in one appointment scheduling software — slot booking, WhatsApp reminders,
              payments, staff, analytics, and multi-branch tools.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col"
              >
                <div className={`size-12 rounded-2xl border flex items-center justify-center mb-5 ${f.color}`}>
                  <f.icon className="size-6" aria-hidden strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">{f.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed flex-1">{f.desc}</p>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="size-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. INDUSTRY SEGMENTS
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="segments" className="scroll-mt-20 bg-white border-b border-zinc-200 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-3">Industries</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
              Online Booking Platform for Salons, Clinics &amp; More
            </h2>
            <p className="text-zinc-600 max-w-2xl mx-auto">
              Whether you need salon booking software, clinic management software, gym booking software, or event
              booking software — Appointza scales from one chair to many branches.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {segments.map((s) => (
              <div
                key={s.label}
                className="group rounded-3xl border border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white hover:shadow-md transition-all p-6 flex flex-col items-center text-center gap-3"
              >
                <div className={`size-14 rounded-2xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="size-7" aria-hidden strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-zinc-800 text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-violet-600 p-8 md:p-12 text-white text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Don't see your industry?</h3>
            <p className="text-white/80 mb-6">If your business runs on appointments or events, Appointza works for you.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-colors shadow-lg"
            >
              Try it free <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. PRICING
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="scroll-mt-20 bg-zinc-50 border-b border-zinc-200 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-6">
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">Manage Bookings, Payments &amp; Customers</h2>
            <p className="text-zinc-600 max-w-2xl mx-auto">
              Simple pricing for our online booking system — plan fees plus fair booking-linked charges.
              Larger plans include more free bookings and lower per-booking fees.
            </p>
          </div>

          {/* launch offer banner */}
          <div className="max-w-2xl mx-auto mb-10 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-center">
            <p className="font-bold text-orange-900 text-sm">🎁 50 free bookings to get started</p>
            <p className="mt-1 text-sm text-orange-800">
              Start on the <strong>Free plan</strong> with a <strong>free website</strong> and{" "}
              <strong>50 free bookings</strong> — no subscription required.
            </p>
            <p className="mt-1 text-xs text-orange-700">Upgrade anytime for more free bookings and lower per-booking fees.</p>
          </div>

          <div className="mx-auto max-w-6xl">
            {plansLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading plans…
              </div>
            ) : plansError ? (
              <p className="py-8 text-center text-sm text-red-600">{plansError}</p>
            ) : plans.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No pricing plans available.</p>
            ) : (
              <PlanCards
                plans={plans}
                getCta={(plan, { isPopular }) => {
                  const planKey = (plan.plan_code ?? "").trim().toLowerCase();
                  const cta =
                    planKey === "free"
                      ? "Start free"
                      : planKey === "starter"
                        ? "Choose Starter"
                        : planKey === "growth"
                          ? "Choose Growth"
                          : planKey === "business"
                            ? "Choose Business"
                            : planKey === "enterprise"
                              ? "Choose Enterprise"
                              : planKey === "premium"
                                ? "Choose Premium"
                                : `Choose ${plan.display_name}`;
                  const ctaLink = `/register?plan=${encodeURIComponent(planKey || "free")}`;
                  return (
                    <Link
                      to={ctaLink}
                      className={cn(
                        "block w-full rounded-full py-3 text-center text-sm font-extrabold",
                        isPopular ? "bg-white text-zinc-950" : "bg-zinc-950 text-white",
                      )}
                    >
                      {cta}
                    </Link>
                  );
                }}
              />
            )}
          </div>

          <div className="max-w-4xl mx-auto mt-10 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="text-center">
              <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-3">Included in every plan</p>
              <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Same features. Different limits.</h3>
              <p className="text-zinc-600 text-sm md:text-base">
                All tiers ship with the full Appointza platform — only pricing, free-booking quota and per-booking fee change.
              </p>
            </div>

            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {[
                "Online scheduling & bookings",
                "Appointments, events & service catalog",
                "Staff, calendars & multi-location",
                "Customer notifications (email / SMS / WhatsApp where enabled)",
                "Payments & booking-fee ledger",
                "Business insights & reports",
                "Standard support",
              ].map((f) => (
                <div key={f} className="flex items-start gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <Check className="mt-0.5 size-4 text-emerald-600 shrink-0" />
                  <span className="text-sm text-zinc-800">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Need a custom plan?{" "}
            <Link to="/contact" className="text-orange-600 font-medium hover:underline">Talk to us →</Link>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. SOCIAL PROOF
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-zinc-200 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          {/* stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 text-center">
            {[
              { value: "500+", label: "Businesses trust Appointza", icon: Building2, color: "text-orange-500 bg-orange-50" },
              { value: "2M+", label: "Appointments booked", icon: Calendar, color: "text-sky-500 bg-sky-50" },
              { value: "₹50Cr+", label: "Revenue processed", icon: TrendingUp, color: "text-emerald-500 bg-emerald-50" },
            ].map((s) => (
              <div key={s.label} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 text-center shadow-sm">
                <div className={`size-12 rounded-2xl mx-auto mb-4 flex items-center justify-center ${s.color}`}>
                  <s.icon className="size-6" aria-hidden strokeWidth={1.5} />
                </div>
                <p className="text-4xl font-bold text-zinc-900 mb-1">{s.value}</p>
                <p className="text-zinc-600 text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* testimonials */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">Trusted by service businesses across India</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 shadow-sm flex flex-col h-full">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
                <p className="text-zinc-700 text-sm leading-relaxed flex-grow mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl bg-gradient-to-br ${t.color} text-white font-bold text-sm flex items-center justify-center shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-sm">{t.name}</p>
                    <p className="text-zinc-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7b. FAQ (SEO)
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="scroll-mt-20 bg-zinc-50 border-b border-zinc-200 py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
              Appointment Booking Software — Common Questions
            </h2>
            <p className="text-zinc-600">
              Answers about our online booking system, free business website, and appointment scheduling software.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {HOME_FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`faq-${index}`}
                className="rounded-2xl border border-zinc-200 bg-white px-5 shadow-sm"
              >
                <AccordionTrigger className="py-4 text-left text-sm font-semibold text-zinc-900 hover:no-underline md:text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-zinc-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. CLOSING CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 py-24 md:py-32 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[100px] md:block" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold mb-6 tracking-wide">
            <Zap className="size-3.5" aria-hidden />
            Join 500+ businesses already growing with Appointza
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Free Business Website with{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              Online Appointment Booking Software
            </span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl mb-10 max-w-3xl mx-auto">
            Start with a free business website, online booking system, and 50 free bookings. Appointza combines
            booking software, payments, WhatsApp reminders, and analytics for salons, clinics, gyms, events, and
            service businesses across India.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-2xl shadow-orange-500/30 hover:opacity-95 transition-opacity"
            >
              Get Started Free <ArrowRight className="size-5" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-medium border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Explore Businesses
            </Link>
          </div>
          <p className="mt-6 text-zinc-600 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium">
              Sign in →
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MarketingHomePage;
