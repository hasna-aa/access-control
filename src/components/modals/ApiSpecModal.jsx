import React, { useState } from "react";
import {
  X,
  Code2,
  Copy,
  Check,
  Server,
  Database,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { useAccessControl } from "../../context/useAccessControl";
import "./ApiSpecModal.css";

export default function ApiSpecModal() {
  const { showApiModal, setShowApiModal, selectedRole, notify } = useAccessControl();
  const [copied, setCopied] = useState(false);

  if (!showApiModal) return null;

  const requestModel = {
    name: selectedRole?.name || "Branch Manager",
    description: selectedRole?.description || "Manages a branch",
    branchScope:
      selectedRole?.scope === "Assigned Branch"
        ? "ASSIGNED_BRANCH"
        : selectedRole?.scope === "All Branches"
        ? "ALL_BRANCHES"
        : "SELECTED_BRANCHES",
    selectedBranches: selectedRole?.selectedBranches || [],
    approvalLevel: selectedRole?.level ?? 2,
    approvalLimit: selectedRole?.limit || null,
    status: (selectedRole?.status || "ACTIVE").toUpperCase(),
    permissions: Object.entries(selectedRole?.permissions || {}).map(([mod, actions]) => ({
      module: mod.toUpperCase(),
      actions: actions.map((a) => a.toUpperCase()),
    })),
  };

  const jsonString = JSON.stringify(requestModel, null, 2);

  function copyJson() {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    notify("API Request payload copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setShowApiModal(false);
      }}
    >
      <div className="role-modal spec-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <div className="eyebrow">SECTIONS 23 - 27 & ARCHITECTURE</div>
            <h2>Enterprise RBAC Specification & API Schema</h2>
            <p>Formal 4-layer authorization data model and REST endpoints.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowApiModal(false)}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 4 Layers Architecture Diagram (Page 18) */}
          <div className="arch-layers-box">
            <h4>
              <Layers size={17} /> Enterprise 4-Layer Permission Architecture (Page 18)
            </h4>
            <div className="ascii-tree">
              <pre>
{`Role
 │
 ├── Module (Dashboard, Customers, Membership, Savings, RD, Loan, Chitty, Reports)
 │    │
 │    ├── Actions
 │    │    ├── View
 │    │    ├── Create
 │    │    ├── Edit
 │    │    ├── Delete
 │    │    ├── Approve
 │    │    └── Export
 │    │
 │    └── Data Scope
 │         ├── Assigned Branch
 │         ├── Selected Branches
 │         └── All Branches
 │
 └── Approval Level & Limit (Level 0 - 3+, ₹ Threshold)`}
              </pre>
            </div>
          </div>

          {/* Section 23: Endpoints */}
          <div className="endpoints-box">
            <h4>
              <Server size={17} /> Section 23: REST API Endpoints
            </h4>
            <div className="endpoint-grid">
              <div className="endpoint-row">
                <span className="http-method get">GET</span>
                <code>/roles</code>
                <span className="ep-desc">List all roles with filters & pagination</span>
              </div>
              <div className="endpoint-row">
                <span className="http-method get">GET</span>
                <code>/roles/:id</code>
                <span className="ep-desc">Get role by ID with permissions</span>
              </div>
              <div className="endpoint-row">
                <span className="http-method post">POST</span>
                <code>/roles</code>
                <span className="ep-desc">Create new reusable role</span>
              </div>
              <div className="endpoint-row">
                <span className="http-method put">PUT</span>
                <code>/roles/:id</code>
                <span className="ep-desc">Update role details & approval level</span>
              </div>
              <div className="endpoint-row">
                <span className="http-method patch">PATCH</span>
                <code>/roles/:id/status</code>
                <span className="ep-desc">Activate / Deactivate role</span>
              </div>
              <div className="endpoint-row">
                <span className="http-method post">POST</span>
                <code>/roles/:id/clone</code>
                <span className="ep-desc">Clone role definition as inactive</span>
              </div>
              <div className="endpoint-row">
                <span className="http-method put">PUT</span>
                <code>/roles/:id/permissions</code>
                <span className="ep-desc">Update permission matrix for role</span>
              </div>
            </div>
          </div>

          {/* Section 24: JSON Payload Preview */}
          <div className="json-model-box">
            <div className="json-box-top">
              <h4>
                <Code2 size={17} /> Section 24: Request Model (Payload for "{selectedRole?.name}")
              </h4>
              <button className="small-action-btn" onClick={copyJson}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy JSON"}
              </button>
            </div>
            <pre className="json-preview-code">{jsonString}</pre>
          </div>

          {/* Section 26 & 27: Collections & Security */}
          <div className="security-notice-grid">
            <div className="sec-box">
              <Database size={16} />
              <div>
                <strong>Section 26 Database Collections</strong>
                <p>Collections: <code>roles</code>, <code>permissions</code>, <code>role_permissions</code>. User document stores only <code>roleId</code>.</p>
              </div>
            </div>
            <div className="sec-box">
              <ShieldAlert size={16} />
              <div>
                <strong>Section 27 Security Guardrails</strong>
                <p>Enforced strictly on backend. Every endpoint verifies permissions & branch scope. Changes audited.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowApiModal(false)}
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
}
