import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  profilesTable,
  userRolesTable,
  securitySettingsTable,
} from "@workspace/db";
import {
  GetMyProfileResponse,
  UpdateMyProfileBody,
  UpdateMyProfileResponse,
  GetMyRolesResponse,
  GetMySecuritySettingsResponse,
  UpdateMySecuritySettingsBody,
  UpdateMySecuritySettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profile", async (req, res): Promise<void> => {
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, req.userId!));
  res.json(GetMyProfileResponse.parse(profile));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [profile] = await db
    .update(profilesTable)
    .set(parsed.data)
    .where(eq(profilesTable.id, req.userId!))
    .returning();
  res.json(UpdateMyProfileResponse.parse(profile));
});

router.get("/profile/roles", async (req, res): Promise<void> => {
  const roles = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, req.userId!));
  res.json(GetMyRolesResponse.parse(roles));
});

router.get("/profile/security-settings", async (req, res): Promise<void> => {
  const [existing] = await db
    .select()
    .from(securitySettingsTable)
    .where(eq(securitySettingsTable.userId, req.userId!));

  const settings =
    existing ??
    (
      await db
        .insert(securitySettingsTable)
        .values({ userId: req.userId! })
        .onConflictDoNothing()
        .returning()
    )[0] ??
    (
      await db
        .select()
        .from(securitySettingsTable)
        .where(eq(securitySettingsTable.userId, req.userId!))
    )[0];

  res.json(GetMySecuritySettingsResponse.parse(settings));
});

router.patch(
  "/profile/security-settings",
  async (req, res): Promise<void> => {
    const parsed = UpdateMySecuritySettingsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [settings] = await db
      .update(securitySettingsTable)
      .set(parsed.data)
      .where(eq(securitySettingsTable.userId, req.userId!))
      .returning();
    res.json(UpdateMySecuritySettingsResponse.parse(settings));
  },
);

export default router;
