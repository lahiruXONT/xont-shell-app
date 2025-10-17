import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard</h1>
      <p>Welcome to the Ventura CRM Dashboard!</p>
      <div class="dashboard-content">
        <div class="dashboard-item">
          <h3>Recent Activity</h3>
          <p>Track your recent customer interactions</p>
        </div>
        <div class="dashboard-item">
          <h3>Upcoming Tasks</h3>
          <p>Manage your pending tasks and deadlines</p>
        </div>
        <div class="dashboard-item">
          <h3>Performance Metrics</h3>
          <p>View your performance and sales metrics</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 20px;
      }

      .dashboard-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      .dashboard-item {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class DashboardComponent {}
