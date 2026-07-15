export type AuthCallbackFailure = {
  key: "confirmationLinkUsed" | "emailConfirmed" | "invalidLink";
  parameter: "error" | "message";
};

export function getAuthCallbackFailure(searchParams: URLSearchParams): AuthCallbackFailure {
  const flow = searchParams.get("flow");
  const isSignupFlow = flow === "signup" || (!flow && !searchParams.has("next"));

  if (isSignupFlow) {
    return {
      key: searchParams.has("code") ? "emailConfirmed" : "confirmationLinkUsed",
      parameter: "message",
    };
  }

  return { key: "invalidLink", parameter: "error" };
}
