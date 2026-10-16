import { useContext } from "react";
import { AccessControlContext } from "./accessControlContextInstance";

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error("useAccessControl must be used within an AccessControlProvider");
  }
  return context;
}
