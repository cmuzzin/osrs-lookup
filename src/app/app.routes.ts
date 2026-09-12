import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'RuneTools',
  },
  {
    path: 'lookup',
    loadComponent: () => import('./pages/lookup/lookup').then((m) => m.Lookup),
    title: 'Stat Lookup — RuneTools',
  },
  {
    path: 'calculator',
    loadComponent: () => import('./pages/calculator/calculator').then((m) => m.Calculator),
    title: 'XP Calculator — RuneTools',
  },
  {
    path: 'players/:username',
    loadComponent: () => import('./pages/player/player').then((m) => m.PlayerPage),
    title: 'RuneTools',
  },
  {
    path: 'clans/:clanId',
    loadComponent: () => import('./pages/clan/clan').then((m) => m.ClanPage),
    title: 'RuneTools',
  },
  { path: '**', redirectTo: '' },
];
