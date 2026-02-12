import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FinancialManagementModule } from "@/components/FinancialManagementModule";

export function FinancialManagementPage() {
  // Use a default farm ID - in production, this would come from user context
  const farmId = "1";

  return (
    <DashboardLayout>
      <div className="p-6">
        <FinancialManagementModule farmId={farmId} />
      </div>
    </DashboardLayout>
  );
}
