"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  isBanned: boolean;
  banReason: string | null;
  profileComplete: number | null;
};

const ROLES = [
  { value: "", label: "All" },
  { value: "JOB_SEEKER", label: "Seeker" },
  { value: "RECRUITER", label: "Recruiter" },
  { value: "COMPANY_ADMIN", label: "Company Admin" },
  { value: "PLATFORM_ADMIN", label: "Platform Admin" },
];

const STATUSES = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "BANNED", label: "Banned" },
];

function buildUrl(params: {
  search: string;
  role: string;
  status: string;
  cursor: string;
}) {
  const u = new URLSearchParams();
  if (params.search) u.set("search", params.search);
  if (params.role) u.set("role", params.role);
  if (params.status) u.set("status", params.status);
  if (params.cursor) u.set("cursor", params.cursor);
  return `/api/admin/users?${u.toString()}`;
}

export function AdminUsersClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState("");
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [banUser, setBanUser] = useState<UserRow | null>(null);
  const [banReason, setBanReason] = useState("");
  const [unbanUser, setUnbanUser] = useState<UserRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCursor("");
  }, [debouncedSearch, role, status]);

  const url = buildUrl({
    search: debouncedSearch,
    role,
    status,
    cursor,
  });
  const { data, mutate } = useSWR<{
    users: UserRow[];
    nextCursor: string | null;
    hasMore: boolean;
  }>(url, fetcher);

  useEffect(() => {
    if (!data?.users) return;
    if (!cursor) setAllUsers(data.users);
    else setAllUsers((prev) => [...prev, ...data.users]);
  }, [data?.users, cursor]);

  const loadMore = () => {
    if (data?.nextCursor) setCursor(data.nextCursor);
  };
  const hasMore = data?.hasMore ?? false;
  const displayUsers = cursor ? allUsers : (data?.users ?? []);

  const handleBan = async () => {
    if (!banUser || banReason.trim().length < 10) return;
    const res = await fetch(`/api/admin/users/${banUser.id}/ban`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: banReason.trim() }),
    });
    if (res.ok) {
      setBanUser(null);
      setBanReason("");
      mutate();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Failed to ban user");
    }
  };

  const handleUnban = async () => {
    if (!unbanUser) return;
    const res = await fetch(`/api/admin/users/${unbanUser.id}/unban`, {
      method: "PATCH",
    });
    if (res.ok) {
      setUnbanUser(null);
      mutate();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Failed to unban user");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <Button
              key={r.value || "all"}
              variant={role === r.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRole(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <Button
              key={s.value || "all"}
              variant={status === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">
                  <Link
                    href={`/dashboard/admin/users/${u.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={undefined} />
                      <AvatarFallback>
                        {(u.name || u.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{u.name || "—"}</div>
                      <div className="text-muted-foreground text-xs">
                        {u.email}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="p-3">
                  <Badge variant="secondary">{u.role.replace(/_/g, " ")}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {formatDistanceToNow(new Date(u.createdAt), {
                    addSuffix: true,
                  })}
                </td>
                <td className="p-3">
                  {u.isBanned ? (
                    <Badge variant="destructive">Banned</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Link href={`/dashboard/admin/users/${u.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                  {u.isBanned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-1"
                      onClick={() => setUnbanUser(u)}
                    >
                      Unban
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-1"
                      onClick={() => setBanUser(u)}
                    >
                      Ban
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!displayUsers.length && (
          <div className="p-8 text-center text-muted-foreground">
            No users found.
          </div>
        )}
      </div>

      {hasMore && (
        <Button variant="outline" onClick={loadMore}>
          Load more
        </Button>
      )}

      <Dialog open={!!banUser} onOpenChange={(o) => !o && setBanUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban user</DialogTitle>
          </DialogHeader>
          {banUser && (
            <>
              <p className="text-sm text-muted-foreground">
                Banning <strong>{banUser.name || banUser.email}</strong>. This
                will immediately sign the user out.
              </p>
              <div>
                <Label htmlFor="ban-reason">Reason (min 10 characters)</Label>
                <textarea
                  id="ban-reason"
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for ban..."
                />
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={!banUser || banReason.trim().length < 10}
            >
              Ban user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!unbanUser}
        onOpenChange={(o) => !o && setUnbanUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban user?</AlertDialogTitle>
            <AlertDialogDescription>
              {unbanUser?.name || unbanUser?.email} will be able to sign in
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnban}>Unban</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
