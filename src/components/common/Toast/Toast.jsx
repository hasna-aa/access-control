import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import "./Toast.css";

export default function Toast({ notice }) {
  if (!notice) return null;

  return (
    <div className={`toast toast-${notice.type}`}>
      {notice.type === "error" ? (
        <AlertTriangle size={18} className="toast-icon-error" />
      ) : (
        <ShieldCheck size={18} className="toast-icon-success" />
      )}
      <span>{notice.message}</span>
    </div>
  );
}
