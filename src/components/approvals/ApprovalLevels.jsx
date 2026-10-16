import React, { useState } from "react";
import {
  GitBranch,
  Pencil,
  ArrowRight,
  Check,
  Building2,
  Users,
} from "lucide-react";
import { useAccessControl } from "../../context/useAccessControl";
import "./ApprovalLevels.css";

export default function ApprovalLevels({ onOpenEditModal }) {
  const { roles, updateRole } = useAccessControl();
  const [editingRole, setEditingRole] = useState(null);
  const [formLevel, setFormLevel] = useState(0);
  const [formLimit, setFormLimit] = useState("");

  function startQuickEdit(role) {
    setEditingRole(role);
    setFormLevel(role.level);
    setFormLimit(role.limit !== null && role.limit !== undefined ? role.limit : "");
  }

  function handleSaveQuickEdit(e) {
    e.preventDefault();
    if (!editingRole) return;

    updateRole(editingRole.id, {
      level: Number(formLevel) || 0,
      limit: formLimit !== "" ? Number(formLimit) : null,
    });
    setEditingRole(null);
  }

  const levels = [
    {
      level: 0,
      name: "Level 0 · Standard / Counter Operations",
      description: "Operational personnel with zero approval authority. Can submit transactions only.",
      examples: "Cashier Assistant, Collection Officer, Auditor",
      roles: roles.filter((r) => r.level === 0),
    },
    {
      level: 1,
      name: "Level 1 · Counter Verification & Tellers",
      description: "First-line authorization for routine daily cash transactions and minor debit entries.",
      examples: "Cashier, Accounts Assistant (Typically up to ₹25,000)",
      roles: roles.filter((r) => r.level === 1),
    },
    {
      level: 2,
      name: "Level 2 · Branch Management",
      description: "Middle-tier authority for loan sanctions, RD premature withdrawals, and branch variances.",
      examples: "Branch Manager (Typically up to ₹5,00,000)",
      roles: roles.filter((r) => r.level === 2),
    },
    {
      level: 3,
      name: "Level 3+ · Head Office & Executive Committee",
      description: "Supreme organizational tier for high-value credit lines, policy overrides, and global limits.",
      examples: "System Administrator, Managing Director, Board Approval (Unlimited)",
      roles: roles.filter((r) => r.level >= 3),
    },
  ];

  return (
    <div className="secondary-page approval-levels-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">FR-014 & FR-015 WORKFLOW SPECIFICATION</div>
          <h1>Approval Levels & Financial Limits</h1>
          <p className="secondary-description">
            Hierarchical authorization authority and monetary ceilings for ERP financial operations.
          </p>
        </div>
      </div>

      {/* Visual Workflow Chain (Section 6 & Page 4) */}
      <section className="content-card flow-banner-card">
        <div className="card-heading">
          <div>
            <h3>Approval Escalation Flow</h3>
            <p>Standard multi-tier workflow approval sequence (as specified in Page 4 of RBAC document).</p>
          </div>
        </div>

        <div className="escalation-flowchart">
          <div className="flow-step">
            <div className="step-badge">Level 0</div>
            <strong>Entry / Collection</strong>
            <span>Collection Officer</span>
            <div className="step-amount">Submission Only</div>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="flow-step">
            <div className="step-badge l1">Level 1</div>
            <strong>Verification</strong>
            <span>Cashier / Accountant</span>
            <div className="step-amount">Up to ₹25,000 - ₹1,00,000</div>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="flow-step highlight">
            <div className="step-badge l2">Level 2</div>
            <strong>Branch Approval</strong>
            <span>Branch Manager</span>
            <div className="step-amount">Up to ₹5,00,000</div>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="flow-step summit">
            <div className="step-badge l3">Level 3+</div>
            <strong>Final / Head Office</strong>
            <span>System Administrator / Exec</span>
            <div className="step-amount">Unlimited / Board Limit</div>
          </div>
        </div>
      </section>

      {/* Tiered List of Roles */}
      <div className="approval-tiers-container">
        {levels.map((tier) => (
          <div key={tier.level} className="approval-tier-block">
            <div className="tier-header">
              <div className="tier-tag">
                <GitBranch size={16} />
                <span>{tier.name}</span>
              </div>
              <p>{tier.description}</p>
            </div>

            <div className="tier-roles-grid">
              {tier.roles.length === 0 ? (
                <div className="no-roles-in-tier">No roles configured at this level.</div>
              ) : (
                tier.roles.map((role) => (
                  <div key={role.id} className="approval-role-card">
                    <div className="role-card-top">
                      <div className="role-avatar">{role.name.charAt(0)}</div>
                      <div className="role-meta">
                        <strong>{role.name}</strong>
                        <span>
                          <Building2 size={13} /> {role.scope}
                        </span>
                      </div>
                      <span
                        className={`status-pill ${
                          role.status === "Active" ? "status-active" : "status-inactive"
                        }`}
                      >
                        <span />
                        {role.status}
                      </span>
                    </div>

                    <div className="approval-limit-box">
                      <div className="limit-row">
                        <span className="limit-label">Approval Limit:</span>
                        <strong className="limit-val">
                          {role.limit
                            ? `₹${Number(role.limit).toLocaleString()}`
                            : "No Limit Configured"}
                        </strong>
                      </div>
                      <div className="limit-row">
                        <span className="limit-label">Active Users:</span>
                        <span className="users-val">
                          <Users size={13} /> {role.users} assigned
                        </span>
                      </div>
                    </div>

                    <div className="role-card-footer">
                      <button
                        className="secondary-button small-button"
                        onClick={() => startQuickEdit(role)}
                      >
                        <Pencil size={13} /> Quick Adjust
                      </button>
                      <button
                        className="secondary-button small-button"
                        onClick={() => onOpenEditModal(role)}
                      >
                        Full Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Edit Modal */}
      {editingRole && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingRole(null);
          }}
        >
          <div className="role-modal small-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <div className="eyebrow">QUICK APPROVAL ADJUSTMENT</div>
                <h3>{editingRole.name}</h3>
                <p>Modify workflow level tier and financial limit threshold.</p>
              </div>
            </div>

            <form onSubmit={handleSaveQuickEdit}>
              <div className="modal-body">
                <div className="field-label">
                  <label htmlFor="quick-level">Approval Level (0 - 5)</label>
                  <input
                    id="quick-level"
                    type="number"
                    min="0"
                    max="10"
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    required
                  />
                  <span className="field-hint">
                    0 = Operation staff, 1 = Cashier, 2 = Branch Manager, 3+ = Head Office
                  </span>
                </div>

                <div className="field-label">
                  <label htmlFor="quick-limit">Financial Approval Limit (₹)</label>
                  <input
                    id="quick-limit"
                    type="number"
                    min="0"
                    placeholder="e.g. 500000 (Leave empty for unlimited)"
                    value={formLimit}
                    onChange={(e) => setFormLimit(e.target.value)}
                  />
                  <span className="field-hint">
                    Monetary ceiling for financial transactions and loan approvals.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingRole(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Check size={16} /> Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
