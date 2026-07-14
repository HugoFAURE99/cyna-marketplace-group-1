export type RoleProfile = { is_actif: boolean; role: string } | null | undefined;

export function isActiveAdmin(profile: RoleProfile): boolean {
  return profile?.role === "admin" && profile.is_actif;
}

export function isActiveClient(profile: RoleProfile): boolean {
  return profile?.role === "client" && profile.is_actif;
}

export function isActiveUser(profile: RoleProfile): boolean {
  return Boolean(profile?.is_actif && (profile.role === "client" || profile.role === "admin"));
}
