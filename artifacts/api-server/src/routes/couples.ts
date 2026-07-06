import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { and, eq, or } from "drizzle-orm";
import {
  db,
  withUserContext,
  couplesTable,
  partnerLinksTable,
  coupleDiscussionPromptsTable,
} from "@workspace/db";
import {
  ListCouplesResponse,
  CreateCoupleResponse,
  CreatePartnerLinkParams,
  CreatePartnerLinkBody,
  CreatePartnerLinkResponse,
  AcceptPartnerLinkParams,
  AcceptPartnerLinkResponse,
  ListCoupleDiscussionPromptsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/couples", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx
      .select()
      .from(couplesTable)
      .where(or(eq(couplesTable.userAId, req.userId!), eq(couplesTable.userBId, req.userId!))),
  );
  res.json(ListCouplesResponse.parse(rows));
});

router.post("/couples", async (req, res): Promise<void> => {
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx.insert(couplesTable).values({ userAId: req.userId! }).returning(),
  );
  res.status(201).json(CreateCoupleResponse.parse(row));
});

router.post("/couples/:id/partner-links", async (req, res): Promise<void> => {
  const params = CreatePartnerLinkParams.safeParse(req.params);
  const parsed = CreatePartnerLinkBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const inviteCode = randomBytes(6).toString("hex");
  const row = await withUserContext(req.userId!, async (tx) => {
    const [couple] = await tx.select().from(couplesTable).where(eq(couplesTable.id, params.data.id));
    if (!couple || couple.userAId !== req.userId) {
      return null;
    }
    const [inserted] = await tx
      .insert(partnerLinksTable)
      .values({
        coupleId: params.data.id,
        invitedBy: req.userId!,
        inviteEmail: parsed.data.inviteEmail,
        inviteCode,
      })
      .returning();
    return inserted;
  });
  if (!row) {
    res.status(404).json({ error: "Couple not found" });
    return;
  }
  res.status(201).json(CreatePartnerLinkResponse.parse(row));
});

router.post("/partner-links/:code/accept", async (req, res): Promise<void> => {
  const params = AcceptPartnerLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [link] = await db
    .select()
    .from(partnerLinksTable)
    .where(and(eq(partnerLinksTable.inviteCode, params.data.code), eq(partnerLinksTable.status, "pending")));
  if (!link) {
    res.status(404).json({ error: "Invite link not found or already used" });
    return;
  }
  const [couple] = await db
    .update(couplesTable)
    .set({ userBId: req.userId!, status: "active" })
    .where(eq(couplesTable.id, link.coupleId))
    .returning();
  await db.update(partnerLinksTable).set({ status: "accepted" }).where(eq(partnerLinksTable.id, link.id));
  res.json(AcceptPartnerLinkResponse.parse(couple));
});

router.get("/couple-discussion-prompts", async (_req, res): Promise<void> => {
  const rows = await db.select().from(coupleDiscussionPromptsTable);
  res.json(ListCoupleDiscussionPromptsResponse.parse(rows));
});

export default router;
