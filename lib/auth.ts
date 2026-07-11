import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const socialProviders = {
  google: {
    clientId: env.auth.google.clientId,
    clientSecret: env.auth.google.clientSecret,
  },
  ...(env.auth.github
    ? {
        github: {
          clientId: env.auth.github.clientId,
          clientSecret: env.auth.github.clientSecret,
        },
      }
    : {}),
};

export const auth = betterAuth({
  baseURL: env.auth.baseUrl,
  secret: env.auth.secret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});
