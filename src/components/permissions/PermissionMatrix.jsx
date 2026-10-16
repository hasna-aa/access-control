import React, { useState } from "react";
import {
  Check,
  RotateCcw,
  Download,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { useAccessControl } from "../../context/useAccessControl";
import { MODULES_CONFIG, ALL_ACTIONS } from "../../data/mockData";
import "./PermissionMatrix.css";

export default function PermissionMatrix() {
  const {
    roles,
    selectedRoleId,
    setSelectedRoleId,
    saveRolePermissions,
    notify,
  } = useAccessControl();

  const [viewMode, setViewMode] = useState("single");
  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const [draftPermissions, setDraftPermissions] = useState(() => {
    return activeRole?.permissions
      ? JSON.parse(JSON.stringify(activeRole.permissions))
      : {};
  });

  const [hasChanges, setHasChanges] = useState(false);

  function handleRoleChange(newRoleId) {
    if (hasChanges) {
      if (!window.confirm("You have unsaved permission changes. Switch role anyway?")) {
        return;
      }
    }
    setSelectedRoleId(newRoleId);
    const newRole = roles.find((r) => r.id === newRoleId);
    if (newRole) {
      setDraftPermissions(JSON.parse(JSON.stringify(newRole.permissions || {})));
      setHasChanges(false);
    }
  }

  function handleActionToggle(mod, action) {
    setDraftPermissions((prev) => {
      const current = prev[mod] || [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [mod]: updated };
    });
    setHasChanges(true);
  }

  function handleModuleSelectAll(mod) {
    const allowed = MODULES_CONFIG[mod].allowedActions;
    setDraftPermissions((prev) => {
      const current = prev[mod] || [];
      const isAll = allowed.every((a) => current.includes(a));
      return {
        ...prev,
        [mod]: isAll ? [] : [...allowed],
      };
    });
    setHasChanges(true);
  }

  function handleColumnToggle(action) {
    setDraftPermissions((prev) => {
      const applicableModules = Object.entries(MODULES_CONFIG).filter(
        ([, cfg]) => cfg.allowedActions.includes(action)
      );
      const allHaveIt = applicableModules.every(([mod]) =>
        (prev[mod] || []).includes(action)
      );

      const next = { ...prev };
      applicableModules.forEach(([mod]) => {
        const cur = next[mod] || [];
        if (allHaveIt) {
          next[mod] = cur.filter((a) => a !== action);
        } else {
          if (!cur.includes(action)) {
            next[mod] = [...cur, action];
          }
        }
      });
      return next;
    });
    setHasChanges(true);
  }

  function handleSelectAll() {
    const full = {};
    Object.entries(MODULES_CONFIG).forEach(([mod, cfg]) => {
      full[mod] = [...cfg.allowedActions];
    });
    setDraftPermissions(full);
    setHasChanges(true);
  }

  function handleReadOnly() {
    const ro = {};
    Object.keys(MODULES_CONFIG).forEach((mod) => {
      ro[mod] = ["View"];
    });
    setDraftPermissions(ro);
    setHasChanges(true);
  }

  function handleReset() {
    if (activeRole) {
      setDraftPermissions(JSON.parse(JSON.stringify(activeRole.permissions || {})));
      setHasChanges(false);
      notify("Reverted to saved permissions for " + activeRole.name);
    }
  }

  function handleSave() {
    const count = Object.values(draftPermissions).reduce(
      (sum, acts) => sum + (acts ? acts.length : 0),
      0
    );
    if (count === 0) {
      notify("Business Rule 17: A role must have at least one permission.", "error");
      return;
    }

    saveRolePermissions(activeRole.id, draftPermissions);
    setHasChanges(false);
  }

  function exportMatrixCSV() {
    const rows = [];
    rows.push(["Module", "Action", ...roles.map((r) => r.name)]);

    Object.entries(MODULES_CONFIG).forEach(([mod, cfg]) => {
      ALL_ACTIONS.forEach((act) => {
        if (cfg.allowedActions.includes(act)) {
          const roleCols = roles.map((r) =>
            (r.permissions?.[mod] || []).includes(act) ? "GRANTED" : "DENIED"
          );
          rows.push([mod, act, ...roleCols]);
        }
      });
    });

    const csvContent = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `permission-matrix-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Permission matrix exported successfully.");
  }

  const activePermCount = Object.values(draftPermissions).reduce(
    (sum, acts) => sum + (acts ? acts.length : 0),
    0
  );

  return (
    <div className="secondary-page permission-matrix-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">RBAC-004 AUTHORIZATION CONFIGURATION</div>
          <h1>Permission Matrix</h1>
          <p className="secondary-description">
            Configure fine-grained module access and action permissions per role (Section 16).
          </p>
        </div>

        <div className="matrix-top-actions">
          <div className="view-mode-pill-toggle">
            <button
              className={`mode-toggle-btn ${viewMode === "single" ? "active" : ""}`}
              onClick={() => setViewMode("single")}
            >
              Role Editor
            </button>
            <button
              className={`mode-toggle-btn ${viewMode === "all" ? "active" : ""}`}
              onClick={() => setViewMode("all")}
            >
              All Roles Matrix
            </button>
          </div>

          <button className="secondary-button" onClick={exportMatrixCSV}>
            <Download size={16} /> Export Matrix CSV
          </button>
        </div>
      </div>

      {viewMode === "single" ? (
        <section className="content-card">
          {/* Card Top: Role Selector & Bulk controls */}
          <div className="matrix-control-bar">
            <div className="role-selector-wrap">
              <label htmlFor="role-select">Select Target Role:</label>
              <select
                id="role-select"
                value={activeRole?.id}
                onChange={(e) => handleRoleChange(Number(e.target.value))}
                className="role-dropdown-picker"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.status}) - Level {r.level}
                  </option>
                ))}
              </select>
            </div>

            <div className="bulk-actions-group">
              <button
                type="button"
                className="small-action-btn"
                onClick={handleSelectAll}
              >
                Grant All Actions
              </button>
              <button
                type="button"
                className="small-action-btn"
                onClick={handleReadOnly}
              >
                View Only
              </button>
              <button
                type="button"
                className="small-action-btn subtle"
                onClick={() => {
                  const empty = {};
                  Object.keys(MODULES_CONFIG).forEach((m) => (empty[m] = []));
                  setDraftPermissions(empty);
                  setHasChanges(true);
                }}
              >
                Clear All
              </button>
              {hasChanges && (
                <button
                  type="button"
                  className="small-action-btn reset"
                  onClick={handleReset}
                >
                  <RotateCcw size={13} /> Reset Draft
                </button>
              )}
            </div>
          </div>

          {/* Role Info Ribbon */}
          <div className="matrix-role-ribbon">
            <div className="ribbon-role-info">
              <div className="role-avatar">{activeRole?.name.charAt(0)}</div>
              <div>
                <strong>{activeRole?.name}</strong>
                <span>
                  {activeRole?.description} · Scope: <strong>{activeRole?.scope}</strong> · Level:{" "}
                  <strong>{activeRole?.level}</strong>
                </span>
              </div>
            </div>

            <div className="ribbon-stats">
              <span className="actions-count-badge">
                {activePermCount} Actions Active
              </span>
              {hasChanges && (
                <span className="unsaved-badge">Unsaved Changes</span>
              )}
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="table-scroll">
            <table className="permission-table interactive-matrix-table">
              <thead>
                <tr>
                  <th>MODULE</th>
                  {ALL_ACTIONS.map((action) => (
                    <th key={action}>
                      <button
                        type="button"
                        className="col-header-toggle-btn"
                        onClick={() => handleColumnToggle(action)}
                        title={`Toggle all ${action} permissions`}
                      >
                        {action.toUpperCase()}
                      </button>
                    </th>
                  ))}
                  <th>ROW CONTROLS</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(MODULES_CONFIG).map(([modName, config]) => {
                  const currentActions = draftPermissions[modName] || [];
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
                              <span className="dash-na" title="Action not applicable to this module">
                                -
                              </span>
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

          {/* Footer Save Area */}
          <div className="card-bottom-actions matrix-save-bar">
            <div className="save-hint">
              <Info size={15} />
              <span>
                Changes take effect for active sessions upon saving (Business Rule 17).
              </span>
            </div>

            <div className="save-buttons-wrap">
              <button
                type="button"
                className="secondary-button"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                Discard Edits
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleSave}
              >
                <Check size={16} /> Save Permissions for {activeRole?.name}
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* ALL ROLES MATRIX COMPARISON VIEW */
        <section className="content-card">
          <div className="card-heading">
            <div>
              <h3>Enterprise Matrix Comparison</h3>
              <p>Compare authorization footprints across all configured roles.</p>
            </div>
          </div>

          <div className="table-scroll">
            <table className="permission-table matrix-compare-table">
              <thead>
                <tr>
                  <th>MODULE</th>
                  <th>ACTION</th>
                  {roles.map((r) => (
                    <th key={r.id}>
                      <div className="role-col-header">
                        <strong>{r.name}</strong>
                        <span>Lvl {r.level}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(MODULES_CONFIG).flatMap(([modName, config]) =>
                  config.allowedActions.map((action, idx) => (
                    <tr key={`${modName}-${action}`}>
                      {idx === 0 ? (
                        <td
                          rowSpan={config.allowedActions.length}
                          className="module-group-td"
                        >
                          <strong>{modName}</strong>
                        </td>
                      ) : null}
                      <td className="action-label-td">{action}</td>
                      {roles.map((role) => {
                        const hasIt = (role.permissions?.[modName] || []).includes(action);
                        return (
                          <td key={role.id} className="status-center-td">
                            {hasIt ? (
                              <span className="perm-granted" title="Granted">
                                <CheckCircle2 size={16} />
                              </span>
                            ) : (
                              <span className="perm-denied" title="Denied">
                                <XCircle size={16} />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
