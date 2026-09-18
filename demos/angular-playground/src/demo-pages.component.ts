/**
 * Tiny routed pages for the guard demo (Q3/Q8).
 * Each route's `data.perm` is enforced by `permGuard` — same core `can()` as the UI.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { permissionRegistry, type PermissionNodeDef } from 'permission-visibility-core';
import { registerDemoNodes } from 'permission-visibility-demo-data';
import { ShowIfDirective } from 'permission-visibility-angular';
import { TableComponent } from './table.component';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, TableComponent],
  template: `
    <h2>Users page</h2>
    <p>Guard: <code>VIEW_USERS_TABLE</code> — toggle it off and revisit <code>/users</code> to land on <code>/denied</code>.</p>
    <app-table [node]="tableNode"></app-table>
  `,
})
export class UsersPageComponent implements OnInit {
  tableNode!: PermissionNodeDef;
  ngOnInit(): void {
    registerDemoNodes(); // idempotent
    this.tableNode = permissionRegistry.get('users-table');
  }
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ShowIfDirective],
  template: `
    <h2>Settings page</h2>
    <p>Guard: <code>all ADMIN_PANEL + VIEW_SETTINGS</code></p>
    <section *appShowIf="'VIEW_SETTINGS'">
      <label>Site name <input value="Demo site" /></label>
    </section>
    <p *appShowIf="'DELETE_USER'">Danger zone (needs DELETE_USER).</p>
  `,
})
export class SettingsPageComponent {}

@Component({
  selector: 'app-denied-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2>Access denied</h2>
    <p>The guard blocked this route. Turn the permission back on and retry.</p>
    <a routerLink="/">Back to playground</a>
  `,
})
export class DeniedPageComponent {}
