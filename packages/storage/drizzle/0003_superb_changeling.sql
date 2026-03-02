CREATE TABLE "compliance_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"framework" varchar(80) DEFAULT 'SOC2' NOT NULL,
	"control" text NOT NULL,
	"owner" varchar(120) DEFAULT 'Security' NOT NULL,
	"status" varchar(40) DEFAULT 'planned' NOT NULL,
	"evidence_due" timestamp with time zone,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"owner" varchar(120) DEFAULT 'Security' NOT NULL,
	"mitigation" text,
	"status" varchar(40) DEFAULT 'open' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts_register" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"counterparty" varchar(255) NOT NULL,
	"owner_team" varchar(120) DEFAULT 'Legal' NOT NULL,
	"status" varchar(40) DEFAULT 'draft' NOT NULL,
	"renewal_date" timestamp with time zone,
	"compliance_notes" text,
	"metadata" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_drills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"scenario" text NOT NULL,
	"rto" varchar(40) NOT NULL,
	"rpo" varchar(40) NOT NULL,
	"drill_date" timestamp with time zone,
	"status" varchar(40) DEFAULT 'planned' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"type" varchar(60) DEFAULT 'expense' NOT NULL,
	"category" varchar(120) DEFAULT 'general' NOT NULL,
	"reference" varchar(120),
	"amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(12) DEFAULT 'USD' NOT NULL,
	"status" varchar(40) DEFAULT 'posted' NOT NULL,
	"counterparty" varchar(255),
	"description" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(120) DEFAULT 'General' NOT NULL,
	"content" text NOT NULL,
	"status" varchar(40) DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid,
	"gross_pay" numeric(15, 2) DEFAULT '0' NOT NULL,
	"deductions" numeric(15, 2) DEFAULT '0' NOT NULL,
	"net_pay" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" varchar(40) DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"period_label" varchar(80) NOT NULL,
	"pay_date" timestamp with time zone NOT NULL,
	"status" varchar(40) DEFAULT 'draft' NOT NULL,
	"total_gross" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_deductions" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_net" numeric(15, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"department" varchar(120) DEFAULT 'Operations' NOT NULL,
	"amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(12) DEFAULT 'USD' NOT NULL,
	"vendor_id" uuid,
	"status" varchar(40) DEFAULT 'pending' NOT NULL,
	"requested_by" text,
	"approved_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"data_class" varchar(160) NOT NULL,
	"retention_period" varchar(120) NOT NULL,
	"backup_frequency" varchar(80) DEFAULT 'Daily' NOT NULL,
	"archive_policy" text,
	"status" varchar(40) DEFAULT 'active' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" text,
	"message" text NOT NULL,
	"is_internal" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(120) DEFAULT 'Services' NOT NULL,
	"sla_tier" varchar(80) DEFAULT 'Standard' NOT NULL,
	"risk" varchar(40) DEFAULT 'low' NOT NULL,
	"on_time_rate" integer DEFAULT 95 NOT NULL,
	"status" varchar(40) DEFAULT 'active' NOT NULL,
	"contact_email" varchar(255),
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compliance_controls" ADD CONSTRAINT "compliance_controls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_controls" ADD CONSTRAINT "compliance_controls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_risks" ADD CONSTRAINT "compliance_risks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_risks" ADD CONSTRAINT "compliance_risks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts_register" ADD CONSTRAINT "contracts_register_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts_register" ADD CONSTRAINT "contracts_register_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dr_drills" ADD CONSTRAINT "dr_drills_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dr_drills" ADD CONSTRAINT "dr_drills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_compliance_controls_org" ON "compliance_controls" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_controls_framework" ON "compliance_controls" USING btree ("framework");--> statement-breakpoint
CREATE INDEX "idx_compliance_controls_status" ON "compliance_controls" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_compliance_risks_org" ON "compliance_risks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_risks_severity" ON "compliance_risks" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_compliance_risks_status" ON "compliance_risks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contracts_register_org" ON "contracts_register" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_register_status" ON "contracts_register" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contracts_register_owner" ON "contracts_register" USING btree ("owner_team");--> statement-breakpoint
CREATE INDEX "idx_contracts_register_renewal" ON "contracts_register" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "idx_dr_drills_org" ON "dr_drills" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_dr_drills_status" ON "dr_drills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_dr_drills_date" ON "dr_drills" USING btree ("drill_date");--> statement-breakpoint
CREATE INDEX "idx_finance_transactions_org" ON "finance_transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_finance_transactions_type" ON "finance_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_finance_transactions_status" ON "finance_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_finance_transactions_date" ON "finance_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_knowledge_articles_org" ON "knowledge_articles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_articles_status" ON "knowledge_articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_knowledge_articles_category" ON "knowledge_articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_payroll_entries_run" ON "payroll_entries" USING btree ("payroll_run_id");--> statement-breakpoint
CREATE INDEX "idx_payroll_entries_employee" ON "payroll_entries" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_payroll_entries_status" ON "payroll_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payroll_runs_org" ON "payroll_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_payroll_runs_status" ON "payroll_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payroll_runs_pay_date" ON "payroll_runs" USING btree ("pay_date");--> statement-breakpoint
CREATE INDEX "idx_purchase_requests_org" ON "purchase_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_requests_status" ON "purchase_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_purchase_requests_vendor" ON "purchase_requests" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_requests_department" ON "purchase_requests" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_retention_policies_org" ON "retention_policies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_retention_policies_status" ON "retention_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_retention_policies_class" ON "retention_policies" USING btree ("data_class");--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_org" ON "ticket_comments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_ticket" ON "ticket_comments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_comments_created" ON "ticket_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_vendors_org" ON "vendors" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_vendors_name" ON "vendors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_vendors_status" ON "vendors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_vendors_risk" ON "vendors" USING btree ("risk");