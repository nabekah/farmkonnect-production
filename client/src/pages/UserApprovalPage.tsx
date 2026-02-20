import React, { useState } from "react";
import { UserApprovalDashboard } from "@/components/UserApprovalDashboard";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const UserApprovalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("approvals");

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Approval Management</h1>
          <p className="text-gray-600 mt-2">Review, approve, and audit user registrations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="approvals">Approval Requests</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-6">
            <UserApprovalDashboard />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditLogViewer />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
