import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bibleVersesTable } from "@workspace/db";
import { ListBibleVersesQueryParams, ListBibleVersesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bible-verses", async (req, res): Promise<void> => {
  const query = ListBibleVersesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(bibleVersesTable)
    .where(query.data.theme ? eq(bibleVersesTable.theme, query.data.theme) : undefined);
  res.json(ListBibleVersesResponse.parse(rows));
});

export default router;
