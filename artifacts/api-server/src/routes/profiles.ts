import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, childProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const SALT_ROUNDS = 10;

router.get("/profiles", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const profiles = await db
    .select({
      id: childProfilesTable.id,
      parentId: childProfilesTable.parentId,
      name: childProfilesTable.name,
      ageRange: childProfilesTable.ageRange,
      congenitalConditions: childProfilesTable.congenitalConditions,
      createdAt: childProfilesTable.createdAt,
    })
    .from(childProfilesTable)
    .where(eq(childProfilesTable.parentId, req.user.id));
  res.json({ profiles });
});

router.post("/profiles", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, password, ageRange, congenitalConditions } = req.body as {
    name: string;
    password: string;
    ageRange: string;
    congenitalConditions?: string[];
  };
  if (!name?.trim() || !password || !ageRange) {
    res.status(400).json({ error: "name, password, and ageRange are required" });
    return;
  }
  if (!["5-7", "8-12", "13-17"].includes(ageRange)) {
    res.status(400).json({ error: "ageRange must be one of: 5-7, 8-12, 13-17" });
    return;
  }
  if (password.length < 4) {
    res.status(400).json({ error: "Password must be at least 4 characters" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [profile] = await db
    .insert(childProfilesTable)
    .values({
      parentId: req.user.id,
      name: name.trim(),
      passwordHash,
      ageRange,
      congenitalConditions: congenitalConditions ?? [],
    })
    .returning({
      id: childProfilesTable.id,
      parentId: childProfilesTable.parentId,
      name: childProfilesTable.name,
      ageRange: childProfilesTable.ageRange,
      congenitalConditions: childProfilesTable.congenitalConditions,
      createdAt: childProfilesTable.createdAt,
    });
  res.status(201).json({ profile });
});

router.delete("/profiles/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id: string = req.params["id"] as string;
  const [existing] = await db
    .select({ id: childProfilesTable.id })
    .from(childProfilesTable)
    .where(
      and(
        eq(childProfilesTable.id, id),
        eq(childProfilesTable.parentId, req.user.id),
      ),
    );
  if (!existing) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  await db
    .delete(childProfilesTable)
    .where(eq(childProfilesTable.id, id));
  res.json({ success: true });
});

router.post("/profiles/:id/verify", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id: string = req.params["id"] as string;
  const { password } = req.body as { password: string };
  if (!password) {
    res.status(400).json({ error: "password is required" });
    return;
  }
  const [row] = await db
    .select()
    .from(childProfilesTable)
    .where(
      and(
        eq(childProfilesTable.id, id),
        eq(childProfilesTable.parentId, req.user.id),
      ),
    );
  if (!row) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  const match = await bcrypt.compare(password, row.passwordHash);
  if (!match) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }
  const profile = {
    id: row.id,
    parentId: row.parentId,
    name: row.name,
    ageRange: row.ageRange,
    congenitalConditions: row.congenitalConditions,
    createdAt: row.createdAt,
  };
  res.json({ profile });
});

export default router;
