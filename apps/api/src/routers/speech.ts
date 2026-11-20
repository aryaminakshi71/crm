/**
 * Speech Router (Avaan API)
 *
 * Transcriptions, speakers, voice commands, meetings, vocabulary, models, and stats.
 */

import { and, count, desc, eq, isNull, sql, sum } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

const {
  transcriptions,
  voiceSpeakers,
  voiceCommands,
  meetingNotes,
  customVocabulary,
  customLanguageModels,
} = schema;

// ─── Static Models List ────────────────────────────────────────────────────────

const SPEECH_MODELS = [
  {
    id: "whisper-1",
    name: "Whisper v1",
    provider: "openai",
    language: "multilingual",
    description: "General-purpose speech recognition model",
    accuracy: 0.95,
    isDefault: true,
  },
  {
    id: "whisper-large-v3",
    name: "Whisper Large v3",
    provider: "openai",
    language: "multilingual",
    description: "High-accuracy large model for complex audio",
    accuracy: 0.97,
    isDefault: false,
  },
  {
    id: "nova-2",
    name: "Nova-2",
    provider: "deepgram",
    language: "en",
    description: "Fast and accurate English speech model",
    accuracy: 0.96,
    isDefault: false,
  },
  {
    id: "nova-2-medical",
    name: "Nova-2 Medical",
    provider: "deepgram",
    language: "en",
    description: "Specialized model for medical terminology",
    accuracy: 0.97,
    isDefault: false,
  },
  {
    id: "enhanced",
    name: "Enhanced",
    provider: "assemblyai",
    language: "en",
    description: "Enhanced accuracy with speaker diarization",
    accuracy: 0.96,
    isDefault: false,
  },
];

export const speechRouter = {
  // ─── Transcriptions ──────────────────────────────────────────────────────────

  "transcriptions.list": orgAuthed
    .route({
      method: "GET",
      path: "/speech/transcriptions",
      summary: "List transcriptions",
      tags: ["Speech"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        status: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [
          eq(transcriptions.organizationId, context.organization.id),
          isNull(transcriptions.deletedAt),
        ];
        if (input.status) {
          conditions.push(eq(transcriptions.status, input.status));
        }

        const whereConditions = and(...conditions);

        const countResult = await db
          .select({ count: count() })
          .from(transcriptions)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(transcriptions)
          .where(whereConditions)
          .orderBy(desc(transcriptions.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          data,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  "transcriptions.create": orgAuthed
    .route({
      method: "POST",
      path: "/speech/transcriptions",
      summary: "Start a new transcription job",
      tags: ["Speech"],
    })
    .input(
      z.object({
        title: z.string().optional(),
        sourceType: z.enum(["audio_file", "streaming", "recording"]),
        sourceUrl: z.string().optional(),
        language: z.string().default("en"),
        customVocabulary: z.array(z.string()).optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          title?: string;
          sourceType: "audio_file" | "streaming" | "recording";
          sourceUrl?: string;
          language?: string;
          customVocabulary?: string[];
        };
      }) => {
        const db = getDb(context);

        const [transcription] = await db
          .insert(transcriptions)
          .values({
            organizationId: context.organization.id,
            title: input.title,
            status: "pending",
            sourceType: input.sourceType,
            sourceUrl: input.sourceUrl,
            language: input.language ?? "en",
            customVocabulary: input.customVocabulary ?? [],
            createdBy: context.user.id,
            startedAt: new Date(),
          })
          .returning();

        return transcription;
      },
    ),

  "transcriptions.get": orgAuthed
    .route({
      method: "GET",
      path: "/speech/transcriptions/:id",
      summary: "Get a transcription",
      tags: ["Speech"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [transcription] = await db
          .select()
          .from(transcriptions)
          .where(
            and(
              eq(transcriptions.id, input.id),
              eq(transcriptions.organizationId, context.organization.id),
              isNull(transcriptions.deletedAt),
            ),
          );

        if (!transcription) {
          throw new Error("Transcription not found");
        }

        return transcription;
      },
    ),

  "transcriptions.delete": orgAuthed
    .route({
      method: "DELETE",
      path: "/speech/transcriptions/:id",
      summary: "Delete a transcription",
      tags: ["Speech"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [deleted] = await db
          .update(transcriptions)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(transcriptions.id, input.id),
              eq(transcriptions.organizationId, context.organization.id),
              isNull(transcriptions.deletedAt),
            ),
          )
          .returning();

        if (!deleted) {
          throw new Error("Transcription not found");
        }

        return { success: true };
      },
    ),

  // ─── Speakers ────────────────────────────────────────────────────────────────

  "speakers.list": orgAuthed
    .route({
      method: "GET",
      path: "/speech/speakers",
      summary: "List speaker profiles",
      tags: ["Speech"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .output(
      z.object({
        data: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const whereConditions = and(
          eq(voiceSpeakers.organizationId, context.organization.id),
          isNull(voiceSpeakers.deletedAt),
        );

        const countResult = await db
          .select({ count: count() })
          .from(voiceSpeakers)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(voiceSpeakers)
          .where(whereConditions)
          .orderBy(desc(voiceSpeakers.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          data,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  "speakers.create": orgAuthed
    .route({
      method: "POST",
      path: "/speech/speakers",
      summary: "Create a speaker profile",
      tags: ["Speech"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        language: z.string().default("en"),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; description?: string; language?: string };
      }) => {
        const db = getDb(context);

        const [speaker] = await db
          .insert(voiceSpeakers)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description,
            language: input.language ?? "en",
            createdBy: context.user.id,
          })
          .returning();

        return speaker;
      },
    ),

  "speakers.delete": orgAuthed
    .route({
      method: "DELETE",
      path: "/speech/speakers/:id",
      summary: "Delete a speaker profile",
      tags: ["Speech"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [deleted] = await db
          .update(voiceSpeakers)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(voiceSpeakers.id, input.id),
              eq(voiceSpeakers.organizationId, context.organization.id),
              isNull(voiceSpeakers.deletedAt),
            ),
          )
          .returning();

        if (!deleted) {
          throw new Error("Speaker not found");
        }

        return { success: true };
      },
    ),

  // ─── Voice Commands ──────────────────────────────────────────────────────────

  "commands.list": orgAuthed
    .route({
      method: "GET",
      path: "/speech/commands",
      summary: "List voice commands",
      tags: ["Speech"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .output(
      z.object({
        data: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const whereConditions = eq(voiceCommands.organizationId, context.organization.id);

        const countResult = await db
          .select({ count: count() })
          .from(voiceCommands)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(voiceCommands)
          .where(whereConditions)
          .orderBy(desc(voiceCommands.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          data,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  "commands.create": orgAuthed
    .route({
      method: "POST",
      path: "/speech/commands",
      summary: "Create a voice command",
      tags: ["Speech"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        phrase: z.string().min(1),
        alternatives: z.array(z.string()).optional(),
        action: z
          .object({
            type: z.string(),
            endpoint: z.string().optional(),
            params: z.record(z.string(), z.string()).optional(),
          })
          .optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          name: string;
          description?: string;
          phrase: string;
          alternatives?: string[];
          action?: { type: string; endpoint?: string; params?: Record<string, string> };
        };
      }) => {
        const db = getDb(context);

        const [command] = await db
          .insert(voiceCommands)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description,
            phrase: input.phrase,
            alternatives: input.alternatives ?? [],
            action: input.action,
            isActive: true,
            createdBy: context.user.id,
          })
          .returning();

        return command;
      },
    ),

  "commands.toggle": orgAuthed
    .route({
      method: "PATCH",
      path: "/speech/commands/:id",
      summary: "Toggle voice command active state",
      tags: ["Speech"],
    })
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; isActive: boolean };
      }) => {
        const db = getDb(context);

        const [updated] = await db
          .update(voiceCommands)
          .set({
            isActive: input.isActive,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(voiceCommands.id, input.id),
              eq(voiceCommands.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!updated) {
          throw new Error("Voice command not found");
        }

        return updated;
      },
    ),

  // ─── Meetings ────────────────────────────────────────────────────────────────

  "meetings.list": orgAuthed
    .route({
      method: "GET",
      path: "/speech/meetings",
      summary: "List meeting notes",
      tags: ["Speech"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .output(
      z.object({
        data: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const whereConditions = eq(meetingNotes.organizationId, context.organization.id);

        const countResult = await db
          .select({ count: count() })
          .from(meetingNotes)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(meetingNotes)
          .where(whereConditions)
          .orderBy(desc(meetingNotes.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          data,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  "meetings.get": orgAuthed
    .route({
      method: "GET",
      path: "/speech/meetings/:id",
      summary: "Get meeting notes",
      tags: ["Speech"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [meeting] = await db
          .select()
          .from(meetingNotes)
          .where(
            and(
              eq(meetingNotes.id, input.id),
              eq(meetingNotes.organizationId, context.organization.id),
            ),
          );

        if (!meeting) {
          throw new Error("Meeting notes not found");
        }

        return meeting;
      },
    ),

  // ─── Models ──────────────────────────────────────────────────────────────────

  "models.list": orgAuthed
    .route({
      method: "GET",
      path: "/speech/models",
      summary: "List available speech models",
      tags: ["Speech"],
    })
    .input(z.object({}).optional())
    .output(z.array(z.any()))
    .handler(async () => {
      return SPEECH_MODELS;
    }),

  // ─── Vocabulary ──────────────────────────────────────────────────────────────

  "vocabulary.list": orgAuthed
    .route({
      method: "GET",
      path: "/speech/vocabulary",
      summary: "List custom vocabulary",
      tags: ["Speech"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .output(
      z.object({
        data: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const whereConditions = and(
          eq(customVocabulary.organizationId, context.organization.id),
          isNull(customVocabulary.deletedAt),
        );

        const countResult = await db
          .select({ count: count() })
          .from(customVocabulary)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(customVocabulary)
          .where(whereConditions)
          .orderBy(desc(customVocabulary.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          data,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  "vocabulary.create": orgAuthed
    .route({
      method: "POST",
      path: "/speech/vocabulary",
      summary: "Add custom vocabulary term",
      tags: ["Speech"],
    })
    .input(
      z.object({
        term: z.string().min(1),
        soundsLike: z.array(z.string()).optional(),
        displayAs: z.string().optional(),
        language: z.string().default("en"),
        weight: z.number().min(1).max(10).default(1),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          term: string;
          soundsLike?: string[];
          displayAs?: string;
          language?: string;
          weight?: number;
        };
      }) => {
        const db = getDb(context);

        const [vocab] = await db
          .insert(customVocabulary)
          .values({
            organizationId: context.organization.id,
            term: input.term,
            soundsLike: input.soundsLike ?? [],
            displayAs: input.displayAs,
            language: input.language ?? "en",
            weight: input.weight ?? 1,
            createdBy: context.user.id,
          })
          .returning();

        return vocab;
      },
    ),

  "vocabulary.delete": orgAuthed
    .route({
      method: "DELETE",
      path: "/speech/vocabulary/:id",
      summary: "Delete a vocabulary term",
      tags: ["Speech"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [deleted] = await db
          .update(customVocabulary)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(customVocabulary.id, input.id),
              eq(customVocabulary.organizationId, context.organization.id),
              isNull(customVocabulary.deletedAt),
            ),
          )
          .returning();

        if (!deleted) {
          throw new Error("Vocabulary term not found");
        }

        return { success: true };
      },
    ),

  // ─── Stats ───────────────────────────────────────────────────────────────────

  stats: orgAuthed
    .route({
      method: "GET",
      path: "/speech/stats",
      summary: "Get aggregate speech stats",
      tags: ["Speech"],
    })
    .input(z.object({}).optional())
    .output(
      z.object({
        totalTranscriptions: z.number(),
        totalMinutes: z.number(),
        accuracy: z.number(),
        completedTranscriptions: z.number(),
        pendingTranscriptions: z.number(),
        totalSpeakers: z.number(),
        totalCommands: z.number(),
        totalMeetings: z.number(),
        totalVocabulary: z.number(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [
        transcriptionsCount,
        completedCount,
        pendingCount,
        durationResult,
        accuracyResult,
        speakersCount,
        commandsCount,
        meetingsCount,
        vocabularyCount,
      ] = await Promise.all([
        db
          .select({ count: count() })
          .from(transcriptions)
          .where(
            and(
              eq(transcriptions.organizationId, orgId),
              isNull(transcriptions.deletedAt),
            ),
          ),
        db
          .select({ count: count() })
          .from(transcriptions)
          .where(
            and(
              eq(transcriptions.organizationId, orgId),
              eq(transcriptions.status, "completed"),
              isNull(transcriptions.deletedAt),
            ),
          ),
        db
          .select({ count: count() })
          .from(transcriptions)
          .where(
            and(
              eq(transcriptions.organizationId, orgId),
              eq(transcriptions.status, "pending"),
              isNull(transcriptions.deletedAt),
            ),
          ),
        db
          .select({ total: sum(transcriptions.audioDuration) })
          .from(transcriptions)
          .where(
            and(
              eq(transcriptions.organizationId, orgId),
              eq(transcriptions.status, "completed"),
              isNull(transcriptions.deletedAt),
            ),
          ),
        db
          .select({ avg: sql<string>`avg(${transcriptions.confidence})` })
          .from(transcriptions)
          .where(
            and(
              eq(transcriptions.organizationId, orgId),
              eq(transcriptions.status, "completed"),
              isNull(transcriptions.deletedAt),
            ),
          ),
        db
          .select({ count: count() })
          .from(voiceSpeakers)
          .where(
            and(
              eq(voiceSpeakers.organizationId, orgId),
              isNull(voiceSpeakers.deletedAt),
            ),
          ),
        db
          .select({ count: count() })
          .from(voiceCommands)
          .where(eq(voiceCommands.organizationId, orgId)),
        db
          .select({ count: count() })
          .from(meetingNotes)
          .where(eq(meetingNotes.organizationId, orgId)),
        db
          .select({ count: count() })
          .from(customVocabulary)
          .where(
            and(
              eq(customVocabulary.organizationId, orgId),
              isNull(customVocabulary.deletedAt),
            ),
          ),
      ]);

      const totalSeconds = Number(durationResult[0]?.total ?? 0);
      const totalMinutes = Math.round(totalSeconds / 60);
      const accuracyVal = Number(accuracyResult[0]?.avg ?? 0);

      return {
        totalTranscriptions: transcriptionsCount[0]?.count ?? 0,
        completedTranscriptions: completedCount[0]?.count ?? 0,
        pendingTranscriptions: pendingCount[0]?.count ?? 0,
        totalMinutes,
        accuracy: Math.round(accuracyVal * 100) / 100,
        totalSpeakers: speakersCount[0]?.count ?? 0,
        totalCommands: commandsCount[0]?.count ?? 0,
        totalMeetings: meetingsCount[0]?.count ?? 0,
        totalVocabulary: vocabularyCount[0]?.count ?? 0,
      };
    }),
};
