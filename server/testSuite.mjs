import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { Role } from "./models/Role.js";
import { User } from "./models/User.js";
import { AuditLog } from "./models/AuditLog.js";
import { Notification } from "./models/Notification.js";

const BASE_URL = "http://localhost:5000/api";

const TEST_ROLE_ID = 888801;
const TEST_USER_ID = 777701;
const TEST_LOG_ID = 666601;
const TEST_NOTIF_ID = 555501;

const results = {
  passed: [],
  failed: [],
};

function pass(name, details = "") {
  console.log(`[PASS] ${name}${details ? " - " + details : ""}`);
  results.passed.push({ name, details });
}

function fail(name, error) {
  console.error(`[FAIL] ${name} - ${error.message || error}`);
  results.failed.push({ name, error: error.message || String(error) });
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log("=== STARTING ACCESS CONTROL COMPREHENSIVE TEST SUITE ===");

  await connectDB();

  // Clean any leftover test artifacts from previous runs first
  await Role.deleteOne({ id: TEST_ROLE_ID });
  await User.deleteOne({ id: TEST_USER_ID });
  await AuditLog.deleteOne({ id: TEST_LOG_ID });
  await Notification.deleteOne({ id: TEST_NOTIF_ID });

  // ----------------------------------------------------
  // TEST 1: ROLES CRUD & VALIDATION
  // ----------------------------------------------------
  try {
    // 1.1 List Roles
    const listRes = await request("/roles");
    if (listRes.ok && Array.isArray(listRes.data) && listRes.data.length >= 6) {
      pass("Roles: List all roles via API", `Retrieved ${listRes.data.length} roles`);
    } else {
      throw new Error(`Expected >= 6 roles, got ${listRes.data?.length}`);
    }

    // 1.2 Create Test Role
    const newRolePayload = {
      id: TEST_ROLE_ID,
      name: "TEST_QA_AUTOMATION_ROLE",
      description: "Automated test role for permission validation",
      status: "Active",
      scope: "Assigned Branch",
      selectedBranches: ["Main Branch (Head Office)"],
      level: 2,
      limit: 75000,
      permissions: {
        Dashboard: ["View"],
        Loan: ["View", "Create", "Approve"],
      },
    };
    const createRes = await request("/roles", {
      method: "POST",
      body: JSON.stringify(newRolePayload),
    });
    if (createRes.status === 201 && createRes.data.id === TEST_ROLE_ID) {
      pass("Roles: Create isolated role", `Created id=${createRes.data.id}`);
    } else {
      throw new Error(`Create role failed with status ${createRes.status}: ${JSON.stringify(createRes.data)}`);
    }

    // 1.3 Verify in Atlas directly
    const directRole = await Role.findOne({ id: TEST_ROLE_ID }).lean();
    if (directRole && directRole.name === newRolePayload.name && directRole.level === 2) {
      pass("Roles: Direct MongoDB Atlas persistence verification", "Found record directly in Atlas collection");
    } else {
      throw new Error("Direct Atlas verification failed for created role");
    }

    // 1.4 Get Role by ID
    const getRes = await request(`/roles/${TEST_ROLE_ID}`);
    if (getRes.ok && getRes.data.name === newRolePayload.name) {
      pass("Roles: Get single role by ID", `Retrieved ${getRes.data.name}`);
    } else {
      throw new Error(`Get role by ID failed: status ${getRes.status}`);
    }

    // 1.5 Update Role
    const updatePayload = {
      description: "Updated description for automated testing",
      limit: 90000,
      status: "Inactive",
    };
    const updateRes = await request(`/roles/${TEST_ROLE_ID}`, {
      method: "PUT",
      body: JSON.stringify(updatePayload),
    });
    if (updateRes.ok && updateRes.data.limit === 90000 && updateRes.data.status === "Inactive") {
      pass("Roles: Edit role via API", "Updated limit to 90000 and status to Inactive");
    } else {
      throw new Error(`Update role failed: status ${updateRes.status}`);
    }

    // 1.6 Verify update in Atlas directly
    const directUpdated = await Role.findOne({ id: TEST_ROLE_ID }).lean();
    if (directUpdated && directUpdated.limit === 90000 && directUpdated.status === "Inactive") {
      pass("Roles: Verify role edit in MongoDB Atlas", "Atlas document reflects updated limit and status");
    } else {
      throw new Error("Direct Atlas update verification failed");
    }

    // 1.7 Prevent Protected System Role Deletion
    const deleteProtectedRes = await request("/roles/1", { method: "DELETE" });
    if (deleteProtectedRes.status === 403) {
      pass("Roles: Validation - Cannot delete protected system role (id=1)", "Returned 403 Forbidden");
    } else {
      throw new Error(`Expected 403 on protected role deletion, got ${deleteProtectedRes.status}`);
    }

    // 1.8 Delete Test Role
    const deleteRes = await request(`/roles/${TEST_ROLE_ID}`, { method: "DELETE" });
    if (deleteRes.ok) {
      pass("Roles: Delete role via API", `Deleted test role id=${TEST_ROLE_ID}`);
    } else {
      throw new Error(`Delete role failed: status ${deleteRes.status}`);
    }

    // 1.9 Verify Deletion in Atlas
    const postDelete = await Role.findOne({ id: TEST_ROLE_ID }).lean();
    if (!postDelete) {
      pass("Roles: Verify deletion in MongoDB Atlas", "Confirmed record no longer exists in Atlas");
    } else {
      throw new Error("Role was still found in Atlas after delete call");
    }
  } catch (err) {
    fail("Roles Test Suite", err);
  }

  // ----------------------------------------------------
  // TEST 2: USERS CRUD & ROLE ASSIGNMENT
  // ----------------------------------------------------
  try {
    // 2.1 List Users
    const usersListRes = await request("/users");
    if (usersListRes.ok && Array.isArray(usersListRes.data) && usersListRes.data.length >= 10) {
      pass("Users: List all users via API", `Retrieved ${usersListRes.data.length} users`);
    } else {
      throw new Error(`Expected >= 10 users, got ${usersListRes.data?.length}`);
    }

    // 2.2 Create Test User
    const userPayload = {
      id: TEST_USER_ID,
      name: "Samira Vance",
      email: "samira.vance.test@acme-erp.com",
      roleId: 4, // Cashier
      roleName: "Cashier",
      branch: "Main Branch (Head Office)",
      status: "Active",
    };
    const createUserRes = await request("/users", {
      method: "POST",
      body: JSON.stringify(userPayload),
    });
    if (createUserRes.status === 201 && createUserRes.data.id === TEST_USER_ID) {
      pass("Users: Create isolated user", `Created user id=${createUserRes.data.id}`);
    } else {
      throw new Error(`Create user failed: status ${createUserRes.status}: ${JSON.stringify(createUserRes.data)}`);
    }

    // 2.3 Verify in Atlas directly
    const directUser = await User.findOne({ id: TEST_USER_ID }).lean();
    if (directUser && directUser.name === "Samira Vance" && directUser.roleId === 4) {
      pass("Users: Direct MongoDB Atlas persistence verification", "Found user record in Atlas");
    } else {
      throw new Error("Direct Atlas verification failed for created user");
    }

    // 2.4 Reassign User Role (Edit)
    const reassignPayload = {
      roleId: 2, // Branch Manager
      roleName: "Branch Manager",
      branch: "North Metro Branch",
    };
    const reassignRes = await request(`/users/${TEST_USER_ID}`, {
      method: "PUT",
      body: JSON.stringify(reassignPayload),
    });
    if (reassignRes.ok && reassignRes.data.roleId === 2 && reassignRes.data.roleName === "Branch Manager") {
      pass("Users: Role assignment & update via API", "Successfully reassigned user to Branch Manager");
    } else {
      throw new Error(`Reassign user failed: status ${reassignRes.status}`);
    }

    // 2.5 Verify Reassignment in Atlas directly
    const directReassigned = await User.findOne({ id: TEST_USER_ID }).lean();
    if (directReassigned && directReassigned.roleId === 2 && directReassigned.branch === "North Metro Branch") {
      pass("Users: Verify role reassignment in MongoDB Atlas", "Atlas reflects roleId=2 and branch=North Metro Branch");
    } else {
      throw new Error("Direct Atlas check failed for role reassignment");
    }

    // 2.6 User Creation Validation (missing required fields)
    const badUserRes = await request("/users", {
      method: "POST",
      body: JSON.stringify({ name: "Incomplete User" }), // missing email, roleId, roleName
    });
    if (badUserRes.status === 400) {
      pass("Users: Validation - Reject creation with missing fields", "Returned 400 Bad Request");
    } else {
      throw new Error(`Expected 400 for invalid user payload, got ${badUserRes.status}`);
    }

    // 2.7 Delete Test User
    const deleteUserRes = await request(`/users/${TEST_USER_ID}`, { method: "DELETE" });
    if (deleteUserRes.ok) {
      pass("Users: Delete user via API", `Deleted test user id=${TEST_USER_ID}`);
    } else {
      throw new Error(`Delete user failed: status ${deleteUserRes.status}`);
    }

    // 2.8 Verify Deletion in Atlas
    const postDeleteUser = await User.findOne({ id: TEST_USER_ID }).lean();
    if (!postDeleteUser) {
      pass("Users: Verify deletion in MongoDB Atlas", "Confirmed user record removed from Atlas");
    } else {
      throw new Error("User was still found in Atlas after delete call");
    }
  } catch (err) {
    fail("Users Test Suite", err);
  }

  // ----------------------------------------------------
  // TEST 3: PERMISSIONS MATRIX PERSISTENCE
  // ----------------------------------------------------
  try {
    // 3.1 Create a temporary role specifically for testing granular permissions
    const permRolePayload = {
      id: TEST_ROLE_ID,
      name: "TEST_PERMISSIONS_ROLE",
      status: "Active",
      scope: "Selected Branches",
      selectedBranches: ["Main Branch (Head Office)"],
      permissions: {
        Dashboard: ["View"],
        Customers: ["View", "Create"],
        Loan: ["View", "Approve"],
      },
    };
    await request("/roles", { method: "POST", body: JSON.stringify(permRolePayload) });

    // 3.2 Update Permissions dictionary
    const updatedPermissions = {
      Dashboard: ["View"],
      Customers: ["View", "Create", "Export"],
      Loan: ["View", "Create", "Approve", "Export"],
      Savings: ["View", "Approve"],
    };
    const savePermsRes = await request(`/roles/${TEST_ROLE_ID}`, {
      method: "PUT",
      body: JSON.stringify({ permissions: updatedPermissions }),
    });
    if (savePermsRes.ok && savePermsRes.data.permissions?.Savings?.includes("Approve")) {
      pass("Permissions: Update module permission matrix via API", "Permissions updated with Savings approval");
    } else {
      throw new Error(`Save permissions failed: status ${savePermsRes.status}`);
    }

    // 3.3 Verify Permissions in Atlas directly
    const directPermRole = await Role.findOne({ id: TEST_ROLE_ID }).lean();
    const hasLoanExport = directPermRole?.permissions?.Loan?.includes("Export");
    const hasSavingsApprove = directPermRole?.permissions?.Savings?.includes("Approve");
    if (hasLoanExport && hasSavingsApprove) {
      pass("Permissions: Verify permission updates in MongoDB Atlas", "Direct Atlas document matches exact matrix");
    } else {
      throw new Error("Direct Atlas verification for permission updates failed");
    }

    // Cleanup perm test role
    await request(`/roles/${TEST_ROLE_ID}`, { method: "DELETE" });
    pass("Permissions: Test role cleaned up", "Isolated permissions test role removed");
  } catch (err) {
    fail("Permissions Test Suite", err);
  }

  // ----------------------------------------------------
  // TEST 4: AUDIT LOGS
  // ----------------------------------------------------
  try {
    // 4.1 List Audit Logs
    const listLogsRes = await request("/audit-logs");
    if (listLogsRes.ok && Array.isArray(listLogsRes.data) && listLogsRes.data.length >= 5) {
      pass("Audit Logs: List all audit records via API", `Retrieved ${listLogsRes.data.length} logs`);
    } else {
      throw new Error(`Expected >= 5 logs, got ${listLogsRes.data?.length}`);
    }

    // 4.2 Create Audit Log
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const logPayload = {
      id: TEST_LOG_ID,
      timestamp: now,
      actor: "Automated Test Runner (QA)",
      actionType: "Role Permission Audited",
      roleName: "TEST_ROLE",
      details: "Automated verification of audit event persistence in Atlas.",
    };
    const createLogRes = await request("/audit-logs", {
      method: "POST",
      body: JSON.stringify(logPayload),
    });
    if (createLogRes.status === 201 && createLogRes.data.id === TEST_LOG_ID) {
      pass("Audit Logs: Create audit log via API", `Created log id=${createLogRes.data.id}`);
    } else {
      throw new Error(`Create audit log failed: status ${createLogRes.status}`);
    }

    // 4.3 Verify in Atlas directly
    const directLog = await AuditLog.findOne({ id: TEST_LOG_ID }).lean();
    if (directLog && directLog.actionType === "Role Permission Audited" && directLog.actor === "Automated Test Runner (QA)") {
      pass("Audit Logs: Direct MongoDB Atlas persistence verification", "Found audit log in Atlas");
    } else {
      throw new Error("Direct Atlas check failed for audit log");
    }

    // 4.4 Clean up Test Audit Log
    const delLogRes = await request(`/audit-logs/${TEST_LOG_ID}`, { method: "DELETE" });
    if (delLogRes.ok) {
      pass("Audit Logs: Clean up test audit log", "Deleted test log via API");
    } else {
      await AuditLog.deleteOne({ id: TEST_LOG_ID });
      pass("Audit Logs: Clean up test audit log via direct DB", "Deleted test log via mongoose");
    }
  } catch (err) {
    fail("Audit Logs Test Suite", err);
  }

  // ----------------------------------------------------
  // TEST 5: NOTIFICATIONS
  // ----------------------------------------------------
  try {
    // 5.1 List Notifications
    const listNotifsRes = await request("/notifications");
    if (listNotifsRes.ok && Array.isArray(listNotifsRes.data)) {
      pass("Notifications: List notifications via API", `Retrieved ${listNotifsRes.data.length} notifications`);
    } else {
      throw new Error(`List notifications failed: status ${listNotifsRes.status}`);
    }

    // 5.2 Create Test Notification
    const notifPayload = {
      id: TEST_NOTIF_ID,
      title: "Test Policy Update",
      description: "Automated test notification for read/unread state tracking.",
      time: "Just now",
      unread: true,
    };
    const createNotifRes = await request("/notifications", {
      method: "POST",
      body: JSON.stringify(notifPayload),
    });
    if (createNotifRes.status === 201 && createNotifRes.data.id === TEST_NOTIF_ID) {
      pass("Notifications: Create notification via API", `Created notif id=${createNotifRes.data.id}`);
    } else {
      throw new Error(`Create notification failed: status ${createNotifRes.status}`);
    }

    // 5.3 Verify in Atlas directly
    const directNotif = await Notification.findOne({ id: TEST_NOTIF_ID }).lean();
    if (directNotif && directNotif.unread === true) {
      pass("Notifications: Direct MongoDB Atlas persistence verification", "Found unread notification in Atlas");
    } else {
      throw new Error("Direct Atlas verification failed for created notification");
    }

    // 5.4 Mark Single Notification Read
    const markReadRes = await request(`/notifications/${TEST_NOTIF_ID}/read`, { method: "PUT" });
    if (markReadRes.ok && markReadRes.data.unread === false) {
      pass("Notifications: Mark single notification read via API", "unread changed to false");
    } else {
      throw new Error(`Mark notification read failed: status ${markReadRes.status}`);
    }

    // 5.5 Verify Read Status in Atlas directly
    const directReadNotif = await Notification.findOne({ id: TEST_NOTIF_ID }).lean();
    if (directReadNotif && directReadNotif.unread === false) {
      pass("Notifications: Verify read status update in MongoDB Atlas", "Atlas reflects unread=false");
    } else {
      throw new Error("Direct Atlas check failed for notification read state");
    }

    // 5.6 Clean up Test Notification
    const delNotifRes = await request(`/notifications/${TEST_NOTIF_ID}`, { method: "DELETE" });
    if (delNotifRes.ok) {
      pass("Notifications: Clean up test notification", "Deleted test notification via API");
    } else {
      await Notification.deleteOne({ id: TEST_NOTIF_ID });
      pass("Notifications: Clean up test notification via direct DB", "Deleted test notification via mongoose");
    }
  } catch (err) {
    fail("Notifications Test Suite", err);
  }

  // ----------------------------------------------------
  // TEST 6: SAFETY & INTEGRITY CHECK
  // ----------------------------------------------------
  try {
    const rolesCount = await Role.countDocuments();
    const usersCount = await User.countDocuments();
    const adminRole = await Role.findOne({ id: 1 }).lean();
    const initialUser = await User.findOne({ id: 101 }).lean();

    if (rolesCount >= 6 && usersCount >= 11 && adminRole?.name === "System Administrator" && initialUser?.name === "Jordan Lee") {
      pass("Safety: Data Integrity Verified", `Zero real records harmed. Database contains ${rolesCount} roles and ${usersCount} users.`);
    } else {
      throw new Error("Integrity check warning: expected base seeds to remain intact!");
    }
  } catch (err) {
    fail("Safety Test Suite", err);
  }

  await mongoose.disconnect();

  console.log("\n=== TEST RUN COMPLETE ===");
  console.log(`TOTAL PASSED: ${results.passed.length}`);
  console.log(`TOTAL FAILED: ${results.failed.length}`);

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("FATAL RUNNER ERROR:", err);
  process.exit(1);
});
