import { z } from "zod";

const emptyStringToUndefined = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());

const postgresUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL.")
  .refine(
    (value) =>
      value.startsWith("postgres://") || value.startsWith("postgresql://"),
    "Must use postgres:// or postgresql://.",
  );

const httpUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL.")
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    "Must use http:// or https://.",
  );

function formatIssues(issues: z.ZodIssue[]) {
  return issues
    .map((issue) => {
      const path = issue.path.join(".") || "root";
      return `- ${path}: ${issue.message}`;
    })
    .join("\n");
}

function parseEnv<T extends z.ZodRawShape>(
  schemaName: string,
  schema: z.ZodObject<T>,
) {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid ${schemaName} environment variables:\n${formatIssues(parsed.error.issues)}`,
    );
  }

  return parsed.data;
}

const databaseEnvSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
});

const authEnvSchema = z
  .object({
    BETTER_AUTH_SECRET: z
      .string()
      .trim()
      .min(32, "Must be at least 32 characters long."),
    BETTER_AUTH_URL: httpUrlSchema,
    GITHUB_CLIENT_ID: emptyStringToUndefined,
    GITHUB_CLIENT_SECRET: emptyStringToUndefined,
    GOOGLE_CLIENT_ID: z.string().trim().min(1, "Is required."),
    GOOGLE_CLIENT_SECRET: z.string().trim().min(1, "Is required."),
  })
  .superRefine((value, ctx) => {
    const hasGithubId = Boolean(value.GITHUB_CLIENT_ID);
    const hasGithubSecret = Boolean(value.GITHUB_CLIENT_SECRET);

    if (hasGithubId === hasGithubSecret) {
      return;
    }

    if (!hasGithubId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "GITHUB_CLIENT_ID is required when GITHUB_CLIENT_SECRET is configured.",
        path: ["GITHUB_CLIENT_ID"],
      });
    }

    if (!hasGithubSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "GITHUB_CLIENT_SECRET is required when GITHUB_CLIENT_ID is configured.",
        path: ["GITHUB_CLIENT_SECRET"],
      });
    }
  });

const aiEnvSchema = z.object({
  GEMINI_API_KEY: emptyStringToUndefined,
  GEMINI_MODEL: emptyStringToUndefined,
  GOOGLE_API_KEY: emptyStringToUndefined,
  GOOGLE_MODEL: emptyStringToUndefined,
});

type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
type AuthEnv = z.infer<typeof authEnvSchema>;
type AiEnv = z.infer<typeof aiEnvSchema>;

let cachedDatabaseEnv: DatabaseEnv | null = null;
let cachedAuthEnv: AuthEnv | null = null;
let cachedAiEnv: AiEnv | null = null;

function getDatabaseEnv() {
  if (!cachedDatabaseEnv) {
    cachedDatabaseEnv = parseEnv("database", databaseEnvSchema);
  }

  return cachedDatabaseEnv;
}

function getAuthEnv() {
  if (!cachedAuthEnv) {
    cachedAuthEnv = parseEnv("auth", authEnvSchema);
  }

  return cachedAuthEnv;
}

function getAiEnv() {
  if (!cachedAiEnv) {
    cachedAiEnv = parseEnv("AI", aiEnvSchema);
  }

  return cachedAiEnv;
}

export const env = {
  ai: {
    get geminiApiKey() {
      const aiEnv = getAiEnv();
      return aiEnv.GEMINI_API_KEY ?? aiEnv.GOOGLE_API_KEY ?? null;
    },
    get geminiModel() {
      const aiEnv = getAiEnv();
      return aiEnv.GEMINI_MODEL ?? aiEnv.GOOGLE_MODEL ?? "gemini-1.5-flash";
    },
  },
  auth: {
    get baseUrl() {
      return getAuthEnv().BETTER_AUTH_URL;
    },
    get github() {
      const authEnv = getAuthEnv();

      return authEnv.GITHUB_CLIENT_ID && authEnv.GITHUB_CLIENT_SECRET
        ? {
            clientId: authEnv.GITHUB_CLIENT_ID,
            clientSecret: authEnv.GITHUB_CLIENT_SECRET,
          }
        : null;
    },
    get google() {
      const authEnv = getAuthEnv();

      return {
        clientId: authEnv.GOOGLE_CLIENT_ID,
        clientSecret: authEnv.GOOGLE_CLIENT_SECRET,
      };
    },
    get secret() {
      return getAuthEnv().BETTER_AUTH_SECRET;
    },
  },
  database: {
    get url() {
      return getDatabaseEnv().DATABASE_URL;
    },
  },
} as const;
