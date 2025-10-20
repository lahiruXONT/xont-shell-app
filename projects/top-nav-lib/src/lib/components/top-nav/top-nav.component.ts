import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../models/user.model';
import { NotificationService } from '../../services/notification.service';
import { ThemeService } from '../../services/theme.service';

/**
 * Top Navigation Component
 * Legacy: Top navigation bar from Main.aspx
 */
@Component({
  selector: 'lib-top-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss',
})
export class TopNavComponent implements OnInit {
  @Input() user: UserProfile | null = null;
  @Input() showNotifications = true;
  @Input() showSettings = true;
  @Input() showHelp = true;

  @Output() logoClicked = new EventEmitter<void>();
  @Output() notificationClicked = new EventEmitter<void>();
  @Output() settingsClicked = new EventEmitter<void>();
  @Output() helpClicked = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();
  @Output() userDropdownToggled = new EventEmitter<boolean>();

  // Component state
  showUserDropdown = signal<boolean>(false);

  // Get services
  readonly unreadCount = computed(() => this.notificationService.unreadCount());
  readonly currentTheme = computed(() => this.themeService.currentTheme());

  constructor(
    private notificationService: NotificationService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Initialize
  }

  onLogoClick(): void {
    this.logoClicked.emit();
  }

  onNotificationClick(): void {
    this.notificationClicked.emit();
    this.notificationService.togglePanel();
  }

  onSettingsClick(): void {
    this.settingsClicked.emit();
  }

  onHelpClick(): void {
    this.helpClicked.emit();
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }

  toggleUserDropdown(): void {
    const isOpen = !this.showUserDropdown();
    this.showUserDropdown.set(isOpen);
    this.userDropdownToggled.emit(isOpen);
  }
}
