import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LatestRunSummary } from '../../core/models/status.model';
import { IpcClientService } from '../../core/services/ipc-client.service';

@Component({
  selector: 'app-realtime-status',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './realtime-status.component.html',
  styleUrl: './realtime-status.component.scss'
})
export class RealtimeStatusComponent implements OnInit, OnDestroy {
  private readonly ipc = inject(IpcClientService);
  private unsubscribeStatus: (() => void) | null = null;
  readonly summary$ = new BehaviorSubject<LatestRunSummary>({
    runGroupId: null,
    okCount: 0,
    failCount: 0,
    topFailureCauses: []
  });

  ngOnInit(): void {
    this.unsubscribeStatus = this.ipc.onStatusUpdated(() => void this.refresh());
    void this.refresh();
  }

  ngOnDestroy(): void {
    this.unsubscribeStatus?.();
  }

  async refresh(): Promise<void> {
    const summary = await this.ipc.getLatestSummary();
    this.summary$.next(summary);
  }
}
