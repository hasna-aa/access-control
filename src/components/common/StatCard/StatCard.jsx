import React from "react";
import "./StatCard.css";

export default function StatCard({ icon: Icon, label, value, note, tone = "violet" }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <div className="stat-card-body">
        <span className="stat-label">{label}</span>
        <div className="stat-value">{value}</div>
        <span className="stat-note">{note}</span>
      </div>
    </div>
  );
}
