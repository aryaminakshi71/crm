import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, orgAuthed, schema } from "../procedures";

const pageInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(50),
});

function toOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export const operationsRouter = {
  summary: orgAuthed
    .route({
      method: "GET",
      path: "/operations/summary",
      summary: "Get operations modules summary",
      tags: ["Operations"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [vendors, requests, contracts, controls, risks, retention, drills, financeCount, financeSpend, payrollRuns, knowledge] =
        await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(schema.vendors).where(eq(schema.vendors.organizationId, orgId)),
          db.select({ count: sql<number>`count(*)` }).from(schema.purchaseRequests).where(eq(schema.purchaseRequests.organizationId, orgId)),
          db.select({ count: sql<number>`count(*)` }).from(schema.contractsRegister).where(eq(schema.contractsRegister.organizationId, orgId)),
          db.select({ count: sql<number>`count(*)` }).from(schema.complianceControls).where(eq(schema.complianceControls.organizationId, orgId)),
          db.select({ count: sql<number>`count(*)` }).from(schema.complianceRisks).where(eq(schema.complianceRisks.organizationId, orgId)),
          db.select({ count: sql<number>`count(*)` }).from(schema.retentionPolicies).where(eq(schema.retentionPolicies.organizationId, orgId)),
          db.select({ count: sql<number>`count(*)` }).from(schema.drDrills).where(eq(schema.drDrills.organizationId, orgId)),
          db.select({ count: sql<number>`count(*)` }).from(schema.financeTransactions).where(eq(schema.financeTransactions.organizationId, orgId)),
          db.select({ total: sql<number>`coalesce(sum(${schema.financeTransactions.amount}), 0)` }).from(schema.financeTransactions).where(eq(schema.financeTransactions.organizationId, orgId)),
          db.select({ count: sql<number>`count(*)` }).from(schema.payrollRuns).where(eq(schema.payrollRuns.organizationId, orgId)),
          db.select({ count: sql<number>`count(*)` }).from(schema.knowledgeArticles).where(eq(schema.knowledgeArticles.organizationId, orgId)),
        ]);

      return {
        vendors: Number(vendors[0]?.count || 0),
        purchaseRequests: Number(requests[0]?.count || 0),
        contracts: Number(contracts[0]?.count || 0),
        complianceControls: Number(controls[0]?.count || 0),
        complianceRisks: Number(risks[0]?.count || 0),
        retentionPolicies: Number(retention[0]?.count || 0),
        drDrills: Number(drills[0]?.count || 0),
        financeTransactions: Number(financeCount[0]?.count || 0),
        financeSpend: Number(financeSpend[0]?.total || 0),
        payrollRuns: Number(payrollRuns[0]?.count || 0),
        knowledgeArticles: Number(knowledge[0]?.count || 0),
      };
    }),

  vendorsList: orgAuthed
    .route({ method: "GET", path: "/operations/vendors", summary: "List vendors", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const data = await db
        .select()
        .from(schema.vendors)
        .where(eq(schema.vendors.organizationId, context.organization.id))
        .orderBy(desc(schema.vendors.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  vendorsCreate: orgAuthed
    .route({ method: "POST", path: "/operations/vendors", summary: "Create vendor", tags: ["Operations"] })
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string().default("Services"),
        slaTier: z.string().default("Standard"),
        risk: z.enum(["low", "medium", "high"]).default("low"),
        onTimeRate: z.number().int().min(0).max(100).default(95),
        status: z.string().default("active"),
        contactEmail: z.string().email().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .insert(schema.vendors)
        .values({
          organizationId: context.organization.id,
          name: input.name,
          category: input.category,
          slaTier: input.slaTier,
          risk: input.risk,
          onTimeRate: input.onTimeRate,
          status: input.status,
          contactEmail: input.contactEmail || null,
          notes: input.notes || null,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  vendorsUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/vendors/:id", summary: "Update vendor", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), name: z.string().optional(), category: z.string().optional(), slaTier: z.string().optional(), risk: z.string().optional(), onTimeRate: z.number().int().min(0).max(100).optional(), status: z.string().optional(), contactEmail: z.string().email().optional(), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .update(schema.vendors)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.slaTier !== undefined ? { slaTier: input.slaTier } : {}),
          ...(input.risk !== undefined ? { risk: input.risk } : {}),
          ...(input.onTimeRate !== undefined ? { onTimeRate: input.onTimeRate } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.vendors.id, input.id), eq(schema.vendors.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  vendorsDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/vendors/:id", summary: "Delete vendor", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.vendors)
        .where(and(eq(schema.vendors.id, input.id), eq(schema.vendors.organizationId, context.organization.id)));
      return { success: true };
    }),

  purchaseRequestsList: orgAuthed
    .route({ method: "GET", path: "/operations/purchase-requests", summary: "List purchase requests", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const data = await db
        .select({
          id: schema.purchaseRequests.id,
          title: schema.purchaseRequests.title,
          department: schema.purchaseRequests.department,
          amount: schema.purchaseRequests.amount,
          currency: schema.purchaseRequests.currency,
          vendorId: schema.purchaseRequests.vendorId,
          vendorName: schema.vendors.name,
          status: schema.purchaseRequests.status,
          notes: schema.purchaseRequests.notes,
          createdAt: schema.purchaseRequests.createdAt,
          updatedAt: schema.purchaseRequests.updatedAt,
        })
        .from(schema.purchaseRequests)
        .leftJoin(schema.vendors, eq(schema.purchaseRequests.vendorId, schema.vendors.id))
        .where(eq(schema.purchaseRequests.organizationId, context.organization.id))
        .orderBy(desc(schema.purchaseRequests.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  purchaseRequestsCreate: orgAuthed
    .route({ method: "POST", path: "/operations/purchase-requests", summary: "Create purchase request", tags: ["Operations"] })
    .input(z.object({ title: z.string().min(1), department: z.string().default("Operations"), amount: z.number().nonnegative(), currency: z.string().default("USD"), vendorId: z.string().uuid().optional(), status: z.string().default("pending"), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.purchaseRequests)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          department: input.department,
          amount: String(input.amount),
          currency: input.currency,
          vendorId: input.vendorId || null,
          status: input.status,
          notes: input.notes || null,
          requestedBy: context.user.id,
        })
        .returning();
      return row;
    }),

  purchaseRequestsUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/purchase-requests/:id", summary: "Update purchase request", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), title: z.string().optional(), department: z.string().optional(), amount: z.number().nonnegative().optional(), currency: z.string().optional(), vendorId: z.string().uuid().optional(), status: z.string().optional(), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .update(schema.purchaseRequests)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.department !== undefined ? { department: input.department } : {}),
          ...(input.amount !== undefined ? { amount: String(input.amount) } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.vendorId !== undefined ? { vendorId: input.vendorId } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.status === "approved" ? { approvedBy: context.user.id } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.purchaseRequests.id, input.id), eq(schema.purchaseRequests.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  purchaseRequestsDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/purchase-requests/:id", summary: "Delete purchase request", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.purchaseRequests)
        .where(and(eq(schema.purchaseRequests.id, input.id), eq(schema.purchaseRequests.organizationId, context.organization.id)));
      return { success: true };
    }),

  contractsList: orgAuthed
    .route({ method: "GET", path: "/operations/contracts", summary: "List contracts", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const data = await getDb(context)
        .select()
        .from(schema.contractsRegister)
        .where(eq(schema.contractsRegister.organizationId, context.organization.id))
        .orderBy(desc(schema.contractsRegister.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  contractsCreate: orgAuthed
    .route({ method: "POST", path: "/operations/contracts", summary: "Create contract", tags: ["Operations"] })
    .input(z.object({ title: z.string().min(1), counterparty: z.string().min(1), ownerTeam: z.string().default("Legal"), status: z.string().default("draft"), renewalDate: z.string().datetime().optional(), complianceNotes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.contractsRegister)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          counterparty: input.counterparty,
          ownerTeam: input.ownerTeam,
          status: input.status,
          renewalDate: input.renewalDate ? new Date(input.renewalDate) : null,
          complianceNotes: input.complianceNotes || null,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  contractsUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/contracts/:id", summary: "Update contract", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), title: z.string().optional(), counterparty: z.string().optional(), ownerTeam: z.string().optional(), status: z.string().optional(), renewalDate: z.string().datetime().optional(), complianceNotes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .update(schema.contractsRegister)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.counterparty !== undefined ? { counterparty: input.counterparty } : {}),
          ...(input.ownerTeam !== undefined ? { ownerTeam: input.ownerTeam } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.renewalDate !== undefined ? { renewalDate: new Date(input.renewalDate) } : {}),
          ...(input.complianceNotes !== undefined ? { complianceNotes: input.complianceNotes } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.contractsRegister.id, input.id), eq(schema.contractsRegister.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  contractsDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/contracts/:id", summary: "Delete contract", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.contractsRegister)
        .where(and(eq(schema.contractsRegister.id, input.id), eq(schema.contractsRegister.organizationId, context.organization.id)));
      return { success: true };
    }),

  controlsList: orgAuthed
    .route({ method: "GET", path: "/operations/compliance-controls", summary: "List compliance controls", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const data = await getDb(context)
        .select()
        .from(schema.complianceControls)
        .where(eq(schema.complianceControls.organizationId, context.organization.id))
        .orderBy(desc(schema.complianceControls.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  controlsCreate: orgAuthed
    .route({ method: "POST", path: "/operations/compliance-controls", summary: "Create compliance control", tags: ["Operations"] })
    .input(z.object({ framework: z.string().default("SOC2"), control: z.string().min(1), owner: z.string().default("Security"), status: z.string().default("planned"), evidenceDue: z.string().datetime().optional(), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.complianceControls)
        .values({
          organizationId: context.organization.id,
          framework: input.framework,
          control: input.control,
          owner: input.owner,
          status: input.status,
          evidenceDue: input.evidenceDue ? new Date(input.evidenceDue) : null,
          notes: input.notes || null,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  controlsUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/compliance-controls/:id", summary: "Update compliance control", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), framework: z.string().optional(), control: z.string().optional(), owner: z.string().optional(), status: z.string().optional(), evidenceDue: z.string().datetime().optional(), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .update(schema.complianceControls)
        .set({
          ...(input.framework !== undefined ? { framework: input.framework } : {}),
          ...(input.control !== undefined ? { control: input.control } : {}),
          ...(input.owner !== undefined ? { owner: input.owner } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.evidenceDue !== undefined ? { evidenceDue: new Date(input.evidenceDue) } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.complianceControls.id, input.id), eq(schema.complianceControls.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  controlsDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/compliance-controls/:id", summary: "Delete compliance control", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.complianceControls)
        .where(and(eq(schema.complianceControls.id, input.id), eq(schema.complianceControls.organizationId, context.organization.id)));
      return { success: true };
    }),

  risksList: orgAuthed
    .route({ method: "GET", path: "/operations/compliance-risks", summary: "List compliance risks", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const data = await getDb(context)
        .select()
        .from(schema.complianceRisks)
        .where(eq(schema.complianceRisks.organizationId, context.organization.id))
        .orderBy(desc(schema.complianceRisks.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  risksCreate: orgAuthed
    .route({ method: "POST", path: "/operations/compliance-risks", summary: "Create compliance risk", tags: ["Operations"] })
    .input(z.object({ title: z.string().min(1), severity: z.enum(["low", "medium", "high"]).default("medium"), owner: z.string().default("Security"), mitigation: z.string().optional(), status: z.string().default("open") }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.complianceRisks)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          severity: input.severity,
          owner: input.owner,
          mitigation: input.mitigation || null,
          status: input.status,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  risksUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/compliance-risks/:id", summary: "Update compliance risk", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), title: z.string().optional(), severity: z.string().optional(), owner: z.string().optional(), mitigation: z.string().optional(), status: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .update(schema.complianceRisks)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.severity !== undefined ? { severity: input.severity } : {}),
          ...(input.owner !== undefined ? { owner: input.owner } : {}),
          ...(input.mitigation !== undefined ? { mitigation: input.mitigation } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.complianceRisks.id, input.id), eq(schema.complianceRisks.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  risksDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/compliance-risks/:id", summary: "Delete compliance risk", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.complianceRisks)
        .where(and(eq(schema.complianceRisks.id, input.id), eq(schema.complianceRisks.organizationId, context.organization.id)));
      return { success: true };
    }),

  retentionPoliciesList: orgAuthed
    .route({ method: "GET", path: "/operations/retention-policies", summary: "List retention policies", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const data = await getDb(context)
        .select()
        .from(schema.retentionPolicies)
        .where(eq(schema.retentionPolicies.organizationId, context.organization.id))
        .orderBy(desc(schema.retentionPolicies.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  retentionPoliciesCreate: orgAuthed
    .route({ method: "POST", path: "/operations/retention-policies", summary: "Create retention policy", tags: ["Operations"] })
    .input(z.object({ dataClass: z.string().min(1), retentionPeriod: z.string().min(1), backupFrequency: z.string().default("Daily"), archivePolicy: z.string().optional(), status: z.string().default("active") }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.retentionPolicies)
        .values({
          organizationId: context.organization.id,
          dataClass: input.dataClass,
          retentionPeriod: input.retentionPeriod,
          backupFrequency: input.backupFrequency,
          archivePolicy: input.archivePolicy || null,
          status: input.status,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  retentionPoliciesUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/retention-policies/:id", summary: "Update retention policy", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), dataClass: z.string().optional(), retentionPeriod: z.string().optional(), backupFrequency: z.string().optional(), archivePolicy: z.string().optional(), status: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .update(schema.retentionPolicies)
        .set({
          ...(input.dataClass !== undefined ? { dataClass: input.dataClass } : {}),
          ...(input.retentionPeriod !== undefined ? { retentionPeriod: input.retentionPeriod } : {}),
          ...(input.backupFrequency !== undefined ? { backupFrequency: input.backupFrequency } : {}),
          ...(input.archivePolicy !== undefined ? { archivePolicy: input.archivePolicy } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.retentionPolicies.id, input.id), eq(schema.retentionPolicies.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  retentionPoliciesDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/retention-policies/:id", summary: "Delete retention policy", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.retentionPolicies)
        .where(and(eq(schema.retentionPolicies.id, input.id), eq(schema.retentionPolicies.organizationId, context.organization.id)));
      return { success: true };
    }),

  drDrillsList: orgAuthed
    .route({ method: "GET", path: "/operations/dr-drills", summary: "List DR drills", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const data = await getDb(context)
        .select()
        .from(schema.drDrills)
        .where(eq(schema.drDrills.organizationId, context.organization.id))
        .orderBy(desc(schema.drDrills.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  drDrillsCreate: orgAuthed
    .route({ method: "POST", path: "/operations/dr-drills", summary: "Create DR drill", tags: ["Operations"] })
    .input(z.object({ scenario: z.string().min(1), rto: z.string().min(1), rpo: z.string().min(1), drillDate: z.string().datetime().optional(), status: z.string().default("planned"), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.drDrills)
        .values({
          organizationId: context.organization.id,
          scenario: input.scenario,
          rto: input.rto,
          rpo: input.rpo,
          drillDate: input.drillDate ? new Date(input.drillDate) : null,
          status: input.status,
          notes: input.notes || null,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  drDrillsUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/dr-drills/:id", summary: "Update DR drill", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), scenario: z.string().optional(), rto: z.string().optional(), rpo: z.string().optional(), drillDate: z.string().datetime().optional(), status: z.string().optional(), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .update(schema.drDrills)
        .set({
          ...(input.scenario !== undefined ? { scenario: input.scenario } : {}),
          ...(input.rto !== undefined ? { rto: input.rto } : {}),
          ...(input.rpo !== undefined ? { rpo: input.rpo } : {}),
          ...(input.drillDate !== undefined ? { drillDate: new Date(input.drillDate) } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.drDrills.id, input.id), eq(schema.drDrills.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  drDrillsDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/dr-drills/:id", summary: "Delete DR drill", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.drDrills)
        .where(and(eq(schema.drDrills.id, input.id), eq(schema.drDrills.organizationId, context.organization.id)));
      return { success: true };
    }),

  financeTransactionsList: orgAuthed
    .route({ method: "GET", path: "/operations/finance-transactions", summary: "List finance transactions", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const data = await getDb(context)
        .select()
        .from(schema.financeTransactions)
        .where(eq(schema.financeTransactions.organizationId, context.organization.id))
        .orderBy(desc(schema.financeTransactions.transactionDate))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  financeTransactionsCreate: orgAuthed
    .route({ method: "POST", path: "/operations/finance-transactions", summary: "Create finance transaction", tags: ["Operations"] })
    .input(z.object({ transactionDate: z.string().datetime().optional(), type: z.string().default("expense"), category: z.string().default("general"), reference: z.string().optional(), amount: z.number(), currency: z.string().default("USD"), status: z.string().default("posted"), counterparty: z.string().optional(), description: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.financeTransactions)
        .values({
          organizationId: context.organization.id,
          transactionDate: input.transactionDate ? new Date(input.transactionDate) : new Date(),
          type: input.type,
          category: input.category,
          reference: input.reference || null,
          amount: String(input.amount),
          currency: input.currency,
          status: input.status,
          counterparty: input.counterparty || null,
          description: input.description || null,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  financeTransactionsUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/finance-transactions/:id", summary: "Update finance transaction", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), transactionDate: z.string().datetime().optional(), type: z.string().optional(), category: z.string().optional(), reference: z.string().optional(), amount: z.number().optional(), currency: z.string().optional(), status: z.string().optional(), counterparty: z.string().optional(), description: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .update(schema.financeTransactions)
        .set({
          ...(input.transactionDate !== undefined ? { transactionDate: new Date(input.transactionDate) } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.reference !== undefined ? { reference: input.reference } : {}),
          ...(input.amount !== undefined ? { amount: String(input.amount) } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.counterparty !== undefined ? { counterparty: input.counterparty } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.financeTransactions.id, input.id), eq(schema.financeTransactions.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  financeTransactionsDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/finance-transactions/:id", summary: "Delete finance transaction", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.financeTransactions)
        .where(and(eq(schema.financeTransactions.id, input.id), eq(schema.financeTransactions.organizationId, context.organization.id)));
      return { success: true };
    }),

  payrollRunsList: orgAuthed
    .route({ method: "GET", path: "/operations/payroll-runs", summary: "List payroll runs", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const data = await getDb(context)
        .select()
        .from(schema.payrollRuns)
        .where(eq(schema.payrollRuns.organizationId, context.organization.id))
        .orderBy(desc(schema.payrollRuns.payDate))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  payrollRunsCreate: orgAuthed
    .route({ method: "POST", path: "/operations/payroll-runs", summary: "Create payroll run", tags: ["Operations"] })
    .input(z.object({ periodLabel: z.string().min(1), payDate: z.string().datetime(), status: z.string().default("draft"), totalGross: z.number().nonnegative().default(0), totalDeductions: z.number().nonnegative().default(0), totalNet: z.number().nonnegative().default(0), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.payrollRuns)
        .values({
          organizationId: context.organization.id,
          periodLabel: input.periodLabel,
          payDate: new Date(input.payDate),
          status: input.status,
          totalGross: String(input.totalGross),
          totalDeductions: String(input.totalDeductions),
          totalNet: String(input.totalNet),
          notes: input.notes || null,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  payrollRunsUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/payroll-runs/:id", summary: "Update payroll run", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), periodLabel: z.string().optional(), payDate: z.string().datetime().optional(), status: z.string().optional(), totalGross: z.number().nonnegative().optional(), totalDeductions: z.number().nonnegative().optional(), totalNet: z.number().nonnegative().optional(), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .update(schema.payrollRuns)
        .set({
          ...(input.periodLabel !== undefined ? { periodLabel: input.periodLabel } : {}),
          ...(input.payDate !== undefined ? { payDate: new Date(input.payDate) } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.totalGross !== undefined ? { totalGross: String(input.totalGross) } : {}),
          ...(input.totalDeductions !== undefined ? { totalDeductions: String(input.totalDeductions) } : {}),
          ...(input.totalNet !== undefined ? { totalNet: String(input.totalNet) } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.payrollRuns.id, input.id), eq(schema.payrollRuns.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  payrollRunsDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/payroll-runs/:id", summary: "Delete payroll run", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.payrollRuns)
        .where(and(eq(schema.payrollRuns.id, input.id), eq(schema.payrollRuns.organizationId, context.organization.id)));
      return { success: true };
    }),

  payrollEntriesList: orgAuthed
    .route({ method: "GET", path: "/operations/payroll-entries", summary: "List payroll entries", tags: ["Operations"] })
    .input(pageInput.extend({ payrollRunId: z.string().uuid().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const conditions = [eq(schema.payrollRuns.organizationId, context.organization.id)];
      if (input.payrollRunId) {
        conditions.push(eq(schema.payrollEntries.payrollRunId, input.payrollRunId));
      }

      const data = await db
        .select({
          id: schema.payrollEntries.id,
          payrollRunId: schema.payrollEntries.payrollRunId,
          employeeId: schema.payrollEntries.employeeId,
          employeeName: schema.employees.fullName,
          grossPay: schema.payrollEntries.grossPay,
          deductions: schema.payrollEntries.deductions,
          netPay: schema.payrollEntries.netPay,
          status: schema.payrollEntries.status,
          notes: schema.payrollEntries.notes,
          createdAt: schema.payrollEntries.createdAt,
          updatedAt: schema.payrollEntries.updatedAt,
        })
        .from(schema.payrollEntries)
        .leftJoin(schema.payrollRuns, eq(schema.payrollEntries.payrollRunId, schema.payrollRuns.id))
        .leftJoin(schema.employees, eq(schema.payrollEntries.employeeId, schema.employees.id))
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])
        .orderBy(desc(schema.payrollEntries.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data, page: input.page, limit: input.limit };
    }),

  payrollEntriesCreate: orgAuthed
    .route({ method: "POST", path: "/operations/payroll-entries", summary: "Create payroll entry", tags: ["Operations"] })
    .input(z.object({ payrollRunId: z.string().uuid(), employeeId: z.string().uuid().optional(), grossPay: z.number().nonnegative(), deductions: z.number().nonnegative().default(0), netPay: z.number().nonnegative(), status: z.string().default("draft"), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.payrollEntries)
        .values({
          payrollRunId: input.payrollRunId,
          employeeId: input.employeeId || null,
          grossPay: String(input.grossPay),
          deductions: String(input.deductions),
          netPay: String(input.netPay),
          status: input.status,
          notes: input.notes || null,
        })
        .returning();
      return row;
    }),

  payrollEntriesUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/payroll-entries/:id", summary: "Update payroll entry", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), grossPay: z.number().nonnegative().optional(), deductions: z.number().nonnegative().optional(), netPay: z.number().nonnegative().optional(), status: z.string().optional(), notes: z.string().optional() }))
    .output(z.any())
    .handler(async ({ input, context }) => {
      const [row] = await getDb(context)
        .update(schema.payrollEntries)
        .set({
          ...(input.grossPay !== undefined ? { grossPay: String(input.grossPay) } : {}),
          ...(input.deductions !== undefined ? { deductions: String(input.deductions) } : {}),
          ...(input.netPay !== undefined ? { netPay: String(input.netPay) } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.payrollEntries.id, input.id))
        .returning();
      return row;
    }),

  payrollEntriesDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/payroll-entries/:id", summary: "Delete payroll entry", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ input, context }) => {
      await getDb(context).delete(schema.payrollEntries).where(eq(schema.payrollEntries.id, input.id));
      return { success: true };
    }),

  ticketCommentsList: orgAuthed
    .route({ method: "GET", path: "/operations/ticket-comments", summary: "List ticket comments", tags: ["Operations"] })
    .input(pageInput.extend({ ticketId: z.string().uuid().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const where = input.ticketId
        ? and(
            eq(schema.ticketComments.organizationId, context.organization.id),
            eq(schema.ticketComments.ticketId, input.ticketId),
          )
        : eq(schema.ticketComments.organizationId, context.organization.id);

      const data = await db
        .select()
        .from(schema.ticketComments)
        .where(where)
        .orderBy(desc(schema.ticketComments.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  ticketCommentsCreate: orgAuthed
    .route({ method: "POST", path: "/operations/ticket-comments", summary: "Create ticket comment", tags: ["Operations"] })
    .input(z.object({ ticketId: z.string().uuid(), message: z.string().min(1), isInternal: z.boolean().default(false) }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.ticketComments)
        .values({
          organizationId: context.organization.id,
          ticketId: input.ticketId,
          authorId: context.user.id,
          message: input.message,
          isInternal: input.isInternal ? 1 : 0,
        })
        .returning();
      return row;
    }),

  ticketCommentsDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/ticket-comments/:id", summary: "Delete ticket comment", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.ticketComments)
        .where(and(eq(schema.ticketComments.id, input.id), eq(schema.ticketComments.organizationId, context.organization.id)));
      return { success: true };
    }),

  knowledgeArticlesList: orgAuthed
    .route({ method: "GET", path: "/operations/knowledge-articles", summary: "List knowledge articles", tags: ["Operations"] })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const data = await getDb(context)
        .select()
        .from(schema.knowledgeArticles)
        .where(eq(schema.knowledgeArticles.organizationId, context.organization.id))
        .orderBy(desc(schema.knowledgeArticles.updatedAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data, page: input.page, limit: input.limit };
    }),

  knowledgeArticlesCreate: orgAuthed
    .route({ method: "POST", path: "/operations/knowledge-articles", summary: "Create knowledge article", tags: ["Operations"] })
    .input(z.object({ title: z.string().min(1), category: z.string().default("General"), content: z.string().min(1), status: z.string().default("draft") }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .insert(schema.knowledgeArticles)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          category: input.category,
          content: input.content,
          status: input.status,
          createdBy: context.user.id,
          updatedBy: context.user.id,
        })
        .returning();
      return row;
    }),

  knowledgeArticlesUpdate: orgAuthed
    .route({ method: "PATCH", path: "/operations/knowledge-articles/:id", summary: "Update knowledge article", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid(), title: z.string().optional(), category: z.string().optional(), content: z.string().optional(), status: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const [row] = await getDb(context)
        .update(schema.knowledgeArticles)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.content !== undefined ? { content: input.content } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedBy: context.user.id,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.knowledgeArticles.id, input.id), eq(schema.knowledgeArticles.organizationId, context.organization.id)))
        .returning();
      return row;
    }),

  knowledgeArticlesDelete: orgAuthed
    .route({ method: "DELETE", path: "/operations/knowledge-articles/:id", summary: "Delete knowledge article", tags: ["Operations"] })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.knowledgeArticles)
        .where(and(eq(schema.knowledgeArticles.id, input.id), eq(schema.knowledgeArticles.organizationId, context.organization.id)));
      return { success: true };
    }),
};
