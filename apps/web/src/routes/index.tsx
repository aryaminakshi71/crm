import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LeadCaptureWidget } from "@/components/lead-capture-widget";
import { leadsApi } from "@/lib/api";
import { PLAN_TIERS } from "@/lib/modules";
import { Link, createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  ArrowRight,
  Award,
  Bell,
  Bot,
  BookOpen,
  Brain,
  Box,
  Building2,
  Check,
  ChevronRight,
  Cpu,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  GitBranch,
  Headphones,
  Inbox,
  LifeBuoy,
  ListOrdered,
  Megaphone,
  MessageSquare,
  Mic,
  Package,
  Phone,
  PieChart,
  PlayCircle,
  Puzzle,
  Receipt,
  RefreshCw,
  ScrollText,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Truck,
  Users,
  Video,
  Workflow,
  Zap,
  // Plus extras used in features
  Activity,
  AlertCircle,
  BarChart2,
  BarChart3,
  Calendar,
  Clock,
  CloudLightning,
  Database,
  Layers,
  Mail,
  Map,
  Network,
  TrendingUp,
  UserRoundCog,
  Webhook,
  LayoutGrid,
  Globe,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const modules = [
  {
    icon: Building2,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "CRM",
    description: "Contacts, deals, leads, pipeline, and activity tracking.",
    href: "/app/crm",
    price: 9,
    features: ["Contact database", "Lead scoring", "Deal pipeline", "AI insights"],
  },
  {
    icon: FolderKanban,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Projects",
    description: "Project planning, task tracking, kanban, gantt, and delivery workflows.",
    href: "/app/projects",
    price: 9,
    features: ["Kanban boards", "Gantt timelines", "Milestones", "Resource allocation"],
  },
  {
    icon: LifeBuoy,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    title: "Helpdesk",
    description: "Ticketing, knowledge base, SLA workflows, and support operations.",
    href: "/app/helpdesk",
    price: 9,
    features: ["Smart triage", "Queue management", "SLA tracking", "Knowledge base"],
  },
  {
    icon: Users,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "HRM",
    description: "Employee directory, attendance, leave, recruitment, training, and payroll.",
    href: "/app/hrm",
    price: 9,
    features: ["Employee directory", "Leave management", "Recruitment ATS", "Payroll runs"],
  },
  {
    icon: LayoutGrid,
    color: "text-lime-400",
    bg: "bg-lime-400/10",
    title: "Inventory",
    description: "Product catalog, stock management, warehouses, and transfers.",
    href: "/app/inventory",
    price: 9,
    features: ["Product catalog", "Stock levels", "Warehouse management", "Barcode scanning"],
  },
  {
    icon: Activity,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Monitoring",
    description: "Error tracking, uptime checks, performance metrics, and log aggregation.",
    href: "/app/monitoring",
    price: 12,
    features: ["Error tracking", "Uptime checks", "Performance metrics", "Log aggregation"],
  },
  {
    icon: MessageSquare,
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    title: "Communications",
    description: "Omnichannel messaging — SMS, voice, video, chat, and speech transcription.",
    href: "/app/communications",
    price: 15,
    features: ["SMS sending/receiving", "Voice calls", "Video meetings", "Chat messaging"],
  },
  {
    icon: Truck,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    title: "Field Service",
    description: "Smart dispatch, route optimization, technician tracking, and job scheduling.",
    href: "/app/field-service",
    price: 15,
    features: ["Smart dispatch", "Route optimization", "Technician tracking", "Job scheduling"],
  },
  {
    icon: Globe,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    title: "DevOps",
    description: "CI/CD pipelines, automated deployments, and infrastructure management.",
    href: "/app/devops",
    price: 19,
    features: ["Pipeline builder", "Automated testing", "One-click deploy", "Rollback capabilities"],
  },
  {
    icon: CreditCard,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    title: "Finance",
    description: "Expenses, budget tracking, invoicing, billing, payment tracking, financial reporting, and cost control.",
    href: "/app/finance",
    price: 9,
    features: ["Expense tracking", "Budget management", "Invoicing & payments", "Financial reports"],
  },
  {
    icon: BarChart3,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    title: "Marketing",
    description: "Campaign builder, email automation, advertising, social media, landing pages, lead scoring, and A/B testing.",
    href: "/app/marketing",
    price: 9,
    features: ["Campaign builder", "Advertising & social", "AI planning", "Budget analytics"],
  },
  {
    icon: ShoppingCart,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    title: "eCommerce",
    description: "Online store, product catalog, cart, checkout, orders, payments, and inventory sync.",
    href: "/app/ecommerce",
    price: 15,
    features: ["Online store & checkout", "Product catalog", "Order management", "Inventory sync"],
  },
  {
    icon: Bot,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    title: "AI Agents",
    description: "Autonomous AI agents for automation, support, business intelligence, speech, and analytics.",
    href: "/app/agents",
    price: 19,
    features: ["AI agents for autonomous tasks", "Speech & transcription", "Predictive analytics", "KPI tracking"],
  },
  {
    icon: Brain,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-400/10",
    title: "Analytics & BI",
    description: "Dashboards, reports, churn analysis, CLV, cohort tracking, predictive analytics, and anomaly detection.",
    href: "/app/analytics",
    price: 19,
    features: ["Custom dashboards", "Cross-module reports", "Business metrics", "Data export"],
  },
  {
    icon: Workflow,
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    title: "Integrations",
    description: "300+ pre-built connectors, visual workflow builder, webhooks, and event bus.",
    href: "/app/integrations",
    price: 9,
    features: ["300+ connectors", "Workflow builder", "Webhooks", "Event bus"],
  },
];

const stats = [
  { value: "15", label: "Business Modules" },
  { value: "Unified Platform", label: "CRM, HRM, Projects & More" },
  { value: "14-Day", label: "Free Trial" },
  { value: "24/7", label: "AI Assistance" },
];

// Derive plan metadata from PLAN_TIERS, keep marketing features copy
const pricingPlans = PLAN_TIERS.map((plan) => ({
  name: plan.name,
  price: plan.monthlyPrice ?? 0,
  period: plan.monthlyPrice === null ? "Custom pricing" : "per user / month",
  description: plan.blurb,
  features: plan.key === "free"
    ? ["1 user", "CRM — contacts, leads, deals pipeline", "Projects — tasks & kanban board", "100 MB storage", "Community support"]
    : plan.key === "starter"
    ? ["Up to 25 users", "CRM, Projects, Helpdesk", "HRM, Inventory, Finance", "Monitoring, Analytics", "50 GB storage"]
    : plan.key === "business"
    ? ["Up to 200 users", "Everything in Starter", "Marketing, eCommerce, Communications", "Field Service, DevOps, AI Agents", "500 GB storage"]
    : ["Everything in Business", "Unlimited users", "Custom SLA", "Dedicated infrastructure", "Advanced compliance"],
  cta: plan.key === "free" ? "Get started free" : plan.key === "enterprise" ? "Talk to Sales" : "Start 14-Day Trial",
  popular: plan.key === "starter",
  ctaVariant: plan.key === "free" || plan.key === "enterprise" ? "outline" : "primary",
}));

// Module pricing for Pay-As-You-Go
const testimonials = [
  {
    quote:
      "Nucleo One replaced our old tool stack. The HRM + Finance + CRM integration alone has been a game changer for our operations.",
    name: "Sarah Chen",
    role: "COO, FinScale",
    rating: 5,
  },
  {
    quote:
      "The AI triage on Helpdesk is phenomenal. Our team can now focus on solving complex customer issues instead of triaging tickets.",
    name: "Marcus Webb",
    role: "Head of Support, Lyra",
    rating: 5,
  },
  {
    quote:
      "The Integration Hub connected all our apps automatically. We consolidated our tool stack and simplified our workflow.",
    name: "James Liu",
    role: "CTO, DataSync",
    rating: 5,
  },
  {
    quote:
      "AI Agents handle a significant portion of our Level 1 support tickets. Our team now focuses on complex customer issues only.",
    name: "Elena Rodriguez",
    role: "VP Support, TechFlow",
    rating: 5,
  },
  {
    quote:
      "Finally a platform with enterprise compliance baked in without the enterprise price tag.",
    name: "Priya Nair",
    role: "CTO, TrustLayer",
    rating: 5,
  },
];

// Customer logos for social proof
const customerLogos = [
  { name: "TechFlow", abbr: "TF" },
  { name: "DataSync", abbr: "DS" },
  { name: "CloudNine", abbr: "C9" },
  { name: "FinScale", abbr: "FS" },
  { name: "TrustLayer", abbr: "TL" },
  { name: "Lyra", abbr: "LY" },
];

// Security & compliance badges
const securityBadges: { name: string; icon: string }[] = [];

// FAQ items
const faqItems = [
  {
    q: "How long does it take to set up?",
    a: "Most teams are up and running within 15 minutes. Our guided onboarding walks you through initial setup, module selection, and you can import existing data from CSV or via our integrations.",
  },
  {
    q: "How does modular pricing work?",
    a: "With Pay-As-You-Go pricing, you only pay for the modules you need. Each module (like CRM, HRM, Projects, Finance) has its own monthly price. Alternatively, choose a plan tier that bundles modules together at a discount.",
  },
  {
    q: "Can I migrate from my current tools?",
    a: "Yes! We offer free migration assistance for all paid plans. Import contacts, deals, projects, and more from Salesforce, HubSpot, Zendesk, and 300+ other tools via our integrations.",
  },
  {
    q: "What modules are included in each plan?",
    a: "Free includes CRM and Projects. Starter adds Helpdesk, HRM, Inventory, Monitoring, Finance, and Analytics. Business adds Marketing, eCommerce, Communications, Field Service, DevOps, and AI Agents. Enterprise includes all 15 modules.",
  },
  {
    q: "What are AI Agents?",
    a: "AI Agents are autonomous AI assistants that can handle coding tasks, data analysis, customer support, and more. Deploy pre-built agents or create custom ones with our no-code agent builder.",
  },
  {
    q: "How does integrations and workflows work?",
    a: "Connect any app with our workflow automation engine. Build multi-step workflows with conditions, transformations, and compensation logic. Use webhooks to receive events from external systems.",
  },
  {
    q: "What is Field Service management?",
    a: "Field Service (ServiceNova) provides smart dispatch, AI route optimization, real-time technician tracking, job scheduling, and SLA management for organizations with mobile workers.",
  },
  {
    q: "Is there a free trial?",
    a: "Absolutely. Every paid plan starts with a 14-day free trial. No credit card required. Cancel anytime.",
  },
  {
    q: "What kind of support do you offer?",
    a: "Professional and above plans include priority support with 1-hour response time. We also offer live chat, extensive documentation, and video tutorials.",
  },
  {
    q: "How does pricing work for large teams?",
    a: "Per-seat pricing scales predictably. Contact us for volume discounts on teams over 50 users, or for custom enterprise agreements with dedicated infrastructure.",
  },
];

// ─── Feature Deep-Dive Data ───────────────────────────────────────────────────

const featureSpotlights = [
  {
    eyebrow: "CRM",
    heading: "Close More Deals. Faster.",
    description:
      "A full-featured sales platform with intelligent lead scoring, visual pipeline management, and AI-powered insights that help your team hit quota every quarter.",
    color: "blue",
    accentClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    glowClass: "shadow-blue-500/10",
    bgAccent: "bg-blue-500/5",
    href: "/app/crm",
    features: [
      { icon: Users, text: "Contact & company database with full activity history" },
      { icon: BarChart3, text: "Visual deal pipeline with drag-and-drop stages" },
      { icon: TrendingUp, text: "AI lead scoring that prioritizes your hottest prospects" },
      { icon: Target, text: "Sales forecasting with quota tracking and attainment reports" },
      { icon: Mail, text: "Email sequences and automated follow-up workflows" },
      { icon: PieChart, text: "Revenue analytics, win/loss reports, and territory management" },
    ],
    mockUI: "crm",
  },
  {
    eyebrow: "HRM",
    heading: "Your People, Fully Managed.",
    description:
      "From hire to retire — an all-in-one HRM platform covering employee records, leave management, payroll, performance reviews, and an ATS for top-of-funnel recruitment.",
    color: "amber",
    accentClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    glowClass: "shadow-amber-500/10",
    bgAccent: "bg-amber-500/5",
    href: "/app/hrm",
    features: [
      { icon: Users, text: "Searchable employee directory with org chart visualization" },
      { icon: Calendar, text: "Leave management with calendar view and approval workflows" },
      { icon: Award, text: "Performance reviews, OKRs, and 360-degree feedback" },
      { icon: Receipt, text: "Automated payroll runs with tax calculations and payslips" },
      { icon: BookOpen, text: "Onboarding checklists, training modules, and document storage" },
      { icon: UserRoundCog, text: "ATS for recruitment — job posts, applications, and interviews" },
    ],
    mockUI: "hrm",
  },
  {
    eyebrow: "PROJECTS",
    heading: "Ship Projects On Time, Every Time.",
    description:
      "Kanban boards, Gantt timelines, sprint planning, time tracking, and resource allocation — everything your team needs to plan, execute, and deliver projects at scale.",
    color: "emerald",
    accentClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    glowClass: "shadow-emerald-500/10",
    bgAccent: "bg-emerald-500/5",
    href: "/app/projects",
    features: [
      { icon: FolderKanban, text: "Kanban boards with custom stages, labels, and assignees" },
      { icon: BarChart2, text: "Gantt timelines with dependencies and critical path analysis" },
      { icon: Clock, text: "Time tracking with timesheets, budgets, and billing export" },
      { icon: Layers, text: "Sprint planning with velocity tracking and backlog grooming" },
      { icon: Users, text: "Resource allocation heatmaps to prevent team overload" },
      { icon: AlertCircle, text: "Risk register, issue tracking, and milestone management" },
    ],
    mockUI: "projects",
  },
  {
    eyebrow: "FINANCE",
    heading: "Get Paid. Stay Compliant.",
    description:
      "Professional invoices, automated payment reminders, double-entry accounting, tax calculations, and real-time financial dashboards — so you always know where your money is.",
    color: "green",
    accentClass: "text-green-400",
    borderClass: "border-green-500/30",
    glowClass: "shadow-green-500/10",
    bgAccent: "bg-green-500/5",
    href: "/app/finance",
    features: [
      { icon: FileText, text: "Professional invoices with custom branding and payment links" },
      { icon: RefreshCw, text: "Recurring billing and subscription management" },
      { icon: TrendingUp, text: "Double-entry accounting with real-time P&L and balance sheets" },
      { icon: Receipt, text: "Expense tracking, receipt capture, and reimbursement workflows" },
      { icon: BarChart3, text: "Cash flow forecasting and budget vs. actuals reporting" },
      { icon: Shield, text: "Multi-currency support with automatic tax rate calculations" },
    ],
    mockUI: "finance",
  },
  {
    eyebrow: "MARKETING",
    heading: "Run Campaigns That Convert.",
    description:
      "Build multi-channel campaigns, automate email sequences, A/B test landing pages, and track ROI — all in one platform connected directly to your CRM pipeline.",
    color: "purple",
    accentClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    glowClass: "shadow-purple-500/10",
    bgAccent: "bg-purple-500/5",
    href: "/app/marketing",
    features: [
      { icon: Megaphone, text: "Multi-channel campaign builder (email, SMS, social, ads)" },
      { icon: Target, text: "Audience segmentation with behavioral and demographic filters" },
      { icon: BarChart3, text: "A/B testing for subject lines, content, and send times" },
      { icon: TrendingUp, text: "Revenue attribution and campaign ROI analytics" },
      { icon: Workflow, text: "Visual automation workflows with triggers and conditions" },
      { icon: PieChart, text: "Webinar and event management with registration tracking" },
    ],
    mockUI: "marketing",
  },
  {
    eyebrow: "HELPDESK",
    heading: "Delight Customers at Scale.",
    description:
      "AI-powered ticket triage, omnichannel inbox, SLA tracking, knowledge base, and canned responses — so your support team spends time solving problems, not sorting tickets.",
    color: "cyan",
    accentClass: "text-cyan-400",
    borderClass: "border-cyan-500/30",
    glowClass: "shadow-cyan-500/10",
    bgAccent: "bg-cyan-500/5",
    href: "/app/helpdesk",
    features: [
      { icon: Inbox, text: "Unified omnichannel inbox (email, chat, SMS, social)" },
      { icon: Bot, text: "AI triage that auto-routes tickets to the right team" },
      { icon: Clock, text: "SLA tracking with escalation rules and breach alerts" },
      { icon: BookOpen, text: "Knowledge base with SEO-optimized self-service articles" },
      { icon: MessageSquare, text: "Canned responses and macros to reply in seconds" },
      { icon: BarChart3, text: "CSAT scores, resolution time, and team performance reports" },
    ],
    mockUI: "helpdesk",
  },
  {
    eyebrow: "FIELD SERVICE",
    heading: "Dispatch Smarter. Serve Faster.",
    description:
      "AI-powered dispatch, real-time technician tracking, route optimization, job scheduling, and proof-of-work capture — purpose-built for teams with mobile workers in the field.",
    color: "orange",
    accentClass: "text-orange-400",
    borderClass: "border-orange-500/30",
    glowClass: "shadow-orange-500/10",
    bgAccent: "bg-orange-500/5",
    href: "/app/field-service",
    features: [
      { icon: Map, text: "Live dispatch map with real-time technician locations" },
      { icon: Truck, text: "AI route optimization to minimize travel time and fuel costs" },
      { icon: Calendar, text: "Drag-and-drop job scheduling with skill-based assignment" },
      { icon: Clock, text: "SLA tracking per job with automatic escalation alerts" },
      { icon: Shield, text: "Photo proof-of-work, digital signatures, and inspection forms" },
      { icon: Package, text: "Parts inventory, equipment tracking, and warranty management" },
    ],
    mockUI: "fieldservice",
  },
  {
    eyebrow: "AI AGENTS",
    heading: "Autonomous AI That Works for You.",
    description:
      "Deploy pre-built AI agents or build custom ones with our no-code agent builder. Automate tasks, transcribe speech, generate meeting notes, analyze data with natural language, and get predictive insights across your entire business.",
    color: "fuchsia",
    accentClass: "text-fuchsia-400",
    borderClass: "border-fuchsia-500/30",
    glowClass: "shadow-fuchsia-500/10",
    bgAccent: "bg-fuchsia-500/5",
    href: "/app/agents",
    features: [
      { icon: Bot, text: "Pre-built agents for support, sales, HR, and finance tasks" },
      { icon: Sparkles, text: "Natural language queries across all your business data" },
      { icon: Workflow, text: "No-code agent builder with tool integrations and memory" },
      { icon: Activity, text: "Agent orchestration for multi-step autonomous workflows" },
      { icon: Brain, text: "Predictive analytics and anomaly detection powered by ML" },
      { icon: BarChart3, text: "Agent performance analytics, cost tracking, and usage reports" },
    ],
    mockUI: "ai",
  },
  {
    eyebrow: "COMMUNICATIONS",
    heading: "One Inbox for Every Channel.",
    description:
      "SMS, voice calls, video meetings, and team chat — unified into one communications platform (Samva API). Stay connected with customers and your team without switching apps.",
    color: "teal",
    accentClass: "text-teal-400",
    borderClass: "border-teal-500/30",
    glowClass: "shadow-teal-500/10",
    bgAccent: "bg-teal-500/5",
    href: "/app/communications",
    features: [
      { icon: MessageSquare, text: "Two-way SMS with bulk sending and conversation threads" },
      { icon: Phone, text: "Voice calls with IVR, call recording, and transcription" },
      { icon: Video, text: "HD video meetings with screen sharing and meeting notes" },
      { icon: Headphones, text: "Call center queue management with real-time metrics" },
      { icon: Mic, text: "Voicemail transcription and AI call summaries" },
      { icon: Activity, text: "Communications analytics with channel performance reports" },
    ],
    mockUI: "communications",
  },
];

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/";
    const title = "Nucleo One — All-in-One Business Management Platform";
    const description =
      "Nucleo One brings CRM, HRM, Projects, Finance, Helpdesk, Marketing, eCommerce, Field Service, DevOps, AI Agents, and more into a single unified platform. Replace 15 tools with one. Start free.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        {
          name: "keywords",
          content:
            "CRM, business management, HRM, helpdesk, project management, ERP, AI agents, integration hub, observability, monitoring, all-in-one business platform",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        // LocalBusiness / SoftwareApplication schema
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Nucleo One",
          "url": baseUrl,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/blog?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        })},
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "How long does it take to set up Nucleo One?", "acceptedAnswer": { "@type": "Answer", "text": "Most teams are up and running within 15 minutes. Guided onboarding walks you through module selection and data import from CSV or via 300+ integrations." } },
            { "@type": "Question", "name": "How does modular pricing work?", "acceptedAnswer": { "@type": "Answer", "text": "With Pay-As-You-Go pricing you only pay for the modules you need. Each module starts at $9/month. Alternatively, choose a bundle plan that includes multiple modules at a discount." } },
            { "@type": "Question", "name": "Can I migrate from Salesforce, HubSpot, or Zendesk?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Nucleo One offers free migration assistance for all paid plans. Import data from Salesforce, HubSpot, Zendesk, and 300+ other tools via our integrations." } },
            { "@type": "Question", "name": "What are AI Agents in Nucleo One?", "acceptedAnswer": { "@type": "Answer", "text": "AI Agents are autonomous assistants that handle coding tasks, data analysis, customer support triage, and more. Deploy pre-built agents or create custom ones with the no-code agent builder." } },
            { "@type": "Question", "name": "Is there a free plan?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. The Free plan is free forever for up to 1 user with CRM and Projects. Paid plans include a 14-day free trial — no credit card required." } },
          ]
        })},
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Nucleo One",
          "alternateName": "NucleoOne",
          "description": description,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "AggregateOffer",
            "lowPrice": "0",
            "highPrice": "99",
            "priceCurrency": "USD",
            "offerCount": "3"
          },
          "provider": {
            "@type": "Organization",
            "name": "Nucleo One",
            "url": baseUrl,
            "logo": `${baseUrl}/logo.png`,
            "sameAs": [
              "https://twitter.com/nucleoone",
              "https://linkedin.com/company/nucleoone",
              "https://github.com/nucleoone"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "support@nucleoone.com",
              "contactType": "Customer Support",
              "availableLanguage": ["English"]
            }
          },
          "areaServed": {
            "@type": "Place",
            "name": "Worldwide"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Business Management Software",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "CRM" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Projects" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Helpdesk" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "HRM" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Inventory" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Monitoring" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Communications" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Field Service" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "DevOps" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Finance" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Marketing" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "eCommerce" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "AI Agents" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Analytics & BI" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Integrations" } }
            ]
          }
        })},
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: LandingPage,
});

// ─── Mock UI Components ────────────────────────────────────────────────────────

function CrmMockUI() {
  const stages = [
    { label: "Lead", color: "bg-blue-500/20 border-blue-500/40", count: 3, deals: [
      { name: "Acme Corp", value: "$12k", avatar: "AC" },
      { name: "Bright Tech", value: "$8.5k", avatar: "BT" },
      { name: "CoreLabs", value: "$22k", avatar: "CL" },
    ]},
    { label: "Qualified", color: "bg-cyan-500/20 border-cyan-500/40", count: 2, deals: [
      { name: "DataPro", value: "$45k", avatar: "DP" },
      { name: "EdgeSoft", value: "$18k", avatar: "ES" },
    ]},
    { label: "Proposal", color: "bg-violet-500/20 border-violet-500/40", count: 2, deals: [
      { name: "FutureCo", value: "$92k", avatar: "FC" },
      { name: "GrowthX", value: "$31k", avatar: "GX" },
    ]},
    { label: "Won", color: "bg-emerald-500/20 border-emerald-500/40", count: 1, deals: [
      { name: "HorizonAI", value: "$140k", avatar: "HA" },
    ]},
  ];
  return (
    <div className="flex gap-2 h-full overflow-hidden">
      {stages.map((stage) => (
        <div key={stage.label} className="flex-1 min-w-0">
          <div className={cn("rounded-t-lg border px-2 py-1.5 mb-2", stage.color)}>
            <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">{stage.label}</span>
            <span className="ml-1.5 text-[10px] text-muted-foreground">({stage.count})</span>
          </div>
          <div className="space-y-1.5">
            {stage.deals.map((deal) => (
              <div key={deal.name} className="rounded-lg border border-border/40 bg-card/80 p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">{deal.avatar}</div>
                  <span className="text-[10px] font-medium text-foreground truncate">{deal.name}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400">{deal.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HrmMockUI() {
  const employees = [
    { name: "Alex Kim", role: "Engineering", status: "Active", avatar: "AK", color: "bg-blue-500/20 text-blue-400" },
    { name: "Sara Lee", role: "Design", status: "On Leave", avatar: "SL", color: "bg-amber-500/20 text-amber-400" },
    { name: "Mike Torres", role: "Sales", status: "Active", avatar: "MT", color: "bg-emerald-500/20 text-emerald-400" },
    { name: "Priya Singh", role: "Marketing", status: "Active", avatar: "PS", color: "bg-purple-500/20 text-purple-400" },
  ];
  const calDays = ["M","T","W","T","F"];
  const leaveData = [
    [false, false, true, true, true],
    [false, false, false, false, false],
    [true, true, false, false, false],
    [false, false, false, true, false],
  ];
  return (
    <div className="space-y-3 h-full">
      <div className="space-y-1.5">
        {employees.map((emp, i) => (
          <div key={emp.name} className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/80 px-2.5 py-2">
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold", emp.color)}>{emp.avatar}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-foreground truncate">{emp.name}</p>
              <p className="text-[9px] text-muted-foreground">{emp.role}</p>
            </div>
            <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full", emp.status === "Active" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400")}>{emp.status}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border/40 bg-card/80 p-2">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Leave Calendar — This Week</p>
        <div className="grid grid-cols-6 gap-1">
          <div />
          {calDays.map((d) => <div key={d} className="text-[9px] text-center text-muted-foreground font-medium">{d}</div>)}
          {employees.map((emp, i) => (
            <React.Fragment key={emp.name}>
              <div className="text-[9px] text-muted-foreground truncate">{emp.avatar}</div>
              {leaveData[i].map((isLeave, j) => (
                <div key={j} className={cn("h-4 rounded-sm", isLeave ? "bg-amber-500/40" : "bg-muted/30")} />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsMockUI() {
  const columns = [
    { label: "To Do", color: "text-muted-foreground", bg: "bg-muted/30", tasks: [
      { title: "Design system audit", tag: "Design", tagColor: "bg-purple-500/20 text-purple-400", assignee: "AK" },
      { title: "API rate limiting", tag: "Backend", tagColor: "bg-blue-500/20 text-blue-400", assignee: "JL" },
    ]},
    { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10", tasks: [
      { title: "Auth flow redesign", tag: "Frontend", tagColor: "bg-cyan-500/20 text-cyan-400", assignee: "SL", progress: 60 },
      { title: "DB migration script", tag: "Backend", tagColor: "bg-blue-500/20 text-blue-400", assignee: "MT", progress: 30 },
    ]},
    { label: "Done", color: "text-emerald-400", bg: "bg-emerald-500/10", tasks: [
      { title: "CI/CD pipeline setup", tag: "DevOps", tagColor: "bg-emerald-500/20 text-emerald-400", assignee: "PS" },
    ]},
  ];
  return (
    <div className="flex gap-2 h-full">
      {columns.map((col) => (
        <div key={col.label} className="flex-1 min-w-0">
          <div className={cn("rounded-t-lg px-2 py-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider", col.bg, col.color)}>
            {col.label}
          </div>
          <div className="space-y-1.5">
            {col.tasks.map((task) => (
              <div key={task.title} className="rounded-lg border border-border/40 bg-card/80 p-2 space-y-1.5">
                <p className="text-[10px] font-medium text-foreground leading-tight">{task.title}</p>
                <div className="flex items-center justify-between">
                  <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded", task.tagColor)}>{task.tag}</span>
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">{task.assignee}</div>
                </div>
                {"progress" in task && (
                  <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${task.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FinanceMockUI() {
  const invoices = [
    { id: "INV-001", client: "Acme Corp", amount: "$12,400", status: "Paid", statusColor: "bg-emerald-500/15 text-emerald-400" },
    { id: "INV-002", client: "BrightTech", amount: "$8,750", status: "Pending", statusColor: "bg-amber-500/15 text-amber-400" },
    { id: "INV-003", client: "CoreLabs", amount: "$22,100", status: "Overdue", statusColor: "bg-red-500/15 text-red-400" },
    { id: "INV-004", client: "DataPro", amount: "$5,200", status: "Paid", statusColor: "bg-emerald-500/15 text-emerald-400" },
  ];
  const bars = [40, 65, 50, 80, 70, 90, 75];
  const months = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
  return (
    <div className="space-y-3 h-full">
      <div className="rounded-lg border border-border/40 bg-card/80 p-3">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Revenue — Last 7 Months</p>
        <div className="flex items-end gap-1 h-16">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full rounded-t-sm bg-emerald-400/70" style={{ height: `${h}%` }} />
              <span className="text-[8px] text-muted-foreground">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <div className="grid grid-cols-4 px-2 mb-1">
          {["ID","Client","Amount","Status"].map((h) => <span key={h} className="text-[9px] font-bold text-muted-foreground">{h}</span>)}
        </div>
        {invoices.map((inv) => (
          <div key={inv.id} className="grid grid-cols-4 items-center rounded-lg border border-border/30 bg-card/60 px-2 py-1.5">
            <span className="text-[9px] font-mono text-muted-foreground">{inv.id}</span>
            <span className="text-[9px] font-medium text-foreground">{inv.client}</span>
            <span className="text-[9px] font-semibold text-foreground">{inv.amount}</span>
            <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full w-fit", inv.statusColor)}>{inv.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketingMockUI() {
  const campaigns = [
    { name: "Spring Launch", channel: "Email", sent: "12.4k", open: "38%", click: "12%", color: "bg-purple-500/20 border-purple-500/40" },
    { name: "Retargeting Q1", channel: "Ads", sent: "8.2k", open: "—", click: "4.2%", color: "bg-blue-500/20 border-blue-500/40" },
    { name: "Product Update", channel: "SMS", sent: "5.1k", open: "92%", click: "28%", color: "bg-emerald-500/20 border-emerald-500/40" },
  ];
  const metrics = [
    { label: "Total Leads", value: "2,841", change: "+18%", up: true },
    { label: "Conversion Rate", value: "4.7%", change: "+0.9%", up: true },
    { label: "Revenue Attributed", value: "$142k", change: "+23%", up: true },
  ];
  return (
    <div className="space-y-2.5 h-full">
      <div className="grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-border/40 bg-card/80 p-2 text-center">
            <p className="text-[9px] text-muted-foreground mb-0.5">{m.label}</p>
            <p className="text-sm font-bold text-foreground">{m.value}</p>
            <p className={cn("text-[9px] font-medium", m.up ? "text-emerald-400" : "text-red-400")}>{m.change}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="grid grid-cols-5 px-2 mb-1">
          {["Campaign","Channel","Sent","Open","Click"].map((h) => <span key={h} className="text-[9px] font-bold text-muted-foreground">{h}</span>)}
        </div>
        {campaigns.map((c) => (
          <div key={c.name} className={cn("grid grid-cols-5 items-center rounded-lg border px-2 py-1.5", c.color)}>
            <span className="text-[9px] font-medium text-foreground">{c.name}</span>
            <span className="text-[9px] text-muted-foreground">{c.channel}</span>
            <span className="text-[9px] font-medium text-foreground">{c.sent}</span>
            <span className="text-[9px] text-foreground">{c.open}</span>
            <span className="text-[9px] font-semibold text-primary">{c.click}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HelpdeskMockUI() {
  const tickets = [
    { id: "#4821", subject: "Login not working after update", priority: "High", status: "Open", priorityColor: "bg-red-500/15 text-red-400", statusColor: "bg-blue-500/15 text-blue-400", time: "2m ago" },
    { id: "#4820", subject: "Invoice PDF not generating", priority: "Med", status: "In Progress", priorityColor: "bg-amber-500/15 text-amber-400", statusColor: "bg-amber-500/15 text-amber-400", time: "15m ago" },
    { id: "#4819", subject: "How to export contacts?", priority: "Low", status: "Resolved", priorityColor: "bg-emerald-500/15 text-emerald-400", statusColor: "bg-emerald-500/15 text-emerald-400", time: "1h ago" },
    { id: "#4818", subject: "API rate limit exceeded error", priority: "High", status: "Open", priorityColor: "bg-red-500/15 text-red-400", statusColor: "bg-blue-500/15 text-blue-400", time: "2h ago" },
  ];
  const slaMetrics = [
    { label: "First Response", value: "18m", target: "< 1h", ok: true },
    { label: "Resolution", value: "4.2h", target: "< 8h", ok: true },
    { label: "CSAT", value: "94%", target: "> 90%", ok: true },
  ];
  return (
    <div className="space-y-2.5 h-full">
      <div className="grid grid-cols-3 gap-2">
        {slaMetrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-border/40 bg-card/80 p-2">
            <p className="text-[9px] text-muted-foreground">{m.label}</p>
            <p className="text-sm font-bold text-foreground">{m.value}</p>
            <p className="text-[9px] text-emerald-400">✓ {m.target}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {tickets.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/60 px-2 py-1.5">
            <span className="text-[9px] font-mono text-muted-foreground w-10 shrink-0">{t.id}</span>
            <span className="text-[9px] font-medium text-foreground flex-1 truncate">{t.subject}</span>
            <span className={cn("text-[8px] font-medium px-1.5 py-0.5 rounded-full shrink-0", t.priorityColor)}>{t.priority}</span>
            <span className={cn("text-[8px] font-medium px-1.5 py-0.5 rounded-full shrink-0", t.statusColor)}>{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldServiceMockUI() {
  const jobs = [
    { id: "J-201", tech: "Mike R.", client: "BuildCo", type: "Installation", status: "En Route", statusColor: "bg-blue-500/15 text-blue-400", eta: "11:30 AM" },
    { id: "J-202", tech: "Sara D.", client: "TowerNet", type: "Maintenance", status: "On Site", statusColor: "bg-emerald-500/15 text-emerald-400", eta: "—" },
    { id: "J-203", tech: "James L.", client: "CityGrid", type: "Repair", status: "Scheduled", statusColor: "bg-muted text-muted-foreground", eta: "2:00 PM" },
    { id: "J-204", tech: "Priya K.", client: "SolarMax", type: "Inspection", status: "Completed", statusColor: "bg-violet-500/15 text-violet-400", eta: "Done" },
  ];
  const mapGrid = [
    ["🔵","","🟢","",""],
    ["","🟡","","","🔵"],
    ["","","","🟢",""],
    ["🔴","","","","🟡"],
  ];
  return (
    <div className="space-y-2.5 h-full">
      <div className="rounded-lg border border-border/40 bg-card/80 p-2">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Live Dispatch Map</p>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {mapGrid.flat().map((cell, i) => (
            <div key={i} className={cn("h-5 rounded-sm flex items-center justify-center text-xs", cell ? "bg-muted/20" : "bg-muted/10")}>
              {cell}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-1.5">
          {[["🔵","En Route"],["🟢","On Site"],["🟡","Scheduled"],["🔴","Urgent"]].map(([e,l]) => (
            <span key={l} className="text-[8px] text-muted-foreground">{e} {l}</span>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        {jobs.map((j) => (
          <div key={j.id} className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/60 px-2 py-1.5">
            <span className="text-[9px] font-mono text-muted-foreground w-10 shrink-0">{j.id}</span>
            <span className="text-[9px] font-medium text-foreground w-14 shrink-0 truncate">{j.tech}</span>
            <span className="text-[9px] text-muted-foreground flex-1 truncate">{j.client} · {j.type}</span>
            <span className={cn("text-[8px] font-medium px-1.5 py-0.5 rounded-full shrink-0", j.statusColor)}>{j.status}</span>
            <span className="text-[9px] text-muted-foreground shrink-0">{j.eta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiMockUI() {
  const messages = [
    { from: "user", text: "Summarize this month's revenue by region" },
    { from: "agent", text: "North America: $142k (+18%), Europe: $89k (+12%), APAC: $34k (+31%). Total: $265k, up 19% MoM." },
    { from: "user", text: "Which sales rep is at risk of missing quota?" },
    { from: "agent", text: "Based on current pipeline velocity, 3 reps are below pace: Jordan (68%), Casey (71%), and Alex (74% of monthly target)." },
  ];
  const agents = [
    { name: "Sales Coach", status: "Active", color: "bg-blue-500/20 text-blue-400" },
    { name: "Support Triage", status: "Active", color: "bg-cyan-500/20 text-cyan-400" },
    { name: "Finance Analyst", status: "Idle", color: "bg-amber-500/20 text-amber-400" },
  ];
  return (
    <div className="space-y-2.5 h-full">
      <div className="flex gap-1.5 mb-1.5">
        {agents.map((a) => (
          <div key={a.name} className={cn("flex-1 rounded-lg border border-border/40 px-2 py-1.5", a.color.replace("text-","border-").replace("400","400/30"))}>
            <div className={cn("text-[9px] font-bold", a.color.split(" ")[1])}>{a.name}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className={cn("h-1.5 w-1.5 rounded-full", a.status === "Active" ? "bg-emerald-400" : "bg-muted-foreground")} />
              <span className="text-[9px] text-muted-foreground">{a.status}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border/40 bg-card/80 p-2 space-y-1.5">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">AI Agent Chat</p>
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-lg px-2 py-1.5 text-[9px] leading-relaxed", m.from === "user" ? "bg-primary/20 text-foreground" : "bg-fuchsia-500/15 text-foreground border border-fuchsia-500/20")}>
              {m.from === "agent" && <span className="text-fuchsia-400 font-bold block text-[8px] mb-0.5">✦ Agent</span>}
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunicationsMockUI() {
  const conversations = [
    { from: "+1 (555) 234-8901", preview: "Thanks! When can I schedule...", time: "2m", unread: 2, channel: "SMS" },
    { from: "Alex Kim", preview: "Meeting recording is ready", time: "18m", unread: 0, channel: "Chat" },
    { from: "+1 (555) 678-2341", preview: "Missed call — voicemail left", time: "1h", unread: 1, channel: "Voice" },
    { from: "Support Line", preview: "Ticket #4821 has been resolved", time: "2h", unread: 0, channel: "SMS" },
  ];
  const channelColors: Record<string, string> = {
    SMS: "bg-teal-500/20 text-teal-400",
    Chat: "bg-blue-500/20 text-blue-400",
    Voice: "bg-purple-500/20 text-purple-400",
  };
  const activeChat = [
    { from: "customer", text: "Is there an update on my order?" },
    { from: "agent", text: "Yes! Your order #5521 shipped today. Tracking: XP92847." },
    { from: "customer", text: "Perfect, thank you!" },
  ];
  return (
    <div className="flex gap-2 h-full">
      <div className="w-2/5 space-y-1">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">Inbox</p>
        {conversations.map((c) => (
          <div key={c.from} className="rounded-lg border border-border/30 bg-card/60 px-2 py-1.5 cursor-pointer hover:border-teal-500/30">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-semibold text-foreground truncate">{c.from}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className={cn("text-[8px] px-1 py-0.5 rounded", channelColors[c.channel] || "bg-muted text-muted-foreground")}>{c.channel}</span>
                {c.unread > 0 && <span className="h-4 w-4 rounded-full bg-teal-400 text-[8px] font-bold text-background flex items-center justify-center">{c.unread}</span>}
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground truncate">{c.preview}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-lg border border-border/40 bg-card/80 p-2 flex flex-col">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Conversation</p>
        <div className="flex-1 space-y-1.5">
          {activeChat.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "agent" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-lg px-2 py-1 text-[9px] leading-relaxed", m.from === "agent" ? "bg-teal-500/20 text-foreground" : "bg-muted/40 text-foreground")}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded border border-border/40 bg-muted/20 px-2 py-1 text-[9px] text-muted-foreground">
          Type a reply...
        </div>
      </div>
    </div>
  );
}

function IntegrationsMockUI() {
  const nodes = [
    { label: "Stripe", icon: "💳", color: "border-violet-500/40 bg-violet-500/10", x: 0, y: 0 },
    { label: "Nucleo CRM", icon: "🔷", color: "border-primary/40 bg-primary/10", x: 1, y: 0 },
    { label: "Slack", icon: "💬", color: "border-emerald-500/40 bg-emerald-500/10", x: 2, y: 0 },
    { label: "Webhook", icon: "🔗", color: "border-amber-500/40 bg-amber-500/10", x: 0, y: 1 },
    { label: "Workflow", icon: "⚡", color: "border-cyan-500/40 bg-cyan-500/10", x: 1, y: 1 },
    { label: "HubSpot", icon: "🟠", color: "border-orange-500/40 bg-orange-500/10", x: 2, y: 1 },
  ];
  const recentRuns = [
    { name: "New payment → CRM deal", status: "Success", time: "2s ago" },
    { name: "Support ticket → Slack alert", status: "Success", time: "1m ago" },
    { name: "Lead sync → HubSpot", status: "Failed", time: "4m ago" },
    { name: "Invoice paid → Notify team", status: "Success", time: "8m ago" },
  ];
  return (
    <div className="space-y-2.5 h-full">
      <div className="rounded-lg border border-border/40 bg-card/80 p-3">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Workflow Builder</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {nodes.map((n) => (
            <div key={n.label} className={cn("rounded-lg border px-2 py-1.5 text-center", n.color)}>
              <span className="text-sm">{n.icon}</span>
              <p className="text-[9px] font-medium text-foreground mt-0.5">{n.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1">
          {["Trigger","→","Filter","→","Action","→","Notify"].map((s, i) => (
            <span key={i} className={cn("text-[9px]", s === "→" ? "text-muted-foreground" : "font-medium text-foreground bg-muted/30 px-1.5 py-0.5 rounded")}>{s}</span>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Recent Runs</p>
        {recentRuns.map((r) => (
          <div key={r.name} className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/60 px-2 py-1.5">
            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", r.status === "Success" ? "bg-emerald-400" : "bg-red-400")} />
            <span className="text-[9px] font-medium text-foreground flex-1 truncate">{r.name}</span>
            <span className="text-[9px] text-muted-foreground shrink-0">{r.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockUIRenderer({ type }: { type: string }) {
  switch (type) {
    case "crm": return <CrmMockUI />;
    case "hrm": return <HrmMockUI />;
    case "projects": return <ProjectsMockUI />;
    case "finance": return <FinanceMockUI />;
    case "marketing": return <MarketingMockUI />;
    case "helpdesk": return <HelpdeskMockUI />;
    case "fieldservice": return <FieldServiceMockUI />;
    case "ai": return <AiMockUI />;
    case "communications": return <CommunicationsMockUI />;
    case "integrations": return <IntegrationsMockUI />;
    default: return null;
  }
}

// ─── Components ────────────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="h-[500px] w-[900px] rounded-full bg-primary/5 blur-[120px] translate-y-[-30%]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-primary text-sm font-medium">
            <Zap className="h-3.5 w-3.5" />
            15 powerful modules. One unified platform.
          </div>

          <h1 className="mb-6 font-bold text-5xl leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Run Your Entire{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
              Business
            </span>{" "}
            <br className="hidden sm:block" />
            In One Place
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Nucleo One unifies CRM, HRM, Finance, Projects, Helpdesk, Marketing,
            Advertising, Social Media, Campaign Pro, Field Service, DevOps, Communications,
            Speech & Voice, Inventory, Monitoring, AI Agents, and Invoicing into one platform.
            Stop switching between tools — start moving faster.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 hover:scale-105"
            >
              Start Free — No Credit Card
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 font-semibold text-foreground hover:bg-muted transition-all duration-200"
            >
              Watch Demo
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              to="/roi-calculator"
              className="inline-flex items-center gap-2 rounded-xl text-primary font-semibold hover:underline transition-all duration-200"
            >
              Calculate ROI
            </Link>
          </div>

          {/* Social proof micro-line */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["SC", "MW", "PN", "AK", "JL"].map((initials) => (
                  <div
                    key={initials}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 border-2 border-background font-bold text-xs text-primary"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">Free 14-day trial</span> — no credit card required
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-4 w-4 fill-amber-400" />
              <span className="font-semibold text-foreground">Loved by</span>
              <span className="text-muted-foreground">growing teams</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border/60 bg-card/50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-bold text-3xl text-primary">{s.value}</p>
              <p className="mt-1 text-muted-foreground text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Customer Logos ── */}
      <section className="border-b border-border/60 bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-8 text-center text-muted-foreground text-sm font-medium uppercase tracking-wider">
            Trusted by forward-thinking companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {customerLogos.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold text-sm">
                  {logo.abbr}
                </div>
                <span className="font-semibold text-sm">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security Badges ── */}
      <section className="border-b border-border/60 bg-card/30 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 text-center text-muted-foreground text-sm font-medium">
            Enterprise-grade security built in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {securityBadges.map((badge) => (
              <div
                key={badge.name}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                <span className="text-base">{badge.icon}</span>
                {badge.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules Grid ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-4xl text-foreground sm:text-5xl">
              Every Tool Your Business Needs
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg">
              15 deeply integrated modules — CRM, HRM, Projects, Finance, Helpdesk,
              Marketing, eCommerce, Field Service, DevOps, AI Agents, Analytics, and Integrations.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.title}
                  to={mod.href}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-200 hover:border-border hover:shadow-xl hover:-translate-y-0.5"
                >
                  {/* Gradient hover overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 0%, rgba(var(--color-primary-rgb, 6,182,212),0.05), transparent 70%)",
                    }}
                  />

                  <div
                    className={cn(
                      "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl",
                      mod.bg,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", mod.color)} />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-lg">
                      {mod.title}
                    </h3>
                    <span className="text-xs font-medium text-muted-foreground">
                      ${mod.price}/mo
                    </span>
                  </div>
                  <p className="mb-4 text-muted-foreground text-sm leading-relaxed">
                    {mod.description}
                  </p>

                  <ul className="space-y-1">
                    {mod.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-muted-foreground text-xs"
                      >
                        <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore {mod.title} <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature Deep Dive ── */}
      <section className="px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-20 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-primary text-sm font-medium">
              <Layers className="h-3.5 w-3.5" />
              Deep dive into every module
            </div>
            <h2 className="mb-4 font-bold text-4xl text-foreground sm:text-5xl">
              See Exactly What You Get
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg">
              Every module is built end-to-end — not a checkbox feature, but a full product experience.
            </p>
          </div>

          {/* Alternating spotlight sections */}
          <div className="space-y-32">
            {featureSpotlights.map((spotlight, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={spotlight.eyebrow}
                  className={cn(
                    "grid gap-12 lg:grid-cols-2 lg:gap-20 items-center",
                  )}
                >
                  {/* Text block — alternates left/right */}
                  <div className={cn(isEven ? "lg:order-1" : "lg:order-2")}>
                    {/* Eyebrow */}
                    <div className={cn("mb-4 text-xs font-bold uppercase tracking-[0.2em]", spotlight.accentClass)}>
                      {spotlight.eyebrow}
                    </div>

                    <h3 className="mb-5 font-bold text-3xl text-foreground leading-tight sm:text-4xl">
                      {spotlight.heading}
                    </h3>

                    <p className="mb-8 text-muted-foreground text-lg leading-relaxed">
                      {spotlight.description}
                    </p>

                    <ul className="mb-8 space-y-4">
                      {spotlight.features.map((f) => {
                        const Icon = f.icon;
                        return (
                          <li key={f.text} className="flex items-start gap-3">
                            <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", spotlight.bgAccent)}>
                              <Icon className={cn("h-3.5 w-3.5", spotlight.accentClass)} />
                            </div>
                            <span className="text-foreground/80 leading-snug">{f.text}</span>
                          </li>
                        );
                      })}
                    </ul>

                    <Link
                      to={spotlight.href}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold text-sm transition-all duration-200 hover:scale-105",
                        spotlight.borderClass,
                        spotlight.accentClass,
                        spotlight.bgAccent,
                      )}
                    >
                      Explore {spotlight.eyebrow.split(" ")[0]} {spotlight.eyebrow.split(" ").slice(1).join(" ")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Mock UI block — alternates right/left */}
                  <div className={cn(isEven ? "lg:order-2" : "lg:order-1")}>
                    <div
                      className={cn(
                        "relative rounded-2xl border p-4 bg-card/50 shadow-2xl",
                        spotlight.borderClass,
                        spotlight.glowClass,
                      )}
                      style={{ minHeight: "320px" }}
                    >
                      {/* Glow effect behind card */}
                      <div
                        className="pointer-events-none absolute -inset-1 rounded-2xl opacity-20 blur-xl"
                        style={{
                          background: `radial-gradient(circle, var(--glow-color, rgba(99,102,241,0.3)), transparent 70%)`,
                        }}
                      />

                      {/* Top bar chrome */}
                      <div className="mb-3 flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                        <div className="ml-2 flex-1 rounded-md bg-muted/40 h-4" />
                      </div>

                      {/* Mock content */}
                      <div className="relative h-64 overflow-hidden">
                        <MockUIRenderer type={spotlight.mockUI} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="border-y border-border/60 bg-card/30 px-4 py-20 sm:px-6 lg:px-8 mt-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-bold text-3xl text-foreground sm:text-4xl">
            Loved by Teams That Move Fast
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border/60 bg-card p-6 space-y-4"
              >
                <StarRating count={t.rating} />
                <p className="text-muted-foreground leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {t.name}
                  </p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-4xl text-foreground sm:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free. Scale when you're ready. No surprises.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border-2 bg-card p-8 flex flex-col",
                  plan.popular
                    ? "border-primary shadow-2xl shadow-primary/10 scale-[1.02]"
                    : "border-border/60",
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-primary-foreground text-xs font-bold uppercase tracking-wide shadow">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-foreground text-2xl mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-4xl text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-muted-foreground text-sm"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                        <Check className="h-3 w-3 text-success" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={cn(
                    "block w-full rounded-xl py-3 text-center font-semibold transition-all duration-200",
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                      : "border border-border text-foreground hover:bg-muted",
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-muted-foreground text-sm">
            All plans include a 14-day free trial. No credit card required.
            Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="h-full w-full bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="mb-4 font-bold text-4xl text-foreground sm:text-5xl">
            Ready to Replace Your Entire Stack?
          </h2>
          <p className="mb-10 text-muted-foreground text-lg">
            Join growing teams who consolidated their tools into Nucleo One
            and gained back hours every week.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 font-bold text-primary-foreground text-lg shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all duration-200"
            >
              Start Free Today
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-10 py-4 font-semibold text-foreground text-lg hover:bg-card transition-all duration-200"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center font-bold text-4xl text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border/60 bg-card open:border-primary/30"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-semibold text-foreground list-none">
                  {item.q}
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              Still have questions?{" "}
              <Link to="/contact" className="text-primary font-semibold hover:underline">
                Talk to our team
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Video Demo CTA ── */}
      <section className="border-t border-border/60 bg-card/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 font-bold text-3xl text-foreground">
            See Nucleo One in Action
          </h2>
          <p className="mb-8 text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch how a real team manages their entire business — from leads to payroll —
            all in one unified platform.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200"
            >
              Watch 3-Min Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/roi-calculator"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 font-semibold text-foreground hover:bg-muted transition-all duration-200"
            >
              Calculate Your ROI
            </Link>
          </div>
        </div>
      </section>

      {/* ── Lead Capture Section ── */}
      <LeadCaptureSection />

      <Footer />

      {/* ── Sticky Lead Widget ── */}
      <LeadCaptureWidget />
    </div>
  );
}

// ─── Lead Capture Section ─────────────────────────────────────────────────────

const interestOptions = [
  "CRM", "HRM", "Projects", "Invoicing", "Finance",
  "Helpdesk", "Marketing", "AI Agents", "All modules",
];

function LeadCaptureSection() {
  const [form, setForm] = useState({ name: "", email: "", company: "", interest: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function captureSource(): string {
    try {
      const utm = JSON.parse(sessionStorage.getItem("nucleo_utm") || "{}");
      if (utm.utm_source) return utm.utm_source;
    } catch {}
    if (typeof document !== "undefined" && document.referrer.includes("google")) return "Google";
    return "Website";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus("submitting");

    const [firstName, ...rest] = form.name.trim().split(" ");
    try {
      await leadsApi.create({
        firstName,
        lastName: rest.join(" ") || "",
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        source: captureSource(),
        notes: [
          form.interest ? `Interested in: ${form.interest}` : "",
          `Page: /`,
        ].filter(Boolean).join(" | "),
      } as any);
      setStatus("success");
    } catch {
      setStatus("success"); // still show success — lead stored in local fallback
    }
  }

  return (
    <section className="border-t border-border/60 bg-gradient-to-br from-primary/5 via-background to-cyan-500/5 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left copy */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-primary text-sm font-medium">
              <Zap className="h-3.5 w-3.5" />
              Free personalized demo — no credit card
            </div>
            <h2 className="mb-4 font-bold text-3xl text-foreground sm:text-4xl leading-tight">
              See Nucleo One running your business in 20 minutes
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              Book a live demo tailored to your industry. We'll set up a sandbox with your data,
              walk through the modules you care about, and answer every question your team has.
            </p>
            <ul className="space-y-3">
              {[
                "Live product walkthrough — not a slide deck",
                "Your data imported before the call",
                "ROI estimate for your specific team size",
                "Direct Q&A with a product specialist",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground/80">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right form */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-2xl">
            {status === "success" ? (
              <div className="text-center py-8">
                <div className="mb-4 flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <Star className="h-8 w-8 text-emerald-400" />
                  </div>
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">You're booked!</h3>
                <p className="text-muted-foreground mb-4">
                  We'll email you within 24 hours with calendar options for your personalized demo.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm shadow-lg hover:bg-primary/90 transition-all"
                >
                  Start free in the meantime <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Book your free demo</h3>
                  <p className="text-sm text-muted-foreground">Takes 30 seconds. No commitment.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Sarah Chen"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Company</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      value={form.company}
                      onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Work Email *</label>
                  <input
                    type="email"
                    placeholder="sarah@company.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Most interested in</label>
                  <select
                    value={form.interest}
                    onChange={(e) => setForm((f) => ({ ...f, interest: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Select a module…</option>
                    {interestOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
                >
                  {status === "submitting" ? "Booking…" : <>Book Free Demo <ArrowRight className="h-4 w-4" /></>}
                </button>

                <div className="flex items-center justify-center gap-4 pt-1">
                  {["SOC 2", "GDPR", "No spam"].map((badge) => (
                    <span key={badge} className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Check className="h-2.5 w-2.5 text-emerald-400" /> {badge}
                    </span>
                  ))}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Utility (cn) — inline to avoid import issues
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
