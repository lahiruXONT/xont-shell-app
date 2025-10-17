import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  getUserRoles(): Promise<any[]> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { roleCode: 'ADMIN', roleName: 'Administrator' },
          { roleCode: 'USER', roleName: 'Standard User' },
          { roleCode: 'MANAGER', roleName: 'Manager' },
        ]);
      }, 500);
    });
  }

  getBusinessUnits(): Promise<any[]> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { businessUnitCode: 'MAIN', businessUnitName: 'Main Office' },
          { businessUnitCode: 'SALES', businessUnitName: 'Sales Department' },
          { businessUnitCode: 'SUPPORT', businessUnitName: 'Support Team' },
        ]);
      }, 500);
    });
  }

  getMenuStructure(): Promise<any[]> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            groupName: 'Dashboard',
            groupIcon: 'dashboard',
            items: [
              { name: 'Overview', route: '/dashboard', icon: 'home' },
              {
                name: 'Analytics',
                route: '/dashboard/analytics',
                icon: 'analytics',
              },
            ],
          },
          {
            groupName: 'Customers',
            groupIcon: 'people',
            items: [
              { name: 'Customer List', route: '/customer/list', icon: 'list' },
              { name: 'New Customer', route: '/customer/new', icon: 'add' },
              {
                name: 'Customer Search',
                route: '/customer/search',
                icon: 'search',
              },
            ],
          },
          {
            groupName: 'Reports',
            groupIcon: 'assessment',
            items: [
              {
                name: 'Sales Reports',
                route: '/reports/sales',
                icon: 'bar_chart',
              },
              {
                name: 'Activity Reports',
                route: '/reports/activity',
                icon: 'timeline',
              },
              {
                name: 'Custom Reports',
                route: '/reports/custom',
                icon: 'build',
              },
            ],
          },
        ]);
      }, 500);
    });
  }

  getMenuStructureForRole(roleCode: string): Promise<any[]> {
    // Simulate API call based on role
    return this.getMenuStructure();
  }
}
