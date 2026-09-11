import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FeatureCard {
  route: string;
  icon: string;
  title: string;
  description: string;
}

/** Landing page: a hub of feature cards. Currently just Stat Lookup, with room to grow. */
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
  ];
}
