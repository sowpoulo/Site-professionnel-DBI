import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod/v4";

const ErrorResponse = z.object({ error: z.string() });
export type DbiUser = {
  userId: string;
  email: string;
  isAdmin: boolean;
};

export async function resolveDbiUser(userId: string): Promise<DbiUser> {
  const user = await clerkClient.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";
  const allowlist = new Set(
    (process.env.DBI_ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  const isAdmin = user.emailAddresses.some(
    (address) =>
      address.verification?.status === "verified" &&
      allowlist.has(address.emailAddress.toLowerCase()),
  );

  return { userId, email, isAdmin };
}

export function requireSignedIn(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json(ErrorResponse.parse({ error: "Sign-in required" }));
    return;
  }
  res.locals.clerkUserId = auth.userId;
  next();
}

export async function requireDbiAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json(ErrorResponse.parse({ error: "Sign-in required" }));
    return;
  }

  try {
    const user = await resolveDbiUser(auth.userId);
    if (!user.isAdmin) {
      res.status(403).json(
        ErrorResponse.parse({ error: "Administrator access required" }),
      );
      return;
    }
    res.locals.dbiAdmin = user;
    next();
  } catch (error) {
    req.log.error({ err: error }, "Unable to resolve DBI administrator");
    res.status(503).json(
      ErrorResponse.parse({ error: "Administrator access is temporarily unavailable" }),
    );
  }
}
