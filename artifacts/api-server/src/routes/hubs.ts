import { Router, type IRouter } from "express";
import { db, hubsTable } from "@workspace/db";
import { ListHubsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/hubs", async (_req, res): Promise<void> => {
  const hubs = await db.select().from(hubsTable);
  res.json(ListHubsResponse.parse(hubs));
});

export default router;
