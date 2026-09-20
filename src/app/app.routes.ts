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
    data: { description: 'Look up any Old School RuneScape player: hiscores levels, boss kill counts, quests, achievements, and clan stats.' },
  },
  {
    path: 'calculator',
    loadComponent: () => import('./pages/calculator/calculator').then((m) => m.Calculator),
    title: 'XP Calculator — RuneTools',
    data: { description: 'OSRS XP calculator: compare training methods by XP/hour and see how long each takes to reach your goal level.' },
  },
  {
    path: 'activity-feed',
    loadComponent: () => import('./pages/activity-feed/activity-feed').then((m) => m.ActivityFeedPage),
    title: 'Activity Feed — RuneTools',
    data: { description: "See an OSRS player's recent level ups, item drops, quest completions, and more." },
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
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
    title: 'Page not found — RuneTools',
  },
];
