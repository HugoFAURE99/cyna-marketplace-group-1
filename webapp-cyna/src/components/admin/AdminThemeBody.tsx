"use client";

import { useEffect } from "react";

/**
 * Applies the admin purple theme to <body> so that portaled UI (mobile sidebar
 * sheet, dialogs) inherits the CYNA brand tokens too, not just the inline
 * layout wrapper. Scoped to the admin route: removed on unmount.
 */
export default function AdminThemeBody() {
  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  return null;
}
