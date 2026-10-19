"use client";

import { useEffect, useState } from "react";
import { Toast } from "./forms";

/** Confirms a create action that redirected to the new item's page. */
export function CreatedToast({ message }: { message: string }) {
  const [state] = useState({ ok: true, message, at: 1 });
  useEffect(() => {
    // Drop ?created=1 so a reload doesn't repeat the toast.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  return <Toast state={state} />;
}
