import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WomApi } from '../../../core/wom-api';
import { GainsPeriod, PlayerGains } from '../../../core/wom.models';
import { SKILL_ORDER, formatSignedNumber, skillMeta } from '../../../core/format.util';

interface GainRow {
  key: string;
  label: string;
  icon: string;
  xpGained: number;
  levelsGained: number;
}

const PERIODS: { value: GainsPeriod; label: string }[] = [
  { value: 'day', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
];

@Component({
  selector: 'app-gains-panel',
  templateUrl: './gains-panel.html',
  styleUrl: './gains-panel.scss',
})
export class GainsPanel {
  private readonly wom = inject(WomApi);

  readonly username = input.required<string>();

  readonly periods = PERIODS;
  readonly period = signal<GainsPeriod>('week');
  readonly gains = signal<PlayerGains | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formatSignedNumber = formatSignedNumber;

  readonly skillRows = computed<GainRow[]>(() => {
    const g = this.gains();
    if (!g) return [];
    return SKILL_ORDER.filter((key) => key !== 'overall' && (g.data.skills[key]?.experience.gained ?? 0) > 0)
      .map((key) => {
        const meta = skillMeta(key);
        const s = g.data.skills[key];
        return {
          key,
          label: meta.label,
          icon: meta.icon,
          xpGained: s.experience.gained,
          levelsGained: s.level.gained,
        };
      })
      .sort((a, b) => b.xpGained - a.xpGained);
  });

  readonly overallXpGained = computed(() => this.gains()?.data.skills['overall']?.experience.gained ?? 0);
  readonly ehpGained = computed(() => this.gains()?.data.computed['ehp']?.value.gained ?? 0);
  readonly ehbGained = computed(() => this.gains()?.data.computed['ehb']?.value.gained ?? 0);
  readonly bossKillsGained = computed(() => {
    const g = this.gains();
    if (!g) return 0;
    return Object.values(g.data.bosses).reduce((sum, b) => sum + Math.max(0, b.kills.gained), 0);
  });

  constructor() {
    effect(() => {
      const name = this.username();
      const period = this.period();
      if (!name) return;
      this.fetch(name, period);
    });
  }

  setPeriod(period: GainsPeriod): void {
    this.period.set(period);
  }

  private fetch(username: string, period: GainsPeriod): void {
    this.loading.set(true);
    this.error.set(null);
    this.wom.getGains(username, period).subscribe({
      next: (g) => {
        this.gains.set(g);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
