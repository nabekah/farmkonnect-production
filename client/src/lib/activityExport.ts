/**
 * Activity Export Reports Utility
 * Generates CSV, JSON, and HTML reports from activity data
 */

export interface Activity {
  id: string;
  logId: string;
  title: string;
  description?: string;
  activityType: string;
  status: string;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  photoUrls?: string[];
  createdAt: string;
  farmId: number;
  fieldId?: number;
  userId: number;
}

/**
 * Export activities to CSV format
 */
export function exportToCSV(activities: Activity[], filename = 'activities.csv'): void {
  const headers = [
    'Log ID',
    'Title',
    'Activity Type',
    'Status',
    'Description',
    'GPS Latitude',
    'GPS Longitude',
    'Photo Count',
    'Created At',
  ];

  const rows = activities.map((activity) => [
    activity.logId,
    activity.title,
    activity.activityType,
    activity.status,
    activity.description || '',
    activity.gpsLatitude || '',
    activity.gpsLongitude || '',
    activity.photoUrls?.length || 0,
    new Date(activity.createdAt).toLocaleString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma
          const cellStr = String(cell);
          return cellStr.includes(',') || cellStr.includes('"')
            ? `"${cellStr.replace(/"/g, '""')}"`
            : cellStr;
        })
        .join(',')
    ),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Export activities to JSON format
 */
export function exportToJSON(activities: Activity[], filename = 'activities.json'): void {
  const jsonContent = JSON.stringify(activities, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

/**
 * Export activities to HTML format for printing
 */
export function exportToHTML(activities: Activity[], filename = 'activities.html'): void {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Activity Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #3498db;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ecf0f1;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #ecf0f1;
    }
    .status-draft {
      background-color: #f39c12;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .status-submitted {
      background-color: #3498db;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .status-reviewed {
      background-color: #27ae60;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
      text-align: center;
      color: #7f8c8d;
      font-size: 12px;
    }
    @media print {
      body {
        margin: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <h1>Activity Report</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  <p>Total Activities: ${activities.length}</p>
  
  <table>
    <thead>
      <tr>
        <th>Log ID</th>
        <th>Title</th>
        <th>Activity Type</th>
        <th>Status</th>
        <th>Created At</th>
        <th>GPS Location</th>
        <th>Photos</th>
      </tr>
    </thead>
    <tbody>
      ${activities
        .map(
          (activity) => `
        <tr>
          <td>${activity.logId}</td>
          <td>${activity.title}</td>
          <td>${activity.activityType.replace(/_/g, ' ')}</td>
          <td><span class="status-${activity.status}">${activity.status}</span></td>
          <td>${new Date(activity.createdAt).toLocaleString()}</td>
          <td>${
            activity.gpsLatitude && activity.gpsLongitude
              ? `${activity.gpsLatitude.toFixed(4)}, ${activity.gpsLongitude.toFixed(4)}`
              : 'N/A'
          }</td>
          <td>${activity.photoUrls?.length || 0}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>This is an automatically generated report. For more details, please visit the application.</p>
  </div>
</body>
</html>
  `;

  downloadFile(htmlContent, filename, 'text/html');
}

/**
 * Generate a detailed activity report with statistics
 */
export function generateActivityReport(activities: Activity[]): string {
  const stats = {
    total: activities.length,
    byType: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    withGPS: 0,
    withPhotos: 0,
  };

  activities.forEach((activity) => {
    stats.byType[activity.activityType] = (stats.byType[activity.activityType] || 0) + 1;
    stats.byStatus[activity.status] = (stats.byStatus[activity.status] || 0) + 1;
    if (activity.gpsLatitude && activity.gpsLongitude) stats.withGPS++;
    if (activity.photoUrls?.length) stats.withPhotos++;
  });

  const report = `
ACTIVITY REPORT
===============
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Total Activities: ${stats.total}
Activities with GPS: ${stats.withGPS} (${((stats.withGPS / stats.total) * 100).toFixed(1)}%)
Activities with Photos: ${stats.withPhotos} (${((stats.withPhotos / stats.total) * 100).toFixed(1)}%)

BY ACTIVITY TYPE
----------------
${Object.entries(stats.byType)
  .map(([type, count]) => `${type.replace(/_/g, ' ')}: ${count}`)
  .join('\n')}

BY STATUS
---------
${Object.entries(stats.byStatus)
  .map(([status, count]) => `${status}: ${count}`)
  .join('\n')}
  `;

  return report;
}

/**
 * Helper function to download file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Print activities in browser
 */
export function printActivities(activities: Activity[]): void {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Activity Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background-color: #3498db; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ecf0f1; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Activity Report</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
        <th>Log ID</th>
        <th>Title</th>
        <th>Activity Type</th>
        <th>Status</th>
        <th>Created At</th>
      </tr>
    </thead>
    <tbody>
      ${activities
        .map(
          (a) => `
        <tr>
          <td>${a.logId}</td>
          <td>${a.title}</td>
          <td>${a.activityType}</td>
          <td>${a.status}</td>
          <td>${new Date(a.createdAt).toLocaleString()}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  const printWindow = window.open('', '', 'width=900,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }
}
