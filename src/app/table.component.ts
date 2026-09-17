/**
 * Table: container gated on VIEW_USERS_TABLE; per-row actions use contextual queries (Q9).
 * No `find(n => permission === ...)` lookups — queries come from the registry/single source.
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { PermissionNodeDef, Query } from '../core';
import { ShowIfDirective } from './show-if.directive';
import { ActionButtonComponent } from './action-button.component';

export interface UserRow {
  name: string;
  email: string;
  ownerId?: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, ShowIfDirective, ActionButtonComponent],
  template: `
    <ng-container *appShowIf="node">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (user of users; track user.email) {
            <tr>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <app-action-button
                  [query]="editQuery"
                  [context]="user"
                  [label]="'Edit'"
                  (action)="editUser(user)"
                ></app-action-button>
                <app-action-button
                  [query]="deleteQuery"
                  [context]="user"
                  [label]="'Delete'"
                  (action)="deleteUser(user)"
                ></app-action-button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </ng-container>
  `,
  styles: ['table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; }'],
})
export class TableComponent {
  @Input({ required: true }) node!: PermissionNodeDef;

  users: UserRow[] = [
    { name: 'John Doe', email: 'john@example.com', ownerId: 'john' },
    { name: 'Jane Smith', email: 'jane@example.com', ownerId: 'jane' },
  ];

  /** Row-level: factory queries receive the row as context (Q9). */
  editQuery = (row: unknown): Query => ({
    perm: 'EDIT_USER',
    context: { owner: (row as UserRow)?.ownerId },
  });
  deleteQuery: Query = 'DELETE_USER';

  editUser(user: UserRow): void {
    // eslint-disable-next-line no-console
    console.log('Editing user:', user);
  }

  deleteUser(user: UserRow): void {
    // eslint-disable-next-line no-console
    console.log('Deleting user:', user);
  }
}
