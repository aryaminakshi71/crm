CREATE TABLE "employee_training_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"employee_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"completion_status" varchar(40) DEFAULT 'assigned' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"score" integer,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"requisition_id" uuid,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(64),
	"stage" varchar(40) DEFAULT 'sourced' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"source" varchar(80) DEFAULT 'application' NOT NULL,
	"resume_url" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment_requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"department" varchar(120) DEFAULT 'General' NOT NULL,
	"employment_type" varchar(60) DEFAULT 'full_time' NOT NULL,
	"openings" integer DEFAULT 1 NOT NULL,
	"status" varchar(40) DEFAULT 'open' NOT NULL,
	"hiring_manager" varchar(255),
	"budget" numeric(12, 2),
	"target_hire_date" timestamp with time zone,
	"description" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(120) DEFAULT 'General' NOT NULL,
	"provider" varchar(255),
	"duration_hours" integer DEFAULT 1 NOT NULL,
	"status" varchar(40) DEFAULT 'active' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"description" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_training_records" ADD CONSTRAINT "employee_training_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_training_records" ADD CONSTRAINT "employee_training_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_training_records" ADD CONSTRAINT "employee_training_records_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_candidates" ADD CONSTRAINT "recruitment_candidates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_candidates" ADD CONSTRAINT "recruitment_candidates_requisition_id_recruitment_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."recruitment_requisitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_candidates" ADD CONSTRAINT "recruitment_candidates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_requisitions" ADD CONSTRAINT "recruitment_requisitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_requisitions" ADD CONSTRAINT "recruitment_requisitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_employee_training_records_org" ON "employee_training_records" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_employee_training_records_employee" ON "employee_training_records" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_employee_training_records_program" ON "employee_training_records" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_employee_training_records_status" ON "employee_training_records" USING btree ("completion_status");--> statement-breakpoint
CREATE INDEX "idx_recruitment_candidates_org" ON "recruitment_candidates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_recruitment_candidates_requisition" ON "recruitment_candidates" USING btree ("requisition_id");--> statement-breakpoint
CREATE INDEX "idx_recruitment_candidates_stage" ON "recruitment_candidates" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_recruitment_requisitions_org" ON "recruitment_requisitions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_recruitment_requisitions_status" ON "recruitment_requisitions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_recruitment_requisitions_department" ON "recruitment_requisitions" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_training_programs_org" ON "training_programs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_training_programs_status" ON "training_programs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_training_programs_category" ON "training_programs" USING btree ("category");