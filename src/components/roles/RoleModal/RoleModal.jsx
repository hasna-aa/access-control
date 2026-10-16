import React, { useState } from "react";
import {
  X,
  Check,
  AlertCircle,
  Building2,
  GitBranch,
} from "lucide-react";
import { MODULES_CONFIG, ALL_ACTIONS, AVAILABLE_BRANCHES } from "../../../data/mockData";
import "./RoleModal.css";

function getDefaultPermissions() {
  const perms = {};
  Object.keys(MODULES_CONFIG).forEach((mod) => {
    perms[mod] = ["View"];
  });
  return perms;
}

export default function RoleModal({
  isOpen,
  onClose,
  onSave,
  editingRole,
  existingRoles,
  notify,
}) {
  const [activeTab, setActiveTab] = useState("info");
  const [formData, setFormData] = useState(() => {
    if (editingRole) {
      return {
        name: editingRole.name || "",
        description: editingRole.description || "",
        status: editingRole.status || "Active",
        scope: editingRole.scope || "Assigned Branch",
        selectedBranches: editingRole.selectedBranches || [AVAILABLE_BRANCHES[0]],
        level: editingRole.level ?? 0,
        limit: editingRole.limit !== null && editingRole.limit !== undefined ? editingRole.limit : "",
        permissions: editingRole.permissions
          ? JSON.parse(JSON.stringify(editingRole.permissions))
          : getDefaultPermissions(),
      };
    }
    return {
      name: "",
      description: "",
      status: "Active",
      scope: "Assigned Branch",
      selectedBranches: [AVAILABLE_BRANCHES[0]],
      level: 0,
      limit: "",
      permissions: getDefaultPermissions(),
    };
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  function handleActionToggle(mod, action) {
    setFormData((prev) => {
      const currentActions = prev.permissions[mod] || [];
      const updated = currentActions.includes(action)
        ? currentActions.filter((a) => a !== action)
        : [...currentActions, action];

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [mod]: updated,
        },
      };
    });
  }

  function handleModuleSelectAll(mod) {
    const allowed = MODULES_CONFIG[mod].allowedActions;
    setFormData((prev) => {
      const current = prev.permissions[mod] || [];
      const isAllSelected = allowed.every((a) => current.includes(a));
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [mod]: isAllSelected ? [] : [...allowed],
        },
      };
    });
  }

  function handleSelectAllPermissions() {
    const perms = {};
    Object.entries(MODULES_CONFIG).forEach(([mod, cfg]) => {
      perms[mod] = [...cfg.allowedActions];
    });
    setFormData((prev) => ({ ...prev, permissions: perms }));
  }

  function handleClearAllPermissions() {
    const perms = {};
    Object.keys(MODULES_CONFIG).forEach((mod) => {
      perms[mod] = [];
    });
    setFormData((prev) => ({ ...prev, permissions: perms }));
  }

  function handleSelectReadOnly() {
    const perms = {};
    Object.keys(MODULES_CONFIG).forEach((mod) => {
      perms[mod] = ["View"];
    });
    setFormData((prev) => ({ ...prev, permissions: perms }));
  }

  function handleBranchToggle(branchName) {
    setFormData((prev) => {
      const exists = prev.selectedBranches.includes(branchName);
      const updated = exists
        ? prev.selectedBranches.filter((b) => b !== branchName)
        : [...prev.selectedBranches, branchName];
      return { ...prev, selectedBranches: updated };
    });
  }

  function validate() {
    const errs = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      errs.name = "Role name is required.";
    } else if (trimmedName.length > 100) {
      errs.name = "Role name cannot exceed 100 characters.";
    } else {
      const duplicate = existingRoles.find(
        (r) =>
          r.name.toLowerCase() === trimmedName.toLowerCase() &&
          r.id !== (editingRole ? editingRole.id : null)
      );
      if (duplicate) {
        errs.name = `A role with the name "${trimmedName}" already exists.`;
      }
    }

    if (formData.description && formData.description.length > 500) {
      errs.description = "Description cannot exceed 500 characters.";
    }

    // Business Rule 17: A role must have at least one permission
    const totalPermissions = Object.values(formData.permissions).reduce(
      (sum, acts) => sum + (acts ? acts.length : 0),
      0
    );
    if (totalPermissions === 0) {
      errs.permissions = "A role must have at least one permission assigned (Business Rule 17).";
    }

    // Branch Scope Validation
    if (formData.scope === "Selected Branches" && formData.selectedBranches.length === 0) {
      errs.branches = "Please select at least one branch for 'Selected Branches' scope.";
    }

    // Protected Role Rule
    if (editingRole && editingRole.name === "System Administrator" && formData.status === "Inactive") {
      const activeAdmins = existingRoles.filter(
        (r) => r.name === "System Administrator" && r.status === "Active"
      );
      if (activeAdmins.length <= 1) {
        errs.status = "At least one active System Administrator must always exist.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      const firstError = Object.values(errors)[0] || "Please resolve validation errors.";
      notify(firstError, "error");
      return;
    }

    const rolePayload = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      level: Number(formData.level) || 0,
      limit: formData.limit !== "" ? Number(formData.limit) : null,
    };

    onSave(rolePayload);
  }

  const totalAssignedActions = Object.values(formData.permissions).reduce(
    (acc, acts) => acc + (acts?.length || 0),
    0
  );

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="role-modal role-modal-wizard" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="eyebrow">
              {editingRole ? "RBAC-003 EDIT ROLE" : "RBAC-002 CREATE ROLE"}
            </div>
            <h2>{editingRole ? `Edit Role: ${editingRole.name}` : "Create Reusable Role"}</h2>
            <p>Configure role specifications across 4 enterprise authorization layers.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Step Tabs */}
        <div className="modal-wizard-tabs">
          <button
            type="button"
            className={`wizard-tab-btn ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <span className="step-num">1</span>
            <span>Role Info</span>
            {errors.name && <span className="tab-error-dot" />}
          </button>
          <button
            type="button"
            className={`wizard-tab-btn ${activeTab === "permissions" ? "active" : ""}`}
            onClick={() => setActiveTab("permissions")}
          >
            <span className="step-num">2</span>
            <span>Permissions ({totalAssignedActions})</span>
            {errors.permissions && <span className="tab-error-dot" />}
          </button>
          <button
            type="button"
            className={`wizard-tab-btn ${activeTab === "scope" ? "active" : ""}`}
            onClick={() => setActiveTab("scope")}
          >
            <span className="step-num">3</span>
            <span>Branch Scope</span>
            {errors.branches && <span className="tab-error-dot" />}
          </button>
          <button
            type="button"
            className={`wizard-tab-btn ${activeTab === "approval" ? "active" : ""}`}
            onClick={() => setActiveTab("approval")}
          >
            <span className="step-num">4</span>
            <span>Approval Level</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body wizard-body">
            {/* TAB 1: Role Info */}
            {activeTab === "info" && (
              <div className="wizard-panel">
                <div className="panel-intro">
                  <h4>Section 1: General Information</h4>
                  <p>Define the identity and baseline activity status for this reusable role template.</p>
                </div>

                <div className="field-label">
                  <label htmlFor="role-name-input">
                    Role Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="role-name-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Branch Manager, Cashier, Auditor"
                    maxLength={100}
                    className={errors.name ? "input-error" : ""}
                    required
                  />
                  {errors.name ? (
                    <span className="error-text">
                      <AlertCircle size={13} /> {errors.name}
                    </span>
                  ) : (
                    <span className="field-hint">
                      Maximum 100 characters · Must be unique across ERP
                    </span>
                  )}
                </div>

                <div className="field-label">
                  <label htmlFor="role-description-input">Description</label>
                  <textarea
                    id="role-description-input"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the job duties, module responsibilities, and access boundaries..."
                    maxLength={500}
                    rows={3}
                  />
                  <div className="char-counter">
                    <span>{formData.description.length} / 500 characters</span>
                  </div>
                </div>

                <div className="field-label">
                  <label htmlFor="role-status-select">Status</label>
                  <select
                    id="role-status-select"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="Active">Active (Available for user assignment)</option>
                    <option value="Inactive">Inactive (Disabled / Cannot be assigned)</option>
                  </select>
                  {errors.status && (
                    <span className="error-text">
                      <AlertCircle size={13} /> {errors.status}
                    </span>
                  )}
                  <span className="field-hint">
                    Business Rule: Inactive roles cannot be assigned to new users.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: Permission Matrix */}
            {activeTab === "permissions" && (
              <div className="wizard-panel">
                <div className="panel-intro permission-intro-header">
                  <div>
                    <h4>Section 2: Module Permissions (Permission Matrix)</h4>
                    <p>Grant fine-grained actions per business module (Section 16).</p>
                  </div>
                  <div className="quick-action-pill-group">
                    <button
                      type="button"
                      className="pill-btn"
                      onClick={handleSelectAllPermissions}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="pill-btn"
                      onClick={handleSelectReadOnly}
                    >
                      Read Only (View)
                    </button>
                    <button
                      type="button"
                      className="pill-btn"
                      style={{ color: "var(--muted)" }}
                      onClick={handleClearAllPermissions}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {errors.permissions && (
                  <div className="alert-box-error">
                    <AlertCircle size={16} />
                    <span>{errors.permissions}</span>
                  </div>
                )}

                <div className="table-scroll modal-table-scroll">
                  <table className="permission-table modal-perm-table">
                    <thead>
                      <tr>
                        <th>MODULE</th>
                        {ALL_ACTIONS.map((action) => (
                          <th key={action}>{action.toUpperCase()}</th>
                        ))}
                        <th>ROW ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(MODULES_CONFIG).map(([modName, config]) => {
                        const currentActions = formData.permissions[modName] || [];
                        const isAllSelected = config.allowedActions.every((a) =>
                          currentActions.includes(a)
                        );
                        return (
                          <tr key={modName}>
                            <td className="module-title-cell">
                              <strong>{modName}</strong>
                              <span className="module-desc-sub">{config.description}</span>
                            </td>
                            {ALL_ACTIONS.map((action) => {
                              const isAllowed = config.allowedActions.includes(action);
                              const isChecked = currentActions.includes(action);
                              if (!isAllowed) {
                                return (
                                  <td key={action} className="na-cell">
                                    <span className="dash-na">-</span>
                                  </td>
                                );
                              }
                              return (
                                <td key={action} className="check-cell">
                                  <label className="checkbox-wrap">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleActionToggle(modName, action)}
                                      aria-label={`${modName} ${action}`}
                                    />
                                    <span className="custom-check" />
                                  </label>
                                </td>
                              );
                            })}
                            <td className="row-toggle-cell">
                              <button
                                type="button"
                                className="small-text-btn"
                                onClick={() => handleModuleSelectAll(modName)}
                              >
                                {isAllSelected ? "Clear" : "All"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Branch Scope */}
            {activeTab === "scope" && (
              <div className="wizard-panel">
                <div className="panel-intro">
                  <h4>Section 3: Branch Scope</h4>
                  <p>Determines which branch records users with this role can view and operate on.</p>
                </div>

                <div className="scope-cards-grid">
                  {[
                    {
                      id: "Assigned Branch",
                      title: "Assigned Branch Only",
                      desc: "Users are strictly confined to data of their own assigned home branch.",
                    },
                    {
                      id: "Selected Branches",
                      title: "Selected Branches",
                      desc: "Role grants multi-branch access to a specific designated list of branches.",
                    },
                    {
                      id: "All Branches",
                      title: "All Branches (Organization-wide)",
                      desc: "Full cross-branch visibility across all offices and headquarters.",
                    },
                  ].map((option) => (
                    <div
                      key={option.id}
                      className={`scope-select-card ${
                        formData.scope === option.id ? "selected" : ""
                      }`}
                      onClick={() => setFormData({ ...formData, scope: option.id })}
                    >
                      <div className="scope-radio-row">
                        <input
                          type="radio"
                          name="branchScope"
                          checked={formData.scope === option.id}
                          onChange={() =>
                            setFormData({ ...formData, scope: option.id })
                          }
                        />
                        <strong>{option.title}</strong>
                      </div>
                      <p>{option.desc}</p>
                    </div>
                  ))}
                </div>

                {formData.scope === "Selected Branches" && (
                  <div className="selected-branches-container">
                    <h5>Designate Accessible Branches</h5>
                    {errors.branches && (
                      <span className="error-text">
                        <AlertCircle size={13} /> {errors.branches}
                      </span>
                    )}
                    <div className="branches-checklist">
                      {AVAILABLE_BRANCHES.map((b) => (
                        <label key={b} className="branch-check-item">
                          <input
                            type="checkbox"
                            checked={formData.selectedBranches.includes(b)}
                            onChange={() => handleBranchToggle(b)}
                          />
                          <Building2 size={15} />
                          <span>{b}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Approval Level */}
            {activeTab === "approval" && (
              <div className="wizard-panel">
                <div className="panel-intro">
                  <h4>Section 4: Approval Settings</h4>
                  <p>Configure approval hierarchy tier and optional financial threshold limit (Section 15).</p>
                </div>

                <div className="form-two-columns">
                  <div className="field-label">
                    <label htmlFor="approval-level-input">
                      Approval Level (0 - 5)
                    </label>
                    <input
                      id="approval-level-input"
                      type="number"
                      min="0"
                      max="10"
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({ ...formData, level: e.target.value })
                      }
                    />
                    <span className="field-hint">
                      Level 0: No approvals · Level 1: Cashier · Level 2: Branch Manager · Level 3+: Head Office
                    </span>
                  </div>

                  <div className="field-label">
                    <label htmlFor="approval-limit-input">
                      Approval Limit (₹ / Currency)
                    </label>
                    <input
                      id="approval-limit-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 500000 (Optional)"
                      value={formData.limit}
                      onChange={(e) =>
                        setFormData({ ...formData, limit: e.target.value })
                      }
                    />
                    <span className="field-hint">
                      Maximum monetary authorization limit for loans, disbursements, or cash vouchers.
                    </span>
                  </div>
                </div>

                <div className="approval-preview-callout">
                  <GitBranch size={20} />
                  <div>
                    <strong>Hierarchy Position: Level {formData.level}</strong>
                    <p>
                      {Number(formData.level) === 0
                        ? "Operational staff without transaction approval authority."
                        : Number(formData.level) === 1
                        ? "First-line verifier (Cashier / Accounts Officer)."
                        : Number(formData.level) === 2
                        ? "Middle-tier authority (Branch Manager)."
                        : "High-level executive / Head Office authorization tier."}
                      {formData.limit
                        ? ` Financial cap set to ₹${Number(formData.limit).toLocaleString()}.`
                        : " No monetary ceiling configured."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <div className="footer-left-status">
              <span>
                Configured: <strong>{totalAssignedActions} actions</strong> · Scope:{" "}
                <strong>{formData.scope}</strong> · Level:{" "}
                <strong>{formData.level}</strong>
              </span>
            </div>
            <div className="footer-action-buttons">
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>
              {activeTab !== "info" && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    const tabs = ["info", "permissions", "scope", "approval"];
                    const currIdx = tabs.indexOf(activeTab);
                    if (currIdx > 0) setActiveTab(tabs[currIdx - 1]);
                  }}
                >
                  Previous
                </button>
              )}
              {activeTab !== "approval" ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    const tabs = ["info", "permissions", "scope", "approval"];
                    const currIdx = tabs.indexOf(activeTab);
                    if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1]);
                  }}
                >
                  Next Tab
                </button>
              ) : null}
              <button type="submit" className="primary-button">
                <Check size={16} />
                {editingRole ? "Save Changes" : "Create Role"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
