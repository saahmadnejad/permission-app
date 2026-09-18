/**
 * Interactive permission playground — single-page sample.
 *
 * Demonstrates on one screen:
 *  1. Mode switcher (full / partial / none) + per-permission checkboxes.
 *  2. Live nav visibility (parent shown iff any child visible).
 *  3. Row-level table actions with contextual queries + disable-vs-hide.
 *  4. Composite queries (all / any / not) evaluated live.
 *  5. Guard simulator: same can() the router guard uses, shown as allow/deny table.
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  canActivateRoute,
  isNodeVisible,
  permissionRegistry,
  type PermissionNodeDef,
  type Query,
} from 'permission-visibility-core';
import { registerDemoNodes } from 'permission-visibility-demo-data';
import { PermissionService } from 'permission-visibility-angular';
import { ALL_PERMISSIONS, PARTIAL_PERMISSIONS } from 'permission-visibility-demo-data';
import { ShowIfDirective } from 'permission-visibility-angular';
import { NavbarComponent } from './navbar.component';
import { SubNavbarComponent } from './sub-navbar.component';
import { DropdownComponent } from './dropdown.component';
import { TableComponent } from './table.component';
import { ActionButtonComponent } from './action-button.component';
import { ModalOpenerButtonComponent } from './modal-opener-button.component';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ShowIfDirective,
    NavbarComponent,
    SubNavbarComponent,
    DropdownComponent,
    TableComponent,
    ActionButtonComponent,
    ModalOpenerButtonComponent,
    ModalComponent,
  ],
  template: `
    <header class="pg-head">
      <h1>Permission playground</h1>
      <p>
        Parent shown <strong>iff</strong> itself allowed <strong>and</strong> at least one child visible.
        Toggle permissions on the left — every section below re-evaluates live.
      </p>
      <nav class="pg-links">
        <a routerLink="/users">/users (guard: VIEW_USERS_TABLE)</a>
        <a routerLink="/settings">/settings (guard: ADMIN_PANEL + VIEW_SETTINGS)</a>
        <a routerLink="/denied">/denied</a>
      </nav>
    </header>

    <div class="pg-layout">
      <!-- Control panel -->
      <aside class="pg-panel">
        <h2>Permissions</h2>
        <div class="pg-modes">
          <button (click)="setMode('full')" [class.active]="mode() === 'full'">Full</button>
          <button (click)="setMode('partial')" [class.active]="mode() === 'partial'">Partial</button>
          <button (click)="setMode('none')" [class.active]="mode() === 'none'">None</button>
        </div>
        @for (p of allPerms; track p) {
          <label class="pg-check">
            <input type="checkbox" [checked]="granted().has(p)" (change)="toggle(p)" />
            <code>{{ p }}</code>
          </label>
        }
        <p class="pg-hint">Store status: <strong>{{ perms.status }}</strong> (fail-closed on loading/error)</p>
      </aside>

      <!-- Live demo -->
      <main class="pg-main">
        <section class="pg-card">
          <h2>1 · Navigation hierarchy</h2>
          <p>Layout container (<code>query: null</code>) shows when any child passes. Try unchecking both VIEW_HOME + VIEW_PROFILE.</p>
          <app-navbar [node]="mainNavNode"></app-navbar>
          <p>Owned container (<code>ADMIN_PANEL</code>) needs own check <em>and</em> a visible child. Uncheck ADMIN_PANEL only.</p>
          <app-sub-navbar [node]="subNavNode"></app-sub-navbar>
        </section>

        <section class="pg-card">
          <h2>2 · Row-level table (disable vs hide)</h2>
          <p>Container needs <code>VIEW_USERS_TABLE</code>. Edit/Delete are <code>denied: 'disable'</code> — they stay visible but disabled when denied.</p>
          <app-table [node]="tableNode"></app-table>
        </section>

        <section class="pg-card">
          <h2>3 · Dropdown + modal + standalone buttons</h2>
          <app-dropdown [node]="dropdownNode"></app-dropdown>
          <div class="pg-row">
            <app-action-button [query]="'EDIT_USER'" [label]="'Standalone Edit'"></app-action-button>
            <app-action-button [query]="'DELETE_USER'" [label]="'Standalone Delete'"></app-action-button>
            <app-modal-opener-button [node]="modalNode" (open)="showModal = true"></app-modal-opener-button>
          </div>
          @if (showModal) {
            <app-modal [node]="modalNode" (close)="showModal = false"></app-modal>
          }
        </section>

        <section class="pg-card">
          <h2>4 · Composite queries (live)</h2>
          <ul>
            @for (row of compositeRows(); track row.label) {
              <li><code>{{ row.label }}</code> → <strong>{{ row.ok ? 'ALLOW' : 'DENY' }}</strong></li>
            }
          </ul>
          <div class="pg-locked" *appShowIf="exportQuery; denied: 'show-locked'; let locked = locked">
            @if (locked) { <span>🔒 Export is locked — grant <code>EXPORT</code> to unlock.</span> }
            @else { <span>✅ Export unlocked.</span> }
          </div>
        </section>

        <section class="pg-card">
          <h2>5 · Guard simulator (same can() as the router)</h2>
          <p>Uncheck <code>VIEW_USERS_TABLE</code>, then click <a routerLink="/users">/users</a> — the guard redirects to <code>/denied</code>.</p>
          <table class="pg-table">
            <thead><tr><th>Route</th><th>Query</th><th>Decision</th></tr></thead>
            <tbody>
              @for (g of guardRows(); track g.route) {
                <tr>
                  <td><code>{{ g.route }}</code></td>
                  <td><code>{{ g.queryLabel }}</code></td>
                  <td><strong>{{ g.ok ? 'ALLOW' : 'DENY → /denied' }}</strong></td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .pg-head { margin-bottom: 16px; }
    .pg-links { display: flex; gap: 16px; }
    .pg-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; }
    .pg-panel { border: 1px solid #ddd; padding: 12px; border-radius: 8px; height: fit-content; position: sticky; top: 12px; }
    .pg-modes { display: flex; gap: 8px; margin-bottom: 12px; }
    .pg-modes button.active { font-weight: bold; outline: 2px solid #333; }
    .pg-check { display: flex; gap: 8px; align-items: center; margin: 4px 0; }
    .pg-hint { color: #666; font-size: 12px; }
    .pg-main { display: flex; flex-direction: column; gap: 16px; }
    .pg-card { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
    .pg-row { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .pg-table { border-collapse: collapse; width: 100%; }
    .pg-table th, .pg-table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    .pg-locked { margin-top: 8px; padding: 8px; background: #fafafa; border: 1px dashed #bbb; }
  `],
})
export class PlaygroundComponent implements OnInit {
  readonly perms = inject(PermissionService);
  readonly allPerms = [...ALL_PERMISSIONS];
  readonly granted = signal<Set<string>>(new Set(this.allPerms));
  readonly mode = signal<'full' | 'partial' | 'none'>('full');
  showModal = false;

  mainNavNode!: PermissionNodeDef;
  subNavNode!: PermissionNodeDef;
  tableNode!: PermissionNodeDef;
  dropdownNode!: PermissionNodeDef;
  modalNode!: PermissionNodeDef;

  readonly exportQuery: Query = { perm: 'EXPORT' };

  private readonly compositeQueries: Array<{ label: string; q: Query }> = [
    { label: "EDIT_USER", q: 'EDIT_USER' },
    { label: "all [VIEW_USERS_TABLE, EDIT_USER]", q: { all: ['VIEW_USERS_TABLE', 'EDIT_USER'] } },
    { label: "any [DELETE_USER, EDIT_USER]", q: { any: ['DELETE_USER', 'EDIT_USER'] } },
    { label: "not DELETE_USER", q: { not: 'DELETE_USER' } },
    { label: "EDIT_USER{owner: john}", q: { perm: 'EDIT_USER', context: { owner: 'john' } } },
  ];

  readonly compositeRows = computed(() =>
    this.compositeQueries.map((c) => ({ label: c.label, ok: this.perms.can(c.q) })),
  );

  readonly guardRows = computed(() => {
    const can = this.perms.canFn();
    const users: Query = 'VIEW_USERS_TABLE';
    const settings: Query = { all: ['ADMIN_PANEL', 'VIEW_SETTINGS'] };
    return [
      { route: '/users', queryLabel: 'VIEW_USERS_TABLE', ok: canActivateRoute(users, can) },
      { route: '/settings', queryLabel: "all [ADMIN_PANEL, VIEW_SETTINGS]", ok: canActivateRoute(settings, can) },
    ];
  });

  /** Live proof that a pure-core check agrees with what *appShowIf renders. */
  readonly navVisible = computed(() =>
    isNodeVisible(this.mainNavNode, this.perms.canFn()),
  );

  ngOnInit(): void {
    registerDemoNodes();
    this.mainNavNode = permissionRegistry.get('main-nav');
    this.subNavNode = permissionRegistry.get('sub-nav');
    this.tableNode = permissionRegistry.get('users-table');
    this.dropdownNode = permissionRegistry.get('options-dropdown');
    this.modalNode = permissionRegistry.get('confirm-modal');
    this.syncFromStore();
  }

  setMode(mode: 'full' | 'partial' | 'none'): void {
    this.mode.set(mode);
    this.perms.setPermissions(mode === 'full' ? ALL_PERMISSIONS : mode === 'partial' ? PARTIAL_PERMISSIONS : []);
    this.syncFromStore();
  }

  toggle(perm: string): void {
    const next = new Set(this.granted());
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    this.granted.set(next);
    this.mode.set('custom' as never);
    this.perms.setPermissions(next);
  }

  private syncFromStore(): void {
    // Reconstruct the checkbox set from the known permission universe + live can().
    // (Store holds a Set internally; can() per perm is the public read path.)
    const next = new Set<string>();
    for (const p of this.allPerms) if (this.perms.can(p)) next.add(p);
    this.granted.set(next);
  }
}
