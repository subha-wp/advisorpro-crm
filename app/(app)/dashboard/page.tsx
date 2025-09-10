"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Users,
  FileText,
  Target,
  IndianRupee,
  Activity,
  Zap,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  // --- Critical data ---
  const { data: statsData } = useSWR("/api/workspace/stats", fetcher);
  const { data: taskStatsData } = useSWR("/api/tasks/stats", fetcher);

  // --- Lazy loaded extras ---
  const [policies, setPolicies] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [policiesRes, clientsRes, auditRes] = await Promise.all([
          fetch("/api/policies?pageSize=5").then((r) => r.json()),
          fetch("/api/clients?pageSize=5").then((r) => r.json()),
          fetch("/api/audit?pageSize=6").then((r) => r.json()),
        ]);
        if (!mounted) return;
        setPolicies(policiesRes?.items ?? []);
        setClients(clientsRes?.items ?? []);
        setRecentActivities(auditRes?.items ?? []);
      } finally {
        if (mounted) setLoadingExtras(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = statsData?.stats ?? {};
  const taskStats = taskStatsData?.stats ?? {};

  const clientsCount = stats?.clients?.total ?? 0;
  const activeClients = stats?.clients?.active ?? 0;
  const policiesCount = stats?.policies?.total ?? 0;
  const activePolicies = stats?.policies?.active ?? 0;

  function getUserInitials(name?: string) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <section className="space-y-6">
      {/* Gradient Header */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back 👋</h1>
            <p className="text-sm opacity-90">Here’s your workspace snapshot</p>
          </div>
          <Badge className="bg-white/20 text-white border-0">
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:shadow-lg transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700">Active Clients</p>
                <p className="text-2xl font-bold">{activeClients}</p>
                <p className="text-xs text-blue-600">{clientsCount} total</p>
              </div>
              <div className="bg-blue-600 text-white p-2 rounded-full">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:shadow-lg transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-green-700">Active Policies</p>
                <p className="text-2xl font-bold">{activePolicies}</p>
                <p className="text-xs text-green-600">{policiesCount} total</p>
              </div>
              <div className="bg-green-600 text-white p-2 rounded-full">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 hover:shadow-lg transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-orange-700">Pending Tasks</p>
                <p className="text-2xl font-bold">{taskStats.pending ?? 0}</p>
                <p className="text-xs text-orange-600">
                  {taskStats.urgent ?? 0} urgent • {taskStats.overdue ?? 0} overdue
                </p>
              </div>
              <div className="bg-orange-600 text-white p-2 rounded-full">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:shadow-lg transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-purple-700">Premiums</p>
                <p className="text-2xl font-bold">
                  {stats?.premiums?.totalAmount
                    ? `₹${Number(stats.premiums.totalAmount).toLocaleString()}`
                    : "—"}
                </p>
                <p className="text-xs text-purple-600">Collected</p>
              </div>
              <div className="bg-purple-600 text-white p-2 rounded-full">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button
              asChild
              className="h-20 flex-col bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            >
              <Link href="/clients">
                <Users className="h-5 w-5" />
                Add Client
              </Link>
            </Button>
            <Button
              asChild
              className="h-20 flex-col bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
            >
              <Link href="/policies">
                <FileText className="h-5 w-5" />
                Add Policy
              </Link>
            </Button>
            <Button
              asChild
              className="h-20 flex-col bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
            >
              <Link href="/premiums">
                <IndianRupee className="h-5 w-5" />
                Record Payment
              </Link>
            </Button>
            <Button
              asChild
              className="h-20 flex-col bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
            >
              <Link href="/tasks">
                <Target className="h-5 w-5" />
                Create Task
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingExtras ? (
            <Skeleton className="h-24 w-full rounded-md" />
          ) : recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No recent activities
            </p>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-md bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={a.user?.avatarUrl || ""}
                      alt={a.user?.name || "User"}
                    />
                    <AvatarFallback>
                      {getUserInitials(a.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.user?.name ?? "System"} •{" "}
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Bottom */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">New Clients: {clients.length}</p>
            <p className="text-sm">New Policies: {policies.length}</p>
            <p className="text-sm">Tasks Completed: {taskStats.completed ?? 0}</p>
          </CardContent>
        </Card>

        {/* Attention */}
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">
              Overdue Premiums: {stats?.premiums?.overdue ?? 0}
            </p>
            <p className="text-sm text-orange-600">
              Urgent Tasks: {taskStats.urgent ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
