import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AppIconName = 'calendar' | 'clipboard' | 'clock' | 'user' | 'users' | 'dumbbell' | 'zap' | 'search' | 'x' | 'chevron-left' | 'chevron-right';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-icon',
    'aria-hidden': 'true',
  },
  template: `
    <svg viewBox="0 0 24 24" focusable="false">
      @switch (name()) {
        @case ('calendar') {
          <path d="M8 2v4M16 2v4M3 10h18" />
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        }
        @case ('clipboard') {
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
          <path d="M8 12h8M8 16h5" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        }
        @case ('user') {
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        }
        @case ('users') {
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        }
        @case ('dumbbell') {
          <path d="M14.4 14.4 9.6 9.6M18.6 21 21 18.6M3 5.4 5.4 3M6.2 8.2 8.2 6.2M15.8 17.8l2-2" />
          <path d="m21 21-3-3M3 3l3 3M6.2 17.8l11.6-11.6" />
          <path d="m3 18.6 2.4 2.4M18.6 3 21 5.4M15.8 6.2l2 2M6.2 15.8l2 2" />
        }
        @case ('zap') {
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        }
        @case ('x') {
          <path d="M18 6 6 18M6 6l12 12" />
        }
        @case ('chevron-left') {
          <path d="m15 18-6-6 6-6" />
        }
        @case ('chevron-right') {
          <path d="m9 18 6-6-6-6" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.15em;
      height: 1.15em;
      flex: 0 0 auto;
      color: currentColor;
    }

    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class AppIconComponent {
  readonly name = input.required<AppIconName>();
}
