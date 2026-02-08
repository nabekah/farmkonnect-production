/**
 * PDF Export utilities for expenses and revenue
 */

export const generateExpensePDF = (
  expenses: any[],
  farmName: string,
  dateRange: string
): string => {
  const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  
  let pdfContent = `
FARM EXPENSE REPORT
${farmName}
Report Period: ${dateRange}
Generated: ${new Date().toLocaleDateString()}

================================================================================
EXPENSE SUMMARY
================================================================================

Total Expenses: GHS ${totalAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
Number of Records: ${expenses.length}

================================================================================
EXPENSE DETAILS
================================================================================

`;

  expenses.forEach((exp, idx) => {
    const date = new Date(exp.expenseDate).toLocaleDateString("en-US");
    pdfContent += `
${idx + 1}. ${exp.category.toUpperCase()}
   Date: ${date}
   Description: ${exp.description}
   Vendor: ${exp.vendor || "N/A"}
   Amount: GHS ${parseFloat(exp.amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}
   Status: ${exp.paymentStatus || "pending"}
   ${exp.notes ? `Notes: ${exp.notes}` : ""}

`;
  });

  // Breakdown by category
  const breakdown: Record<string, number> = {};
  expenses.forEach(exp => {
    breakdown[exp.category] = (breakdown[exp.category] || 0) + parseFloat(exp.amount);
  });

  pdfContent += `
================================================================================
EXPENSE BREAKDOWN BY CATEGORY
================================================================================

`;

  Object.entries(breakdown).forEach(([category, amount]) => {
    const percentage = ((amount / totalAmount) * 100).toFixed(1);
    pdfContent += `${category.toUpperCase()}: GHS ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${percentage}%)\n`;
  });

  pdfContent += `
================================================================================
END OF REPORT
================================================================================
`;

  return pdfContent;
};

export const generateRevenuePDF = (
  revenues: any[],
  farmName: string,
  dateRange: string
): string => {
  const totalAmount = revenues.reduce((sum, rev) => sum + parseFloat(rev.amount), 0);
  
  let pdfContent = `
FARM REVENUE REPORT
${farmName}
Report Period: ${dateRange}
Generated: ${new Date().toLocaleDateString()}

================================================================================
REVENUE SUMMARY
================================================================================

Total Revenue: GHS ${totalAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
Number of Records: ${revenues.length}

================================================================================
REVENUE DETAILS
================================================================================

`;

  revenues.forEach((rev, idx) => {
    const date = new Date(rev.revenueDate).toLocaleDateString("en-US");
    pdfContent += `
${idx + 1}. ${rev.revenueType.toUpperCase().replace(/_/g, " ")}
   Date: ${date}
   Description: ${rev.description}
   Buyer: ${rev.buyer || "N/A"}
   Amount: GHS ${parseFloat(rev.amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}
   Status: ${rev.paymentStatus || "pending"}
   ${rev.notes ? `Notes: ${rev.notes}` : ""}

`;
  });

  // Breakdown by source
  const breakdown: Record<string, number> = {};
  revenues.forEach(rev => {
    breakdown[rev.revenueType] = (breakdown[rev.revenueType] || 0) + parseFloat(rev.amount);
  });

  pdfContent += `
================================================================================
REVENUE BREAKDOWN BY SOURCE
================================================================================

`;

  Object.entries(breakdown).forEach(([source, amount]) => {
    const percentage = ((amount / totalAmount) * 100).toFixed(1);
    pdfContent += `${source.toUpperCase().replace(/_/g, " ")}: GHS ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${percentage}%)\n`;
  });

  pdfContent += `
================================================================================
END OF REPORT
================================================================================
`;

  return pdfContent;
};

export const downloadTextFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
