CREATE TABLE "ai_agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"agent_name" varchar(120) NOT NULL,
	"prompt" text NOT NULL,
	"status" varchar(40) DEFAULT 'completed' NOT NULL,
	"output" text,
	"confidence" numeric(5, 2),
	"model" varchar(80),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"stage_order" integer NOT NULL,
	"approver_role" varchar(120) NOT NULL,
	"sla_hours" integer,
	"is_required" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"owner_team" varchar(120) DEFAULT 'operations' NOT NULL,
	"stage_count" integer DEFAULT 1 NOT NULL,
	"status" varchar(40) DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"employee_id" uuid NOT NULL,
	"attendance_date" timestamp with time zone NOT NULL,
	"status" varchar(40) DEFAULT 'present' NOT NULL,
	"hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"check_in_at" timestamp with time zone,
	"check_out_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"employee_code" varchar(64),
	"full_name" varchar(255) NOT NULL,
	"work_email" varchar(255) NOT NULL,
	"department" varchar(120) DEFAULT 'General' NOT NULL,
	"job_title" varchar(160),
	"manager_name" varchar(255),
	"employment_type" varchar(60) DEFAULT 'full_time' NOT NULL,
	"status" varchar(40) DEFAULT 'active' NOT NULL,
	"location" varchar(120),
	"join_date" timestamp with time zone,
	"metadata" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"source" varchar(80) DEFAULT 'manual' NOT NULL,
	"actor" varchar(255),
	"action" text NOT NULL,
	"severity" varchar(20) DEFAULT 'low' NOT NULL,
	"event_time" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"scope" text NOT NULL,
	"risk_level" varchar(40) DEFAULT 'low' NOT NULL,
	"assigned_users" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "executive_kpi_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"metric_key" varchar(120) NOT NULL,
	"metric_label" varchar(255) NOT NULL,
	"metric_value" numeric(18, 4) DEFAULT '0' NOT NULL,
	"metric_text" text,
	"period_label" varchar(80),
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"pipeline_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"win_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"avg_sales_cycle_days" integer DEFAULT 0 NOT NULL,
	"projected_revenue" numeric(15, 2) DEFAULT '0' NOT NULL,
	"risk_band" varchar(20) DEFAULT 'medium' NOT NULL,
	"confidence" numeric(5, 2) DEFAULT '0' NOT NULL,
	"recommendations" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type" varchar(60) DEFAULT 'annual' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"reason" text,
	"status" varchar(40) DEFAULT 'pending' NOT NULL,
	"approver_id" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"employee_id" uuid NOT NULL,
	"review_cycle" varchar(80) NOT NULL,
	"rating" varchar(40) DEFAULT 'not_rated' NOT NULL,
	"goals_progress" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"reviewer_id" text,
	"status" varchar(40) DEFAULT 'draft' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scim_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"provider_id" uuid,
	"status" varchar(40) DEFAULT 'queued' NOT NULL,
	"direction" varchar(40) DEFAULT 'inbound' NOT NULL,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"triggered_by" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sso_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"provider_name" varchar(120) NOT NULL,
	"provider_type" varchar(60) DEFAULT 'oidc' NOT NULL,
	"status" varchar(40) DEFAULT 'connected' NOT NULL,
	"config" jsonb,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_agent_runs" ADD CONSTRAINT "ai_agent_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent_runs" ADD CONSTRAINT "ai_agent_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_stages" ADD CONSTRAINT "approval_stages_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."approval_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_audit_events" ADD CONSTRAINT "enterprise_audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_roles" ADD CONSTRAINT "enterprise_roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_roles" ADD CONSTRAINT "enterprise_roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executive_kpi_snapshots" ADD CONSTRAINT "executive_kpi_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executive_kpi_snapshots" ADD CONSTRAINT "executive_kpi_snapshots_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_snapshots" ADD CONSTRAINT "forecast_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_snapshots" ADD CONSTRAINT "forecast_snapshots_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_sync_jobs" ADD CONSTRAINT "scim_sync_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_sync_jobs" ADD CONSTRAINT "scim_sync_jobs_provider_id_sso_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."sso_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scim_sync_jobs" ADD CONSTRAINT "scim_sync_jobs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_providers" ADD CONSTRAINT "sso_providers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_agent_runs_org" ON "ai_agent_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_agent_runs_agent" ON "ai_agent_runs" USING btree ("agent_name");--> statement-breakpoint
CREATE INDEX "idx_ai_agent_runs_status" ON "ai_agent_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_agent_runs_created" ON "ai_agent_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_approval_stages_workflow" ON "approval_stages" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_approval_stages_order" ON "approval_stages" USING btree ("stage_order");--> statement-breakpoint
CREATE INDEX "idx_approval_workflows_org" ON "approval_workflows" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_approval_workflows_owner" ON "approval_workflows" USING btree ("owner_team");--> statement-breakpoint
CREATE INDEX "idx_approval_workflows_status" ON "approval_workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_org" ON "attendance_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_employee" ON "attendance_logs" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_logs_date" ON "attendance_logs" USING btree ("attendance_date");--> statement-breakpoint
CREATE INDEX "idx_employees_org" ON "employees" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_employees_email" ON "employees" USING btree ("work_email");--> statement-breakpoint
CREATE INDEX "idx_employees_department" ON "employees" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_employees_status" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_enterprise_audit_events_org" ON "enterprise_audit_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_audit_events_time" ON "enterprise_audit_events" USING btree ("event_time");--> statement-breakpoint
CREATE INDEX "idx_enterprise_audit_events_severity" ON "enterprise_audit_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_enterprise_roles_org" ON "enterprise_roles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_roles_name" ON "enterprise_roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_enterprise_roles_risk" ON "enterprise_roles" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "idx_executive_kpi_snapshots_org" ON "executive_kpi_snapshots" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_executive_kpi_snapshots_key" ON "executive_kpi_snapshots" USING btree ("metric_key");--> statement-breakpoint
CREATE INDEX "idx_executive_kpi_snapshots_observed" ON "executive_kpi_snapshots" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "idx_forecast_snapshots_org" ON "forecast_snapshots" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_forecast_snapshots_risk" ON "forecast_snapshots" USING btree ("risk_band");--> statement-breakpoint
CREATE INDEX "idx_forecast_snapshots_created" ON "forecast_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_org" ON "leave_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_employee" ON "leave_requests" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_status" ON "leave_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_leave_requests_start_date" ON "leave_requests" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_org" ON "performance_reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_employee" ON "performance_reviews" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_cycle" ON "performance_reviews" USING btree ("review_cycle");--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_status" ON "performance_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scim_sync_jobs_org" ON "scim_sync_jobs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_scim_sync_jobs_status" ON "scim_sync_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scim_sync_jobs_provider" ON "scim_sync_jobs" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_scim_sync_jobs_created" ON "scim_sync_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sso_providers_org" ON "sso_providers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_sso_providers_name" ON "sso_providers" USING btree ("provider_name");--> statement-breakpoint
CREATE INDEX "idx_sso_providers_status" ON "sso_providers" USING btree ("status");