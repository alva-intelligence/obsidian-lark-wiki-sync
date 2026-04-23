import { App, Modal, Notice } from 'obsidian';
import { PluginSettings } from '../types';
import { renderStepCli } from './step-cli';
import { renderStepAuth } from './step-auth';
import { renderStepSpaces } from './step-spaces';
import { renderStepPaths } from './step-paths';
import { renderStepCompanion } from './step-companion';

export class WizardModal extends Modal {
  private step = 1;

  constructor(
    app: App,
    private settings: PluginSettings,
    private onComplete: (settings: PluginSettings) => Promise<void>
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.style.width = '600px';
    this.renderStep();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private renderStep(): void {
    const el = this.contentEl;
    el.empty();
    const progress = el.createEl('div', { cls: 'setting-item-description' });
    progress.textContent = `Step ${this.step} of 5`;
    progress.style.marginBottom = '16px';
    const stepContainer = el.createEl('div');
    const next = () => { this.step++; this.renderStep(); };
    switch (this.step) {
      case 1: renderStepCli(stepContainer, this.settings, next); break;
      case 2: renderStepAuth(stepContainer, this.settings, next); break;
      case 3: renderStepSpaces(stepContainer, this.settings, next); break;
      case 4: renderStepPaths(stepContainer, this.settings, next); break;
      case 5:
        renderStepCompanion(stepContainer, this.app, this.settings, async () => {
          this.settings.wizardCompleted = true;
          await this.onComplete(this.settings);
          this.close();
          new Notice('✓ Lark Wiki Sync is ready! Click the ribbon icon to sync.');
        });
        break;
    }
    if (this.step > 1) {
      const backBtn = el.createEl('button', { text: '← Back' });
      backBtn.style.marginTop = '16px';
      backBtn.onclick = () => { this.step--; this.renderStep(); };
    }
  }
}
