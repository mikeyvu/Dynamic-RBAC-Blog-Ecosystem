"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/utils/axios";
import axios from "axios";
import toast from "react-hot-toast";

interface User {
  id: number;
  email: string;
  roles: string[]; // Updated to accept multiple role names from Backend
}

interface Role {
  id: number;
  name: string;
  permissions: string[]; // List of permission codes assigned to this role
}
interface UserManagementProps {
  isAdmin: boolean;
}

export default function UserManagement({ isAdmin }: UserManagementProps) {
  // --- States for Users Management ---
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // 🌟 Local staging states for batch editing user roles
  const [activeEditingUserId, setActiveEditingUserId] = useState<number | null>(null);
  const [editingUserRoles, setEditingUserRoles] = useState<string[]>([]);
  const [updateUserLoading, setUpdateUserLoading] = useState(false);

  // --- States for Roles Management & Creation ---
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [allPermissions, setAllPermissions] = useState<string[]>([
    "post:create",
    "post:update",
    "post:delete",
    "user:manage",
    "post:approve"
  ]); // Available permissions in system

  // 🌟 Local staging states for batch editing existing roles
  const [activeEditingRoleId, setActiveEditingRoleId] = useState<number | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [updateRoleLoading, setUpdateRoleLoading] = useState(false);

  // Form states for creating a new role
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [createRoleLoading, setCreateRoleLoading] = useState(false);

  // Fetch all users and roles data from database
  const fetchData = async () => {
    try {
      setUsersLoading(true);
      setRolesLoading(true);
      
      // Concurrently fetch users and roles from NestJS Backend
      const [usersResponse, rolesResponse] = await Promise.all([
        api.get("/users"),
        api.get("/roles")
      ]);
      
      // Map incoming backend relational data structure safely
      const parsedUsers = usersResponse.data.map((u: any) => ({
        id: u.id,
        email: u.email,
        roles: u.roles ? u.roles.map((ur: any) => ur.role?.name || ur.roleName) : []
      }));

      setUsers(parsedUsers);
      setRoles(rolesResponse.data);
    } catch (err: unknown) {
      // Mock data temporarily if endpoints are pending on Backend
      setUsers([
        { id: 2, email: "author_mikey@gmail.com", roles: ["Author"] },
        { id: 3, email: "editor_test@gmail.com", roles: ["Author", "Editor"] }
      ]);
      setRoles([
        { id: 1, name: "Admin", permissions: ["post:create", "post:update", "post:delete", "user:manage", "post:approve"] },
        { id: 2, name: "Author", permissions: ["post:create", "post:update", "post:delete"] },
        { id: 3, name: "Editor", permissions: ["post:create", "post:update", "post:approve"] }
      ]);
    } finally {
      setUsersLoading(false);
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 🌟 Refactored Batch User Roles Handlers ---

  // Enter staging mode for a specific user's roles
  const startEditingUserRoles = (user: User) => {
    setActiveEditingUserId(user.id);
    setEditingUserRoles(user.roles); // Clone current roles list into state
  };

  // Cancel user staging mode without committing to database
  const cancelEditingUserRoles = () => {
    setActiveEditingUserId(null);
    setEditingUserRoles([]);
  };

  // Switch roles locally inside staging state (Zero network payload)
  const handleStageUserRoleToggle = (roleName: string) => {
    setEditingUserRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  };

  // Dispatches ONE combined payload update to the NestJS endpoint
  const handleSaveUserRoles = async (userId: number) => {
    setUpdateUserLoading(true);
    try {
      await api.patch(`/users/${userId}/roles`, { roles: editingUserRoles });
      toast.success("User roles updated successfully in one batch!");
      setActiveEditingUserId(null);
      fetchData();
    } catch (err: unknown) {
      let errorMsg = "Failed to update user roles!";
      if (axios.isAxiosError(err)) errorMsg = err.response?.data?.message || errorMsg;
      toast.error(errorMsg);
    } finally {
      setUpdateUserLoading(false);
    }
  };

  // Permanently delete a user from database
  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete user ${email}?`)) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User deleted completely from database!");
      fetchData();
    } catch (err: unknown) {
      let errorMsg = "Failed to delete user!";
      if (axios.isAxiosError(err)) errorMsg = err.response?.data?.message || errorMsg;
      toast.error(errorMsg);
    }
  };

  // --- Role Handlers ---
  const startEditingRole = (role: Role) => {
    setActiveEditingRoleId(role.id);
    setEditingPermissions(role.permissions);
  };

  const cancelEditingRole = () => {
    setActiveEditingRoleId(null);
    setEditingPermissions([]);
  };

  const handleStagePermissionToggle = (permission: string) => {
    setEditingPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const handleSaveRolePermissions = async (roleId: number) => {
    setUpdateRoleLoading(true);
    try {
      await api.patch(`/roles/${roleId}/permissions`, { permissions: editingPermissions });
      toast.success("Role permissions updated successfully!");
      setActiveEditingRoleId(null);
      fetchData();
    } catch (err: unknown) {
      let errorMsg = "Failed to update role permissions!";
      if (axios.isAxiosError(err)) errorMsg = err.response?.data?.message || errorMsg;
      toast.error(errorMsg);
    } finally {
      setUpdateRoleLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (roleName === "Admin") {
      toast.error("Cannot delete core system Admin role!");
      return;
    }
    if (!window.confirm(`Are you sure you want to completely delete the role "${roleName}"?`)) return;

    try {
      await api.delete(`/roles/${roleId}`);
      toast.success("Role deleted completely from database!");
      fetchData();
    } catch (err: unknown) {
      let errorMsg = "Failed to delete role!";
      if (axios.isAxiosError(err)) errorMsg = err.response?.data?.message || errorMsg;
      toast.error(errorMsg);
    }
  };

  // --- New Role Creation Handlers ---
  const handleCheckboxChange = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error("Please enter a valid role name!");
      return;
    }

    setCreateRoleLoading(true);
    try {
      await api.post("/roles", {
        name: newRoleName.trim(),
        permissions: selectedPermissions,
      });
      toast.success(`Role "${newRoleName}" created successfully!`);
      setNewRoleName("");
      setSelectedPermissions([]);
      fetchData();
    } catch (err: unknown) {
      let errorMsg = "Failed to create new role!";
      if (axios.isAxiosError(err)) errorMsg = err.response?.data?.message || errorMsg;
      toast.error(errorMsg);
    } finally {
      setCreateRoleLoading(false);
    }
  };

  if (!isAdmin) return null;
  return (
    <div className="space-y-8">
      
      {/* 👥 SECTION 1: USERS & MULTIPLE ROLES MANAGEMENT */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">👥 Users & Roles Assignment</CardTitle>
          <CardDescription>Assign multiple distinct structural roles per user or drop accounts entirely. System Admins are excluded.</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <p className="text-sm text-slate-500 animate-pulse py-4">Fetching system users...</p>
          ) : (
            <div className="space-y-6">
              {users.map((u) => {
                const isCurrentlyEditingUser = activeEditingUserId === u.id;
                const targetUserRoles = isCurrentlyEditingUser ? editingUserRoles : u.roles;
                const isUserAdmin = u.roles.includes("Admin");

                return (
                  <div key={u.id} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-base">{u.email}</h4>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {u.roles.map((r) => (
                            <span key={r} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-slate-200">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {!isUserAdmin && (
                          <>
                            {!isCurrentlyEditingUser ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditingUserRoles(u)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs font-semibold"
                              >
                                ✏️ Manage User Roles
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditingUserRoles}
                                  className="text-slate-500 text-xs font-medium"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={updateUserLoading}
                                  onClick={() => handleSaveUserRoles(u.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                >
                                  {updateUserLoading ? "Saving..." : "💾 Save Roles"}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                            >
                              🗑️ Delete User
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Checkbox Grid for assigning multiple roles to this user */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 border-t pt-3">
                      {roles.map((r) => {
                        const isChecked = targetUserRoles.includes(r.name);
                        const disabledCondition = isUserAdmin || !isCurrentlyEditingUser || r.name === "Admin";

                        return (
                          <label
                            key={r.id}
                            className={`flex items-center gap-2 border p-2 rounded text-xs font-medium transition-colors
                              ${disabledCondition ? 'cursor-not-allowed opacity-70 ' : 'cursor-pointer '}
                              ${isChecked ? 'bg-amber-50/50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={disabledCondition}
                              onChange={() => handleStageUserRoleToggle(r.name)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                            />
                            <span>{r.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🔐 SECTION 2: ROLES & PERMISSIONS MANAGEMENT (BATCH UPDATED) */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">🔑 Roles & Permissions</CardTitle>
          <CardDescription>Select multiple permissions before confirming to prevent server overload.</CardDescription>
        </CardHeader>
        <CardContent>
          {rolesLoading ? (
            <p className="text-sm text-slate-500 animate-pulse py-4">Fetching system roles...</p>
          ) : (
            <div className="space-y-6">
              {roles.map((role) => {
                const isCurrentlyEditing = activeEditingRoleId === role.id;
                const targetPermissions = isCurrentlyEditing ? editingPermissions : role.permissions;

                return (
                  <div key={role.id} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-slate-800 text-base">{role.name}</h4>
                        {role.name === "Admin" && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Core System</span>
                        )}
                        {isCurrentlyEditing && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">Unsaved Edits</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {role.name !== "Admin" && (
                          <>
                            {!isCurrentlyEditing ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditingRole(role)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs font-semibold"
                              >
                                ✏️ Edit Permissions
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditingRole}
                                  className="text-slate-500 text-xs font-medium"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={updateRoleLoading}
                                  onClick={() => handleSaveRolePermissions(role.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                >
                                  {updateRoleLoading ? "Saving..." : "💾 Update Permissions"}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id, role.name)}
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                            >
                              🗑️ Delete Role
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Grid List of Permissions checkboxes */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                      {allPermissions.map((perm) => {
                        const isChecked = targetPermissions.includes(perm);
                        const disabledCondition = role.name === "Admin" || !isCurrentlyEditing;

                        return (
                          <label 
                            key={perm} 
                            className={`flex items-center gap-2 border p-2 rounded text-xs font-medium transition-colors 
                              ${disabledCondition ? 'cursor-not-allowed opacity-80 ' : 'cursor-pointer '}
                              ${isChecked ? 'bg-blue-50/50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={disabledCondition}
                              onChange={() => handleStagePermissionToggle(perm)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                            />
                            <span>{perm}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✨ SECTION 3: CREATE NEW ROLE FORM */}
      <Card className="border-amber-200 bg-amber-50/10">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">✨ Create Custom System Role</CardTitle>
          <CardDescription>Declare a brand new functional role and instantly attach system permission codes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRoleSubmit} className="space-y-4 max-w-xl">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="roleName" className="font-bold text-slate-700">Role Name</Label>
              <Input
                id="roleName"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Moderator, Guest Editor..."
                className="bg-white"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-bold text-slate-700">Assign Initial Permissions</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allPermissions.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm);
                  return (
                    <label key={perm} className={`flex items-center gap-2 border p-2 rounded text-xs font-medium cursor-pointer transition-colors bg-white ${isChecked ? 'border-amber-500 bg-amber-50/30 text-amber-900' : 'border-slate-200 text-slate-500'}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(perm)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                      />
                      <span>{perm}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              disabled={createRoleLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              {createRoleLoading ? "Creating..." : "🚀 Generate New Role"}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}