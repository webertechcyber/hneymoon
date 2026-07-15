//client/src/App.tsx
import { Route, Switch } from "wouter";

import Landing from "@/pages/Landing";
import Home from "@/pages/Home";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForgotPassword from "@/pages/auth/ForgotPassword";

import CompleteProfile from "@/pages/CompleteProfile";
import Dashboard from "@/pages/dashboard/Dashboard";
import Discover from "@/pages/dashboard/Discover";
import Messages from "@/pages/dashboard/Messages";
import Notifications from "@/pages/dashboard/Notifications";
import Earnings from "@/pages/dashboard/Earnings";

import Subscription from "@/pages/subscription/Subscription";
import Referrals from "@/pages/subscription/Referrals";
import Checkout from "@/pages/checkout/Checkout";

import Profile from "@/pages/dashboard/Profile";
import Opportunities from "@/pages/dashboard/Opportunities";
import Settings from "@/pages/dashboard/Settings";
import DashboardReferrals from "@/pages/dashboard/Referrals";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminReports from "@/pages/admin/AdminReports";
import AdminAI from "@/pages/admin/AdminAI";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminReferrals from "@/pages/admin/AdminReferrals";
import AdminWithdrawals from "@/pages/admin/AdminWithdrawals";
import AdminOpportunities from "@/pages/admin/AdminOpportunities";

import NotFound from "@/pages/NotFound";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Landing} />

      <Route path="/home" component={Home} />

      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Requires a signed-in user, but not yet an active subscription */}
      <Route path="/complete-profile">
        <ProtectedRoute><CompleteProfile /></ProtectedRoute>
      </Route>

      {/* Member area — signed in required */}
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/discover">
        <ProtectedRoute><Discover /></ProtectedRoute>
      </Route>
      <Route path="/messages/:id?">
        <ProtectedRoute><Messages /></ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute><Notifications /></ProtectedRoute>
      </Route>
      <Route path="/earnings">
        <ProtectedRoute><Earnings /></ProtectedRoute>
      </Route>

      <Route path="/subscription">
        <ProtectedRoute><Subscription /></ProtectedRoute>
      </Route>
      <Route path="/subscription/referrals">
        <ProtectedRoute><Referrals /></ProtectedRoute>
      </Route>
      <Route path="/subscription/checkout">
        <ProtectedRoute><Checkout /></ProtectedRoute>
      </Route>
      <Route path="/checkout">
        <ProtectedRoute><Checkout /></ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/opportunities">
        <ProtectedRoute><Opportunities /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>
      <Route path="/referrals">
        <ProtectedRoute><DashboardReferrals /></ProtectedRoute>
      </Route>

      {/* Admin area — signed in AND admin flag required */}
      <Route path="/admin">
        <AdminRoute><AdminDashboard /></AdminRoute>
      </Route>
      <Route path="/admin/users">
        <AdminRoute><AdminUsers /></AdminRoute>
      </Route>
      <Route path="/admin/payments">
        <AdminRoute><AdminPayments /></AdminRoute>
      </Route>
      <Route path="/admin/reports">
        <AdminRoute><AdminReports /></AdminRoute>
      </Route>
      <Route path="/admin/ai">
        <AdminRoute><AdminAI /></AdminRoute>
      </Route>
      <Route path="/admin/settings">
        <AdminRoute><AdminSettings /></AdminRoute>
      </Route>
      <Route path="/admin/referrals">
        <AdminRoute><AdminReferrals /></AdminRoute>
      </Route>
      <Route path="/admin/withdrawals">
        <AdminRoute><AdminWithdrawals /></AdminRoute>
      </Route>
      <Route path="/admin/opportunities">
        <AdminRoute><AdminOpportunities /></AdminRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}
