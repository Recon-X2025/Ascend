"use client";

import { useState, useEffect } from "react";
import { ConnectionCard } from "./ConnectionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Building2, Users } from "lucide-react";

type ConnectionRow = {
  id: string;
  status: string;
  isRequester: boolean;
  other: {
    id: string;
    name: string | null;
    image: string | null;
    headline: string | null;
    currentRole: string | null;
    currentCompany: string | null;
    username: string | null;
  };
};

type Suggestion = ConnectionRow["other"];

type CircleData = {
  yourNetwork: Suggestion[];
  yourIndustry: Suggestion[];
  atThisCompany: Suggestion[];
};

type FollowingCompany = { id: string; slug: string; name: string };

export function NetworkPageClient() {
  const [tab, setTab] = useState("network");
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [pending, setPending] = useState<ConnectionRow[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [circles, setCircles] = useState<CircleData | null>(null);
  const [following, setFollowing] = useState<FollowingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState<string | null>(null);

  const loadConnections = () => {
    Promise.all([
      fetch("/api/connections?status=ACCEPTED").then((r) => r.json()),
      fetch("/api/connections?status=PENDING").then((r) => r.json()),
      fetch("/api/connections/suggestions").then((r) => r.json()),
      fetch("/api/network/circles").then((r) => r.json()),
    ]).then(([conn, pend, sugg, circ]) => {
      if (conn.success) setConnections(conn.data ?? []);
      if (pend.success) setPending(pend.data ?? []);
      if (sugg.success) setSuggestions(sugg.data ?? []);
      if (circ.success) setCircles(circ.data ?? null);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadConnections();
    fetch("/api/companies/following")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setFollowing(d.data);
      })
      .catch(() => {});
  }, []);

  const handleConnect = async (userId: string) => {
    setConnectLoading(userId);
    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: userId }),
      });
      const data = await res.json();
      if (data.success) loadConnections();
    } finally {
      setConnectLoading(null);
    }
  };

  const handleRespond = async (connectionId: string, action: "accept" | "decline") => {
    setConnectLoading(connectionId);
    try {
      const res = await fetch(`/api/connections/${connectionId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) loadConnections();
    } finally {
      setConnectLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const tabClass = (v: string) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      tab === v
        ? "border-primary text-primary bg-muted/50"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6">
        <button type="button" className={tabClass("network")} onClick={() => setTab("network")}>
          My Network
        </button>
        <button type="button" className={tabClass("circles")} onClick={() => setTab("circles")}>
          Circles
        </button>
        <button type="button" className={tabClass("following")} onClick={() => setTab("following")}>
          Following
        </button>
      </div>

      {tab === "network" && (
      <div className="space-y-8">
        {pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.map((c) => (
                <ConnectionCard
                  key={c.id}
                  user={c.other}
                  status="PENDING"
                  isRequester={c.isRequester}
                  connectionId={c.id}
                  onRespond={!c.isRequester ? handleRespond : undefined}
                  connectLoading={connectLoading === c.id}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Network ({connections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Your network grows as you connect with colleagues, interviewers, and peers.
              </p>
            ) : (
              <div className="space-y-3">
                {connections.map((c) => (
                  <ConnectionCard
                    key={c.id}
                    user={c.other}
                    status="ACCEPTED"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">People who can help you get there</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.map((u) => (
                <ConnectionCard
                  key={u.id}
                  user={u}
                  status="none"
                  onConnect={handleConnect}
                  connectLoading={connectLoading === u.id}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {tab === "circles" && circles && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Network</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {circles.yourNetwork.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No connections yet.</p>
                ) : (
                  circles.yourNetwork.map((u) => (
                    <ConnectionCard key={u.id} user={u} status="ACCEPTED" />
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Industry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {circles.yourIndustry.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Complete your profile to see suggestions.</p>
                ) : (
                  circles.yourIndustry.map((u) => (
                    <ConnectionCard
                      key={u.id}
                      user={u}
                      status="none"
                      onConnect={handleConnect}
                      connectLoading={connectLoading === u.id}
                    />
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">At This Company</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {circles.atThisCompany.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add work history to see colleagues.</p>
                ) : (
                  circles.atThisCompany.map((u) => (
                    <ConnectionCard
                      key={u.id}
                      user={u}
                      status="none"
                      onConnect={handleConnect}
                      connectLoading={connectLoading === u.id}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
      )}

      {tab === "following" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Companies you follow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Follow companies to get career updates when they post new roles.
            </p>
            <div className="grid gap-2">
              {following.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Follow companies to see new roles in your career updates.
                </p>
              ) : (
                following.map((c) => (
                  <CompanyFollowRow key={c.id} slug={c.slug} name={c.name} initialFollowing />
                ))
              )}
            </div>
            <Link href="/companies" className="text-sm text-primary hover:underline mt-4 inline-block">
              Discover more companies
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CompanyFollowRow({
  slug,
  name,
  initialFollowing = false,
}: {
  slug: string;
  name: string;
  initialFollowing?: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);

  const toggle = async () => {
    const res = await fetch(`/api/companies/${slug}/follow`, { method: "POST" });
    const d = await res.json();
    if (d.success) setFollowing(d.data.following);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <Link href={`/companies/${slug}`} className="font-medium hover:underline">
        {name}
      </Link>
      <button
        type="button"
        onClick={toggle}
        className="text-sm text-primary hover:underline"
      >
        {following ? "Unfollow" : "Follow"}
      </button>
    </div>
  );
}
