import React, { useState, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, CheckCircle2, FileUp, Loader2, Download } from 'lucide-react';
import { useLocation } from 'wouter';

interface TaskRow {
  title: string;
  description: string;
  taskType: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignedToName: string;
  fieldId?: string;
  status: 'pending' | 'valid' | 'error';
  error?: string;
}

const TASK_TYPES = [
  'planting',
  'monitoring',
  'irrigation',
  'fertilization',
  'pest_control',
  'weed_control',
  'harvest',
  'equipment_maintenance',
  'soil_testing',
  'other',
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function BatchTaskImport() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [farmId, setFarmId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user?.id) {
      setFarmId(1); // Placeholder
    }
  }, [user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      const validatedTasks = validateTasks(rows);
      setTasks(validatedTasks);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please ensure it is a valid CSV.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      return row;
    });
  };

  const validateTasks = (rows: any[]): TaskRow[] => {
    return rows.map((row) => {
      const errors: string[] = [];

      // Validate required fields
      if (!row.title) errors.push('Title is required');
      if (!row.tasktype) errors.push('Task type is required');
      if (!row.priority) errors.push('Priority is required');
      if (!row.duedate) errors.push('Due date is required');
      if (!row.assignedtoname) errors.push('Assigned to name is required');

      // Validate task type
      if (row.tasktype && !TASK_TYPES.includes(row.tasktype.toLowerCase())) {
        errors.push(`Invalid task type: ${row.tasktype}`);
      }

      // Validate priority
      if (row.priority && !PRIORITIES.includes(row.priority.toLowerCase())) {
        errors.push(`Invalid priority: ${row.priority}`);
      }

      // Validate date format
      if (row.duedate && !isValidDate(row.duedate)) {
        errors.push(`Invalid date format: ${row.duedate} (use YYYY-MM-DD)`);
      }

      return {
        title: row.title || '',
        description: row.description || '',
        taskType: row.tasktype?.toLowerCase() || '',
        priority: row.priority?.toLowerCase() || '',
        dueDate: row.duedate || '',
        dueTime: row.duetime || '09:00',
        assignedToName: row.assignedtoname || '',
        fieldId: row.fieldid,
        status: errors.length > 0 ? 'error' : 'valid',
        error: errors.length > 0 ? errors.join('; ') : undefined,
      };
    });
  };

  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleImport = async () => {
    const validTasks = tasks.filter((t) => t.status === 'valid');

    if (validTasks.length === 0) {
      alert('No valid tasks to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate importing tasks
      for (let i = 0; i < validTasks.length; i++) {
        // TODO: Call tRPC mutation to create task
        await new Promise((resolve) => setTimeout(resolve, 500));
        setImportProgress(Math.round(((i + 1) / validTasks.length) * 100));
      }

      setImportSuccess(true);
      setTimeout(() => {
        navigate('/manager/tasks');
      }, 2000);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import tasks. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Title',
      'Description',
      'TaskType',
      'Priority',
      'DueDate',
      'DueTime',
      'AssignedToName',
      'FieldId',
    ];
    const csv = headers.join(',') + '\n';

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'task-import-template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (importSuccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Import Successful!</h2>
            <p className="text-muted-foreground">
              {tasks.filter((t) => t.status === 'valid').length} tasks have been imported.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Redirecting to task management...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Batch Task Import</h1>
          <p className="text-muted-foreground">Import multiple tasks from CSV file</p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Download the template, fill it with your tasks, and upload it here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <FileUp className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {file && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing file...
              </div>
            )}
          </CardContent>
        </Card>

        {/* CSV Format Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>CSV Format Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-foreground">Required Columns:</p>
                <ul className="list-disc list-inside text-muted-foreground mt-2">
                  <li>
                    <strong>Title</strong> - Task name (required)
                  </li>
                  <li>
                    <strong>TaskType</strong> - One of: planting, monitoring, irrigation,
                    fertilization, pest_control, weed_control, harvest, equipment_maintenance,
                    soil_testing, other
                  </li>
                  <li>
                    <strong>Priority</strong> - One of: low, medium, high, urgent
                  </li>
                  <li>
                    <strong>DueDate</strong> - Format: YYYY-MM-DD (e.g., 2026-02-15)
                  </li>
                  <li>
                    <strong>AssignedToName</strong> - Worker name
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground">Optional Columns:</p>
                <ul className="list-disc list-inside text-muted-foreground mt-2">
                  <li>
                    <strong>Description</strong> - Task details
                  </li>
                  <li>
                    <strong>DueTime</strong> - Format: HH:MM (default: 09:00)
                  </li>
                  <li>
                    <strong>FieldId</strong> - Field identifier
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Preview */}
        {tasks.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Task Preview ({tasks.length} tasks)</CardTitle>
              <CardDescription>
                {tasks.filter((t) => t.status === 'valid').length} valid,{' '}
                {tasks.filter((t) => t.status === 'error').length} errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      task.status === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-foreground">{task.title}</p>
                          <Badge
                            className={
                              task.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-green-500'
                            }
                          >
                            {task.status === 'error' ? 'Error' : 'Valid'}
                          </Badge>
                        </div>

                        {task.status === 'error' && task.error && (
                          <div className="flex gap-2 items-start mb-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{task.error}</p>
                          </div>
                        )}

                        {task.status === 'valid' && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Type</p>
                              <p className="font-medium text-foreground">{task.taskType}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Priority</p>
                              <p className="font-medium text-foreground">{task.priority}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Due</p>
                              <p className="font-medium text-foreground">{task.dueDate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Assigned To</p>
                              <p className="font-medium text-foreground">{task.assignedToName}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Button */}
        {tasks.length > 0 && (
          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={
                isImporting || tasks.filter((t) => t.status === 'valid').length === 0
              }
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${tasks.filter((t) => t.status === 'valid').length} Tasks`
              )}
            </Button>

            {isImporting && (
              <div className="flex-1">
                <Progress value={importProgress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{importProgress}%</p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setTasks([]);
                setFile(null);
              }}
              disabled={isImporting}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
