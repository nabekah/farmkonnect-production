import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  items: InvoiceItem[];
  totalAmount: number;
  dueDate: Date;
  notes?: string;
  farmName?: string;
  createdAt?: Date;
}

export const generateInvoicePDF = (invoice: InvoiceData) => {
  const docDefinition: any = {
    content: [
      // Header
      {
        columns: [
          {
            text: "INVOICE",
            fontSize: 24,
            bold: true,
            color: "#2c3e50"
          },
          {
            text: [
              { text: "Invoice #: ", bold: true },
              invoice.invoiceNumber,
              "\n",
              { text: "Date: ", bold: true },
              new Date(invoice.createdAt || new Date()).toLocaleDateString(),
              "\n",
              { text: "Due Date: ", bold: true },
              new Date(invoice.dueDate).toLocaleDateString()
            ],
            alignment: "right",
            fontSize: 11
          }
        ],
        marginBottom: 20
      },

      // Divider
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 1,
            lineColor: "#cccccc"
          }
        ],
        marginBottom: 20
      },

      // From and Bill To
      {
        columns: [
          {
            text: [
              { text: "FROM:\n", bold: true, fontSize: 12 },
              { text: invoice.farmName || "Farm", fontSize: 11 },
              "\n\n",
              { text: "Ghana", fontSize: 10, color: "#666666" }
            ],
            width: "50%"
          },
          {
            text: [
              { text: "BILL TO:\n", bold: true, fontSize: 12 },
              { text: invoice.clientName, fontSize: 11 }
            ],
            width: "50%"
          }
        ],
        marginBottom: 30
      },

      // Items Table
      {
        table: {
          headerRows: 1,
          widths: ["*", 80, 100, 100],
          body: [
            // Header row
            [
              { text: "Description", bold: true, color: "white", fillColor: "#2c3e50", alignment: "left" },
              { text: "Qty", bold: true, color: "white", fillColor: "#2c3e50", alignment: "center" },
              { text: "Unit Price", bold: true, color: "white", fillColor: "#2c3e50", alignment: "right" },
              { text: "Amount", bold: true, color: "white", fillColor: "#2c3e50", alignment: "right" }
            ],
            // Item rows
            ...invoice.items.map((item) => [
              { text: item.description, alignment: "left" },
              { text: item.quantity.toString(), alignment: "center" },
              { text: `GHS ${item.unitPrice.toFixed(2)}`, alignment: "right" },
              { text: `GHS ${item.amount.toFixed(2)}`, alignment: "right", bold: true }
            ]),
            // Subtotal row
            [
              { text: "", colSpan: 2 },
              {},
              { text: "Subtotal:", alignment: "right", bold: true },
              { text: `GHS ${invoice.totalAmount.toFixed(2)}`, alignment: "right" }
            ],
            // Total row
            [
              { text: "", colSpan: 2 },
              {},
              { text: "TOTAL:", alignment: "right", bold: true, fontSize: 12, fillColor: "#ecf0f1" },
              { text: `GHS ${invoice.totalAmount.toFixed(2)}`, alignment: "right", bold: true, fontSize: 12, fillColor: "#ecf0f1" }
            ]
          ]
        },
        marginBottom: 30
      },

      // Notes
      ...(invoice.notes
        ? [
            {
              text: [
                { text: "Notes:\n", bold: true },
                invoice.notes
              ],
              marginBottom: 20,
              fontSize: 10,
              color: "#666666"
            }
          ]
        : []),

      // Footer
      {
        text: "Thank you for your business!",
        alignment: "center",
        fontSize: 10,
        color: "#999999",
        marginTop: 30
      },
      {
        text: `Generated on ${new Date().toLocaleString()}`,
        alignment: "center",
        fontSize: 8,
        color: "#cccccc"
      }
    ],
    styles: {
      header: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 10]
      }
    },
    defaultStyle: {
      font: "Helvetica"
    }
  };

  // Generate and download PDF
  pdfMake.createPdf(docDefinition).download(`invoice-${invoice.invoiceNumber}.pdf`);
};

export const generateTaxReportPDF = (data: {
  taxYear: number;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  farmName?: string;
}) => {
  const docDefinition: any = {
    content: [
      // Header
      {
        text: "TAX REPORT",
        fontSize: 24,
        bold: true,
        color: "#2c3e50",
        alignment: "center",
        marginBottom: 10
      },
      {
        text: `Tax Year: ${data.taxYear}`,
        fontSize: 14,
        alignment: "center",
        marginBottom: 30,
        color: "#666666"
      },

      // Farm Info
      {
        text: [
          { text: "Farm Name: ", bold: true },
          data.farmName || "N/A"
        ],
        marginBottom: 10,
        fontSize: 11
      },
      {
        text: [
          { text: "Report Generated: ", bold: true },
          new Date().toLocaleString()
        ],
        marginBottom: 30,
        fontSize: 11
      },

      // Divider
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 1,
            lineColor: "#cccccc"
          }
        ],
        marginBottom: 20
      },

      // Summary Table
      {
        table: {
          widths: ["*", 150],
          body: [
            [
              { text: "Total Income", bold: true, fontSize: 12 },
              { text: `GHS ${data.totalIncome.toFixed(2)}`, alignment: "right", fontSize: 12 }
            ],
            [
              { text: "Total Deductible Expenses", bold: true },
              { text: `GHS ${data.totalExpenses.toFixed(2)}`, alignment: "right" }
            ],
            [
              { text: "Taxable Income", bold: true, fillColor: "#ecf0f1" },
              { text: `GHS ${data.taxableIncome.toFixed(2)}`, alignment: "right", fillColor: "#ecf0f1", bold: true }
            ],
            [
              { text: "Tax Rate", bold: true },
              { text: "15%", alignment: "right" }
            ],
            [
              { text: "Estimated Tax Liability", bold: true, fontSize: 12, fillColor: "#fff3cd" },
              { text: `GHS ${data.estimatedTax.toFixed(2)}`, alignment: "right", fontSize: 12, bold: true, fillColor: "#fff3cd", color: "#856404" }
            ]
          ]
        },
        marginBottom: 30
      },

      // Disclaimer
      {
        text: "IMPORTANT NOTICE",
        bold: true,
        fontSize: 12,
        marginBottom: 10,
        color: "#d32f2f"
      },
      {
        text: "This tax report is generated for informational purposes only. Please consult with a qualified tax professional or accountant to ensure compliance with Ghana's Internal Revenue Authority (IRA) regulations. This report does not constitute professional tax advice.",
        fontSize: 10,
        color: "#666666",
        alignment: "justify",
        marginBottom: 20
      },

      // Ghana Tax Information
      {
        text: "Ghana Tax Information",
        bold: true,
        fontSize: 11,
        marginBottom: 10
      },
      {
        text: [
          { text: "Tax Year: ", bold: true },
          `${data.taxYear}\n`,
          { text: "Filing Deadline: ", bold: true },
          "March 31 (following tax year)\n",
          { text: "Tax Authority: ", bold: true },
          "Internal Revenue Authority (IRA)\n",
          { text: "Standard Tax Rate: ", bold: true },
          "15% for agricultural income"
        ],
        fontSize: 10,
        color: "#666666"
      }
    ],
    styles: {
      header: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 10]
      }
    },
    defaultStyle: {
      font: "Helvetica"
    }
  };

  // Generate and download PDF
  pdfMake.createPdf(docDefinition).download(`tax-report-${data.taxYear}.pdf`);
};
