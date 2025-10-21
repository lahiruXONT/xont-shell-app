import { Injectable } from '@angular/core';
import { ActiveUserTask, TaskLogOptions } from '../models/active-task.model';

/**
 * Active Task Service
 * Logs active user task info (adds, closes, tracks)
 * Legacy: AddTaskDetails, LogActiveTaskInfo
 */
@Injectable({
  providedIn: 'root',
})
export class ActiveTaskService {
  private readonly DEFAULT_LOG_OPTIONS: TaskLogOptions = {
    enableLogging: true,
    logToServer: true,
    logToConsole: false,
    logLevel: 'info',
  };

  private options: TaskLogOptions = this.DEFAULT_LOG_OPTIONS;

  /**
   * Log that user has opened a task
   */
  logOpen(task: ActiveUserTask): void {
    if (this.options.logToConsole) {
      console.log('[Task Opened]', task);
    }
    if (this.options.logToServer) {
      // TODO: Implement API call
      // this.apiService.post(`${environment.apiUrl}/api/tasks/active`, task)
    }
  }

  /**
   * Log that user has closed a task
   */
  logClose(task: ActiveUserTask): void {
    if (this.options.logToConsole) {
      console.log('[Task Closed]', task);
    }
    if (this.options.logToServer) {
      // TODO: Implement API call
      // this.apiService.post(`${environment.apiUrl}/api/tasks/active/close`, task)
    }
  }

  setLogOptions(options: Partial<TaskLogOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
