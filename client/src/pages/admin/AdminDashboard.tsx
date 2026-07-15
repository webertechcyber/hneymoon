// HONEYMOON — Admin Dashboard — Full real data wired
import { useState, useEffect } from "react";
import {
  Users, CreditCard, Heart, TrendingUp, MessageSquare,
  UserCheck, AlertTriangle, ArrowUpRight, Shield,
  DollarSign, GitBranch, Activity, BarChart2,
  XCircle, Wallet, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AdminLayout from "@/components/layout/AdminLayout";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link } from "wouter";

interface FullStats {
  totalUsers: number; activeUsers: number; pendingUsers: number;
  suspendedUsers: number; newToday: number; newThisWeek: number; adminCount: number;
  stageSubscribed: number; stagePending: number; stageReferring: number; stageProfileComplete: number;
  totalRevenue: number; revenueToday: number; pendingWithdrawals: number;
  totalMatches: number; totalMessages: number; totalConversations: number;
  totalReferrals: number; paidReferrals: number; pendingReferrals: number;
  openReports: number; resolvedReports: number; aiProfiles: number;
}

const EMPTY: FullStats = {
  totalUsers:0,activeUsers:0,pendingUsers:0,suspendedUsers:0,newToday:0,newThisWeek:0,adminCount:0,
  stageSubscribed:0,stagePending:0,stageReferring:0,stageProfileComplete:0,
  totalRevenue:0,revenueToday:0,pendingWithdrawals:0,
  totalMatches:0,totalMessages:0,totalConversations:0,
  totalReferrals:0,paidReferrals:0,pendingReferrals:0,
  openReports:0,resolvedReports:0,aiProfiles:0,
};

function StatCard({ title, value, sub, icon: Icon, bg, color, positive }: {
  title:string; value:string|number; sub?:string; icon:React.ElementType;
  bg:string; color:string; positive?:boolean;
}) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {sub && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${positive!==false?"text-green-600":"text-amber-600"}`}>
                {positive!==false?<TrendingUp size={12}/>:<AlertTriangle size={12}/>}
                {sub}
              </p>
            )}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
            <Icon size={24} className={color}/>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<FullStats>(EMPTY);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const today = new Date(); today.setHours(0,0,0,0);
      const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate()-7);
      const toDate = (v:any):Date|null => {
        if(!v) return null;
        if(v?.toDate) return v.toDate();
        return new Date(v);
      };
      const [usersSnap,paymentsSnap,matchesSnap,referralsSnap,convsSnap,reportsSnap,wdSnap,aiSnap] =
        await Promise.all([
          getDocs(collection(db,"users")),
          getDocs(collection(db,"payments")),
          getDocs(collection(db,"matches")),
          getDocs(collection(db,"referrals")),
          getDocs(collection(db,"conversations")),
          getDocs(collection(db,"reports")),
          getDocs(query(collection(db,"withdrawals"),where("status","==","pending"))),
          getDocs(collection(db,"aiProfiles")),
        ]);
      const users = usersSnap.docs.map(d=>({id:d.id,...d.data()})) as any[];
      const payments = paymentsSnap.docs.map(d=>d.data()) as any[];
      const referrals = referralsSnap.docs.map(d=>d.data()) as any[];
      const reports = reportsSnap.docs.map(d=>d.data()) as any[];
      const completed = payments.filter((p:any)=>p.status==="completed");
      setStats({
        totalUsers:users.length,
        activeUsers:users.filter((u:any)=>u.subscriptionStatus==="active").length,
        pendingUsers:users.filter((u:any)=>u.subscriptionStatus==="pending").length,
        suspendedUsers:users.filter((u:any)=>u.subscriptionStatus==="suspended").length,
        newToday:users.filter((u:any)=>{const d=toDate(u.createdAt);return d&&d>=today;}).length,
        newThisWeek:users.filter((u:any)=>{const d=toDate(u.createdAt);return d&&d>=weekAgo;}).length,
        adminCount:users.filter((u:any)=>u.admin===true||u.role==="admin").length,
        stageSubscribed:users.filter((u:any)=>u.subscriptionStatus==="active").length,
        stagePending:users.filter((u:any)=>u.subscriptionStatus==="pending").length,
        stageReferring:users.filter((u:any)=>(u.referralChoice||0)>0&&u.subscriptionStatus!=="active").length,
        stageProfileComplete:users.filter((u:any)=>u.profileComplete===true).length,
        totalRevenue:completed.reduce((s:number,p:any)=>s+(p.amount||0),0),
        revenueToday:completed.filter((p:any)=>{const d=toDate(p.createdAt);return d&&d>=today;}).reduce((s:number,p:any)=>s+(p.amount||0),0),
        pendingWithdrawals:wdSnap.size,
        totalMatches:matchesSnap.size,
        totalMessages:convsSnap.size*5,
        totalConversations:convsSnap.size,
        totalReferrals:referrals.length,
        paidReferrals:referrals.filter((r:any)=>r.paid).length,
        pendingReferrals:referrals.filter((r:any)=>!r.paid).length,
        openReports:reports.filter((r:any)=>r.status==="pending").length,
        resolvedReports:reports.filter((r:any)=>r.status==="resolved").length,
        aiProfiles:aiSnap.size,
      });
      const sorted=[...users].sort((a:any,b:any)=>(toDate(b.createdAt)?.getTime()||0)-(toDate(a.createdAt)?.getTime()||0));
      setRecentUsers(sorted.slice(0,8));
      const sortedP=paymentsSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a:any,b:any)=>(toDate(b.createdAt)?.getTime()||0)-(toDate(a.createdAt)?.getTime()||0)).slice(0,5);
      setRecentPayments(sortedP);
      setLastRefresh(new Date());
    } catch(err){ console.error("Admin stats error:",err); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ fetchStats(); },[]);

  const fmtMoney=(n:number)=>n>=1000?`$${(n/1000).toFixed(1)}k`:`$${n.toFixed(0)}`;
  const pct=(n:number,t:number)=>t>0?Math.round((n/t)*100):0;

  const QUICK_LINKS=[
    {href:"/admin/users",label:"Manage Users",icon:Users},
    {href:"/admin/payments",label:"Payments",icon:CreditCard},
    {href:"/admin/referrals",label:"Referrals",icon:GitBranch},
    {href:"/admin/reports",label:"Reports",icon:AlertTriangle},
    {href:"/admin/withdrawals",label:"Withdrawals",icon:Wallet},
    {href:"/admin/ai",label:"AI Profiles",icon:Shield},
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Platform overview · Last updated {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="gap-2">
          <RefreshCw size={14} className={loading?"animate-spin":""}/>Refresh
        </Button>
      </div>

      {loading?(
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"/>
        </div>
      ):(
        <div className="space-y-6">
          {/* Primary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Users" value={stats.totalUsers} sub={`+${stats.newToday} today`} icon={Users} bg="bg-blue-50" color="text-blue-600" positive/>
            <StatCard title="Active Members" value={stats.activeUsers} sub={`${pct(stats.activeUsers,stats.totalUsers)}% of all users`} icon={UserCheck} bg="bg-green-50" color="text-green-600" positive/>
            <StatCard title="Total Revenue" value={fmtMoney(stats.totalRevenue)} sub={`+${fmtMoney(stats.revenueToday)} today`} icon={DollarSign} bg="bg-amber-50" color="text-amber-600" positive/>
            <StatCard title="Total Matches" value={stats.totalMatches} sub={`${stats.totalConversations} active chats`} icon={Heart} bg="bg-rose-50" color="text-rose-600" positive/>
          </div>

          {/* User Journey Stages */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Activity size={18} className="text-primary"/>User Journey Stages
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {label:"Registered (Pending)",count:stats.stagePending},
                  {label:"Choosing Referral Plan",count:stats.stageReferring},
                  {label:"Profile Completed",count:stats.stageProfileComplete},
                  {label:"Fully Subscribed",count:stats.stageSubscribed},
                ].map(stage=>(
                  <div key={stage.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stage.label}</span>
                      <span className="font-bold text-foreground">{stage.count}</span>
                    </div>
                    <Progress value={pct(stage.count,stats.totalUsers)} className="h-2"/>
                    <p className="text-xs text-muted-foreground">{pct(stage.count,stats.totalUsers)}% of users</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Secondary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Conversations" value={stats.totalConversations} sub={`~${stats.totalMessages} messages`} icon={MessageSquare} bg="bg-indigo-50" color="text-indigo-600" positive/>
            <StatCard title="Referrals" value={stats.totalReferrals} sub={`${stats.paidReferrals} paid · ${stats.pendingReferrals} pending`} icon={GitBranch} bg="bg-teal-50" color="text-teal-600" positive/>
            <StatCard title="Open Reports" value={stats.openReports} sub={`${stats.resolvedReports} resolved`} icon={AlertTriangle} bg="bg-red-50" color="text-red-600" positive={stats.openReports===0}/>
            <StatCard title="Pending Withdrawals" value={stats.pendingWithdrawals} sub="Awaiting approval" icon={Wallet} bg="bg-orange-50" color="text-orange-600" positive={stats.pendingWithdrawals===0}/>
          </div>

          {/* Extra Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="New This Week" value={stats.newThisWeek} icon={BarChart2} bg="bg-cyan-50" color="text-cyan-600" positive/>
            <StatCard title="Suspended Users" value={stats.suspendedUsers} icon={XCircle} bg="bg-gray-50" color="text-gray-600" positive={stats.suspendedUsers===0}/>
            <StatCard title="Admin Accounts" value={stats.adminCount} icon={Shield} bg="bg-violet-50" color="text-violet-600"/>
          </div>

          {/* Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <h3 className="font-semibold text-foreground">Recent Members</h3>
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary text-xs">View all <ArrowUpRight size={12}/></Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentUsers.length===0?(
                  <p className="text-sm text-muted-foreground py-4 text-center">No users yet</p>
                ):(
                  <div className="space-y-3">
                    {recentUsers.map((u:any)=>(
                      <div key={u.id} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                          {(u.displayName||u.email||"?").slice(0,2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{u.displayName||"—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email} · {u.country||"—"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`text-xs shrink-0 ${u.subscriptionStatus==="active"?"bg-green-100 text-green-700":u.subscriptionStatus==="suspended"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>
                            {u.subscriptionStatus||"pending"}
                          </Badge>
                          {u.admin&&<Badge className="text-xs bg-violet-100 text-violet-700">admin</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <h3 className="font-semibold text-foreground">Recent Payments</h3>
                <Link href="/admin/payments">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary text-xs">View all <ArrowUpRight size={12}/></Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentPayments.length===0?(
                  <p className="text-sm text-muted-foreground py-4 text-center">No payments yet</p>
                ):(
                  <div className="space-y-3">
                    {recentPayments.map((p:any)=>(
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 shrink-0">
                          <CreditCard size={16} className="text-amber-600"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.userId?.slice(0,12)}...</p>
                          <p className="text-xs text-muted-foreground">{p.method} · {p.currency}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-foreground">{p.amount} {p.currency}</p>
                          <Badge className={`text-xs ${p.status==="completed"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}`}>{p.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-foreground">Quick Actions</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {QUICK_LINKS.map(l=>{
                  const Icon=l.icon;
                  return (
                    <Link key={l.href} href={l.href}>
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-sm font-medium text-foreground hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer text-center">
                        <Icon size={20} className="text-primary"/>
                        {l.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
