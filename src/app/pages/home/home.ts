import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FeatureCard {
  route: string;
  icon: string;
  title: string;
  description: string;
}

/** Landing page: a hub of feature cards. Room to grow as more tools are added. */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly features: FeatureCard[] = [
    {
      route: '/lookup',
      icon: '🔍',
      title: 'Stat Lookup',
      description:
        "Search any player's hiscores levels, boss kill counts, quests, achievements, and clan stats.",
    },
    {
      route: '/calculator',
      icon: '🧮',
      title: 'XP Calculator',
      description: 'Compare training methods by XP/hour and see how long each takes to reach your goal level.',
    },
  ];
}
