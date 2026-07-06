import { eq } from "drizzle-orm";
import { db, profilesTable, userRolesTable, type Profile } from "@workspace/db";
import { clerkClient } from "@clerk/express";

export async function ensureProfile(userId: string): Promise<Profile> {
  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, userId));

  if (existing) return existing;

  let fullName = "New User";
  try {
    const user = await clerkClient.users.getUser(userId);
    fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.emailAddresses[0]?.emailAddress ||
      fullName;
  } catch {
    // fall back to default name if Clerk lookup fails
  }

  const [created] = await db
    .insert(profilesTable)
    .values({ id: userId, fullName })
    .onConflictDoNothing()
    .returning();

  if (created) {
    await db
      .insert(userRolesTable)
      .values({ userId, role: "member" })
      .onConflictDoNothing();
    return created;
  }

  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, userId));
  return row!;
}
