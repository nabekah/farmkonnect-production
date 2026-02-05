/**
 * Batch Photo Processing Service
 * Processes multiple photos using AI vision for auto-tagging and activity detection
 */

import { invokeLLM } from './_core/llm';

export interface BatchProcessingJob {
  jobId: string;
  photoIds: number[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalPhotos: number;
  processedPhotos: number;
  failedPhotos: number;
  results: ProcessingResult[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
}

export interface ProcessingResult {
  photoId: number;
  success: boolean;
  detectedActivity?: string;
  confidence: number;
  tags: string[];
  objects: DetectedObject[];
  text: string[];
  errorMessage?: string;
  processingTime: number;
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class BatchPhotoProcessingService {
  private static jobs: Map<string, BatchProcessingJob> = new Map();
  private static processingQueue: string[] = [];
  private static maxConcurrentJobs = 3;
  private static currentlyProcessing = 0;

  /**
   * Create a new batch processing job
   */
  static createJob(photoIds: number[]): BatchProcessingJob {
    const job: BatchProcessingJob = {
      jobId: `job-${Date.now()}-${Math.random()}`,
      photoIds,
      status: 'pending',
      progress: 0,
      totalPhotos: photoIds.length,
      processedPhotos: 0,
      failedPhotos: 0,
      results: [],
      createdAt: Date.now(),
    };

    this.jobs.set(job.jobId, job);
    this.processingQueue.push(job.jobId);

    // Start processing if capacity available
    this.processNextJob();

    return job;
  }

  /**
   * Process next job in queue
   */
  private static async processNextJob(): Promise<void> {
    if (this.currentlyProcessing >= this.maxConcurrentJobs || this.processingQueue.length === 0) {
      return;
    }

    const jobId = this.processingQueue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job) return;

    this.currentlyProcessing++;
    job.status = 'processing';
    job.startedAt = Date.now();

    try {
      await this.processJob(job);
      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    job.completedAt = Date.now();
    this.currentlyProcessing--;

    // Process next job
    this.processNextJob();
  }

  /**
   * Process a single job
   */
  private static async processJob(job: BatchProcessingJob): Promise<void> {
    for (let i = 0; i < job.photoIds.length; i++) {
      const photoId = job.photoIds[i];

      try {
        const result = await this.processPhoto(photoId);
        job.results.push(result);
        job.processedPhotos++;

        if (!result.success) {
          job.failedPhotos++;
        }
      } catch (error) {
        job.results.push({
          photoId,
          success: false,
          confidence: 0,
          tags: [],
          objects: [],
          text: [],
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          processingTime: 0,
        });
        job.failedPhotos++;
      }

      job.progress = Math.round((job.processedPhotos / job.totalPhotos) * 100);
    }
  }

  /**
   * Process a single photo with AI vision
   */
  private static async processPhoto(photoId: number): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Call LLM with vision capabilities to analyze photo
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are an expert agricultural image analyst. Analyze the provided farm photo and identify:
1. The primary agricultural activity being performed (planting, irrigation, harvesting, pest control, etc.)
2. Crops or plants visible
3. Equipment or tools being used
4. Any visible pests, diseases, or problems
5. Environmental conditions (weather, soil condition, etc.)
6. Any text visible in the image

Respond in JSON format with fields: activity, confidence (0-1), tags (array), objects (array with name and confidence), text (array).`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'photo_analysis',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                activity: {
                  type: 'string',
                  description: 'Primary agricultural activity detected',
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence score 0-1',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Auto-generated tags',
                },
                objects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      confidence: { type: 'number' },
                    },
                  },
                  description: 'Detected objects',
                },
                text: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Text visible in image',
                },
              },
              required: ['activity', 'confidence', 'tags', 'objects', 'text'],
            },
          },
        },
      });

      // Parse response
      const content = response.choices[0].message.content;
      const analysis = typeof content === 'string' ? JSON.parse(content) : content;

      const processingTime = Date.now() - startTime;

      return {
        photoId,
        success: true,
        detectedActivity: analysis.activity,
        confidence: analysis.confidence,
        tags: analysis.tags || [],
        objects: analysis.objects || [],
        text: analysis.text || [],
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      return {
        photoId,
        success: false,
        confidence: 0,
        tags: [],
        objects: [],
        text: [],
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      };
    }
  }

  /**
   * Get job status
   */
  static getJob(jobId: string): BatchProcessingJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs
   */
  static getAllJobs(): BatchProcessingJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get job results
   */
  static getJobResults(jobId: string): ProcessingResult[] {
    const job = this.jobs.get(jobId);
    return job ? job.results : [];
  }

  /**
   * Cancel job
   */
  static cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'failed';
    job.errorMessage = 'Cancelled by user';

    const index = this.processingQueue.indexOf(jobId);
    if (index !== -1) {
      this.processingQueue.splice(index, 1);
    }

    return true;
  }

  /**
   * Get processing statistics
   */
  static getStats(): {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
    queueLength: number;
    currentlyProcessing: number;
    averageProcessingTime: number;
  } {
    const jobs = Array.from(this.jobs.values());
    const completedJobs = jobs.filter((j) => j.status === 'completed');
    const totalProcessingTime = completedJobs.reduce(
      (sum, j) => sum + (j.completedAt && j.startedAt ? j.completedAt - j.startedAt : 0),
      0
    );

    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter((j) => j.status === 'pending').length,
      processingJobs: jobs.filter((j) => j.status === 'processing').length,
      completedJobs: completedJobs.length,
      failedJobs: jobs.filter((j) => j.status === 'failed').length,
      queueLength: this.processingQueue.length,
      currentlyProcessing: this.currentlyProcessing,
      averageProcessingTime:
        completedJobs.length > 0 ? Math.round(totalProcessingTime / completedJobs.length) : 0,
    };
  }

  /**
   * Export results as CSV
   */
  static exportResultsAsCSV(jobId: string): string {
    const job = this.jobs.get(jobId);
    if (!job) return '';

    const rows = [
      'PhotoID,Activity,Confidence,Tags,Objects,Text,ProcessingTime,Success',
    ];

    job.results.forEach((result) => {
      rows.push(
        `${result.photoId},"${result.detectedActivity || ''}",${result.confidence},"${result.tags.join('; ')}","${result.objects.map((o) => o.name).join('; ')}","${result.text.join('; ')}",${result.processingTime},${result.success}`
      );
    });

    return rows.join('\n');
  }

  /**
   * Clear old jobs (older than 24 hours)
   */
  static clearOldJobs(): number {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let cleared = 0;
    this.jobs.forEach((job, jobId) => {
      if (now - job.createdAt > oneDayMs) {
        this.jobs.delete(jobId);
        cleared++;
      }
    });

    return cleared;
  }
}


/**
 * tRPC Procedures for Batch Photo Processing
 */
export const batchPhotoProcessingProcedures = {
  /**
   * Create a batch processing job
   */
  createJob: (photoIds: number[]) => {
    return BatchPhotoProcessingService.createJob(photoIds);
  },

  /**
   * Get job status
   */
  getJob: (jobId: string) => {
    return BatchPhotoProcessingService.getJob(jobId);
  },

  /**
   * Get all jobs
   */
  getAllJobs: () => {
    return BatchPhotoProcessingService.getAllJobs();
  },

  /**
   * Get job results
   */
  getResults: (jobId: string) => {
    return BatchPhotoProcessingService.getJobResults(jobId);
  },

  /**
   * Cancel job
   */
  cancelJob: (jobId: string) => {
    return BatchPhotoProcessingService.cancelJob(jobId);
  },

  /**
   * Get statistics
   */
  getStats: () => {
    return BatchPhotoProcessingService.getStats();
  },

  /**
   * Export results
   */
  exportResults: (jobId: string) => {
    return BatchPhotoProcessingService.exportResultsAsCSV(jobId);
  },
};
