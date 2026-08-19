import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'OSRS Stat Lookup',
  },
  {
    path: 'players/:username',
    loadComponent: () => import('./pages/player/player').then((m) => m.PlayerPage),
    title: 'OSRS Stat Lookup',
  },
  {
    path: 'clans/:clanId',
    loadComponent: () => import('./pages/clan/clan').then((m) => m.ClanPage),
    title: 'OSRS Stat Lookup',
  },
  { path: '**', redirectTo: '' },
];
