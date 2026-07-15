import * as Sentry from "@sentry/nextjs";

type OperationalContext = {
  area: string;
  stage: string;
  tags?: Record<string, string>;
};

export function captureOperationalException(
  error: unknown,
  { area, stage, tags = {} }: OperationalContext,
) {
  Sentry.withScope((scope) => {
    scope.setTag("cyna.area", area);
    scope.setTag("cyna.stage", stage);
    for (const [name, value] of Object.entries(tags)) {
      scope.setTag(name, value);
    }
    Sentry.captureException(error);
  });
}
