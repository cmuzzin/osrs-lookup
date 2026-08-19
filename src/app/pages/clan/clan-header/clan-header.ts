import { Component, computed, input } from '@angular/core';
import { GroupDetail } from '../../../core/wom.models';
import { formatNumber } from '../../../core/format.util';

@Component({
  selector: 'app-clan-header',
  templateUrl: './clan-header.html',
  styleUrl: './clan-header.scss',
})
export class ClanHeader {
  readonly group = input.required<GroupDetail>();

  readonly hasSocialLinks = computed(() => {
    const s = this.group().socialLinks;
    return !!(s.website || s.discord || s.twitter || s.youtube || s.twitch);
  });

  readonly formatNumber = formatNumber;
}
