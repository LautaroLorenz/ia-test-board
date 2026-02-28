import { Component, inject } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive]
})
export class AppComponent {
  private electronService = inject(ElectronService);
  private translate = inject(TranslateService);

  constructor() {
    this.translate.setDefaultLang('en');
    if (this.electronService.isElectron) {
      void this.electronService.ipcRenderer.invoke('app:get-version');
    }
  }
}
