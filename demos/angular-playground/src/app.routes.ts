import type { Routes } from '@angular/router';
import { permGuard } from 'permission-visibility-angular';
import { PlaygroundComponent } from './playground.component';
import {
  DeniedPageComponent,
  SettingsPageComponent,
  UsersPageComponent,
} from './demo-pages.component';

export const appRoutes: Routes = [
  { path: '', component: PlaygroundComponent },
  {
    path: 'users',
    component: UsersPageComponent,
    canActivate: [permGuard],
    data: { perm: 'VIEW_USERS_TABLE', deniedRedirect: '/denied' },
  },
  {
    path: 'settings',
    component: SettingsPageComponent,
    canActivate: [permGuard],
    data: { perm: { all: ['ADMIN_PANEL', 'VIEW_SETTINGS'] }, deniedRedirect: '/denied' },
  },
  { path: 'denied', component: DeniedPageComponent },
];
