import * as Sentry from "@sentry/nextjs";

import { scrubSentryEvent } from "@/lib/observability/sentry-privacy";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  beforeSend: scrubSentryEvent,
  dsn,
  enabled: Boolean(dsn),
  enableLogs: false,
  sendDefaultPii: false,
  tracesSampleRate: 0,
});
