import { count, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateAdminNewsBody,
  CreateAdminNewsResponse,
  CreateInquiryBody,
  CreateInquiryResponse,
  DeleteAdminNewsParams,
  GetAdminIdentityResponse,
  GetAdminOverviewResponse,
  ListAdminInquiriesResponse,
  ListAdminNewsResponse,
  ListPublishedNewsResponse,
  UpdateAdminInquiryParams,
  UpdateAdminInquiryBody,
  UpdateAdminInquiryResponse,
  UpdateAdminNewsBody,
  UpdateAdminNewsParams,
  UpdateAdminNewsResponse,
} from "@workspace/api-zod";
import { z } from "zod/v4";
import {
  db,
  inquiriesTable,
  newsTable,
} from "@workspace/db";
import {
  requireDbiAdmin,
  requireSignedIn,
  resolveDbiUser,
} from "../middlewares/dbi-admin";

const router: IRouter = Router();
const ErrorResponse = z.object({ error: z.string() });
const inquiryRateLimit = new Map<string, { count: number; resetAt: number }>();
const INQUIRY_WINDOW_MS = 10 * 60 * 1000;
const INQUIRY_LIMIT = 5;

function canSubmitInquiry(ip: string, now: number): boolean {
  const current = inquiryRateLimit.get(ip);
  if (!current || current.resetAt <= now) {
    inquiryRateLimit.set(ip, { count: 1, resetAt: now + INQUIRY_WINDOW_MS });
  } else if (current.count >= INQUIRY_LIMIT) {
    return false;
  } else {
    current.count += 1;
  }

  if (inquiryRateLimit.size > 10_000) {
    for (const [key, value] of inquiryRateLimit) {
      if (value.resetAt <= now) inquiryRateLimit.delete(key);
    }
  }
  return true;
}

router.post("/inquiries", async (req, res): Promise<void> => {
  const input = CreateInquiryBody.safeParse(req.body);
  if (!input.success) {
    req.log.warn(
      { issueCount: input.error.issues.length },
      "Rejected invalid DBI inquiry",
    );
    res.status(400).json(ErrorResponse.parse({ error: "Please check the form fields and try again." }));
    return;
  }

  if (input.data.website?.trim()) {
    res.status(400).json(ErrorResponse.parse({ error: "Invalid submission." }));
    return;
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!canSubmitInquiry(ip, Date.now())) {
    res.status(429).json(ErrorResponse.parse({ error: "Too many requests. Please try again later." }));
    return;
  }

  const [created] = await db
    .insert(inquiriesTable)
    .values({
      name: input.data.name.trim(),
      email: input.data.email.trim().toLowerCase(),
      company: input.data.company?.trim() || null,
      country: input.data.country?.trim() || null,
      phone: input.data.phone?.trim() || null,
      kind: input.data.kind,
      message: input.data.message.trim(),
    })
    .returning({ id: inquiriesTable.id });

  res.status(201).json(
    CreateInquiryResponse.parse({ id: created.id, status: "new" }),
  );
});

router.get("/news", async (_req, res): Promise<void> => {
  const articles = await db
    .select()
    .from(newsTable)
    .where(eq(newsTable.status, "published"))
    .orderBy(desc(newsTable.publishedAt), desc(newsTable.createdAt));
  res.json(ListPublishedNewsResponse.parse(articles));
});

router.get("/admin/me", requireSignedIn, async (req, res): Promise<void> => {
  const userId = res.locals.clerkUserId as string;
  try {
    const user = await resolveDbiUser(userId);
    res.json(
      GetAdminIdentityResponse.parse({
        email: user.email,
        isAdmin: user.isAdmin,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Unable to load DBI user profile");
    res.status(503).json(
      ErrorResponse.parse({ error: "Account information is temporarily unavailable." }),
    );
  }
});

router.get("/admin/overview", requireDbiAdmin, async (_req, res): Promise<void> => {
  const [
    [totalInquiries],
    [newInquiries],
    [publishedArticles],
    [draftArticles],
  ] = await Promise.all([
    db.select({ value: count() }).from(inquiriesTable),
    db
      .select({ value: count() })
      .from(inquiriesTable)
      .where(eq(inquiriesTable.status, "new")),
    db
      .select({ value: count() })
      .from(newsTable)
      .where(eq(newsTable.status, "published")),
    db
      .select({ value: count() })
      .from(newsTable)
      .where(eq(newsTable.status, "draft")),
  ]);

  res.json(
    GetAdminOverviewResponse.parse({
      totalInquiries: Number(totalInquiries.value),
      newInquiries: Number(newInquiries.value),
      publishedArticles: Number(publishedArticles.value),
      draftArticles: Number(draftArticles.value),
    }),
  );
});

router.get("/admin/inquiries", requireDbiAdmin, async (_req, res): Promise<void> => {
  const inquiries = await db
    .select()
    .from(inquiriesTable)
    .orderBy(desc(inquiriesTable.createdAt));
  res.json(ListAdminInquiriesResponse.parse(inquiries));
});

router.patch(
  "/admin/inquiries/:id",
  requireDbiAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateAdminInquiryParams.safeParse(req.params);
    const input = UpdateAdminInquiryBody.safeParse(req.body);
    if (!params.success || !input.success) {
      res.status(400).json(ErrorResponse.parse({ error: "Invalid inquiry update." }));
      return;
    }

    const [updated] = await db
      .update(inquiriesTable)
      .set({ status: input.data.status })
      .where(eq(inquiriesTable.id, params.data.id))
      .returning();
    if (!updated) {
      res.status(404).json(ErrorResponse.parse({ error: "Inquiry not found." }));
      return;
    }
    res.json(UpdateAdminInquiryResponse.parse(updated));
  },
);

router.get("/admin/news", requireDbiAdmin, async (_req, res): Promise<void> => {
  const articles = await db
    .select()
    .from(newsTable)
    .orderBy(desc(newsTable.updatedAt));
  res.json(ListAdminNewsResponse.parse(articles));
});

router.post("/admin/news", requireDbiAdmin, async (req, res): Promise<void> => {
  const input = CreateAdminNewsBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json(ErrorResponse.parse({ error: "Please check the article fields and try again." }));
    return;
  }

  const [duplicate] = await db
    .select({ id: newsTable.id })
    .from(newsTable)
    .where(eq(newsTable.slug, input.data.slug));
  if (duplicate) {
    res.status(400).json(ErrorResponse.parse({ error: "This article URL is already in use." }));
    return;
  }

  const now = new Date();
  const [created] = await db
    .insert(newsTable)
    .values({
      ...input.data,
      publishedAt: input.data.status === "published" ? now : null,
    })
    .returning();
  res.status(201).json(CreateAdminNewsResponse.parse(created));
});

router.patch(
  "/admin/news/:id",
  requireDbiAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateAdminNewsParams.safeParse(req.params);
    const input = UpdateAdminNewsBody.safeParse(req.body);
    if (!params.success || !input.success) {
      res.status(400).json(ErrorResponse.parse({ error: "Please check the article fields and try again." }));
      return;
    }

    const [current] = await db
      .select()
      .from(newsTable)
      .where(eq(newsTable.id, params.data.id));
    if (!current) {
      res.status(404).json(ErrorResponse.parse({ error: "Article not found." }));
      return;
    }

    if (input.data.slug) {
      const [duplicate] = await db
        .select({ id: newsTable.id })
        .from(newsTable)
        .where(eq(newsTable.slug, input.data.slug));
      if (duplicate && duplicate.id !== current.id) {
        res.status(400).json(ErrorResponse.parse({ error: "This article URL is already in use." }));
        return;
      }
    }

    const update = {
      ...input.data,
      updatedAt: new Date(),
      ...(input.data.status === undefined
        ? {}
        : {
            publishedAt:
              input.data.status === "published"
                ? current.publishedAt ?? new Date()
                : null,
          }),
    };

    const [updated] = await db
      .update(newsTable)
      .set(update)
      .where(eq(newsTable.id, params.data.id))
      .returning();
    res.json(UpdateAdminNewsResponse.parse(updated));
  },
);

router.delete(
  "/admin/news/:id",
  requireDbiAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteAdminNewsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json(ErrorResponse.parse({ error: "Invalid article ID." }));
      return;
    }
    const [deleted] = await db
      .delete(newsTable)
      .where(eq(newsTable.id, params.data.id))
      .returning({ id: newsTable.id });
    if (!deleted) {
      res.status(404).json(ErrorResponse.parse({ error: "Article not found." }));
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
