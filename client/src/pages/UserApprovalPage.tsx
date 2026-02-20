import React from "react";
import { UserApprovalDashboard } from "@/components/UserApprovalDashboard";
import DashboardLayout from "@/components/DashboardLayout";

export const UserApprovalPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Approval Management</h1>
          <p className="text-gray-600 mt-2">Review and approve new user registrations</p>
        </div>
        <UserApprovalDashboard />
      </div>
    </DashboardLayout>
  );
};
