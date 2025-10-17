import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserRole } from './models/user-role.model';
import { BusinessUnit } from './models/business-unit.model';
import { MenuTask } from './models/menu.model';
@Injectable({
  providedIn: 'root',
})
export class MenuBarService {
  // Using Angular 19 signals for reactive state management
  private selectedRoleSignal = signal<UserRole | null>(null);
  private selectedBusinessUnitSignal = signal<BusinessUnit | null>(null);
  private menuTasksSignal = signal<MenuTask[]>([]);
  private isCollapsedSignal = signal<boolean>(false);

  // Legacy observable support for backward compatibility
  private selectedRoleSubject = new BehaviorSubject<UserRole | null>(null);
  private selectedBusinessUnitSubject =
    new BehaviorSubject<BusinessUnit | null>(null);

  // Public signal accessors
  readonly selectedRole = this.selectedRoleSignal.asReadonly();
  readonly selectedBusinessUnit = this.selectedBusinessUnitSignal.asReadonly();
  readonly menuTasks = this.menuTasksSignal.asReadonly();
  readonly isCollapsed = this.isCollapsedSignal.asReadonly();

  // Public observable accessors
  readonly selectedRole$ = this.selectedRoleSubject.asObservable();
  readonly selectedBusinessUnit$ =
    this.selectedBusinessUnitSubject.asObservable();

  constructor() {}

  // Role management
  setSelectedRole(role: UserRole | null): void {
    this.selectedRoleSignal.set(role);
    this.selectedRoleSubject.next(role);
  }

  // Business Unit management
  setSelectedBusinessUnit(businessUnit: BusinessUnit | null): void {
    this.selectedBusinessUnitSignal.set(businessUnit);
    this.selectedBusinessUnitSubject.next(businessUnit);
  }

  // Menu tasks management
  setMenuTasks(tasks: MenuTask[]): void {
    this.menuTasksSignal.set(tasks);
  }

  addMenuTask(task: MenuTask): void {
    this.menuTasksSignal.update((tasks) => [...tasks, task]);
  }

  removeMenuTask(taskCode: string): void {
    this.menuTasksSignal.update((tasks) =>
      tasks.filter((task) => task.taskCode !== taskCode)
    );
  }

  // Collapse/expand functionality
  toggleCollapse(): void {
    this.isCollapsedSignal.update((collapsed) => !collapsed);
  }

  setCollapsed(collapsed: boolean): void {
    this.isCollapsedSignal.set(collapsed);
  }

  // Search functionality
  searchTasks(searchTerm: string): MenuTask[] {
    if (!searchTerm.trim()) {
      return this.menuTasksSignal();
    }

    return this.menuTasksSignal().filter(
      (task) =>
        task.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.taskCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
