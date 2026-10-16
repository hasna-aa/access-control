import React, { useState } from "react";
import {
  Search,
  Download,
  User,
} from "lucide-react";
import { useAccessControl } from "../../context/useAccessControl";
import "./AuditLogs.css";

export default function AuditLogs() {
  const { auditLogs, notify } = useAccessControl();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActionType, setSelectedActionType] = useState("All");

  const actionTypes = [
    "All",
    "Role Created",
    "Role Updated",
    "Permission Modified",
    "Branch Scope Changed",
    "Approval Level Changed",
    "Status Changed",
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedActionType === "All" || log.actionType === selectedActionType;

    return matchesSearch && matchesType;
  });

  function exportAuditCSV() {
    const headers = ["ID", "Timestamp", "Action Type", "Role Name", "Actor", "Details"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.actionType,
      l.roleName,
      l.actor,
      l.details,
    ]);

    const csvContent = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Audit logs exported to CSV.");
  }

  function getBadgeClass(type) {
    switch (type) {
      case "Role Created":
        return "badge-green";
      case "Role Updated":
        return "badge-blue";
      case "Permission Modified":
        return "badge-purple";
      case "Branch Scope Changed":
        return "badge-orange";
      case "Approval Level Changed":
        return "badge-teal";
      case "Status Changed":
        return "badge-gray";
      default:
        return "badge-default";
    }
  }

  return (
    <div className="secondary-page audit-logs-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SECTION 22 · SECURITY COMPLIANCE</div>
          <h1>Access Control Audit Logs</h1>
          <p className="secondary-description">
            Complete tamper-evident audit history tracking role creation, permission alterations, and authorization modifications.
          </p>
        </div>

        <button className="secondary-button" onClick={exportAuditCSV}>
          <Download size={16} /> Export Audit Log CSV
        </button>
      </div>

      <section className="content-card">
        {/* Filters and Search Bar */}
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search by role, actor, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
            >
              {actionTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Event Types" : t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of logs */}
        <div className="table-scroll">
          <table className="roles-table audit-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>EVENT TYPE</th>
                <th>AFFECTED ROLE</th>
                <th>PERFORMED BY</th>
                <th>MUTATION DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="timestamp-cell">
                    <span className="mono-time">{log.timestamp}</span>
                  </td>
                  <td>
                    <span className={`event-badge ${getBadgeClass(log.actionType)}`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: "#1e2439" }}>{log.roleName}</strong>
                  </td>
                  <td>
                    <div className="actor-cell">
                      <User size={14} />
                      <span>{log.actor}</span>
                    </div>
                  </td>
                  <td>
                    <span className="details-text">{log.details}</span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No matching audit log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Displaying <strong>{filteredLogs.length}</strong> of{" "}
            <strong>{auditLogs.length}</strong> recorded audit events
          </span>
          <span>Regulatory Compliant · ISO 27001 Access Audit Trail</span>
        </div>
      </section>
    </div>
  );
}
