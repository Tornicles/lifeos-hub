import { Router, type IRouter } from "express";
import { db, hubsTable, ultraDomainsTable } from "@workspace/db";
import { ListHubsResponse, ListUltraDomainsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/hubs", async (_req, res): Promise<void> => {
  const hubs = await db.select().from(hubsTable);
  res.json(ListHubsResponse.parse(hubs));
});

router.get("/ultra-domains", async (_req, res): Promise<void> => {
  const domains = await db.select().from(ultraDomainsTable);
  res.json(ListUltraDomainsResponse.parse(domains));
});

export default router;
