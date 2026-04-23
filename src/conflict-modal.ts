import { App, Modal, Setting } from 'obsidian';
import { Conflict } from './types';

export type ConflictChoice = 'local' | 'remote' | 'both';

export class ConflictModal extends Modal {
  private choice: ConflictChoice | null = null;

  constructor(
    app: App,
    private conflict: Conflict,
    private onResolve: (choice: ConflictChoice) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Sync Conflict' });
    contentEl.createEl('p', { text: 'This file was changed both locally and in Lark Wiki since your last sync.' });
    contentEl.createEl('p', { cls: 'lark-conflict-path', text: this.conflict.localPath });
    const info = contentEl.createEl('div', { cls: 'setting-item-description' });
    info.createEl('span', { text: `Lark modified: ${formatDate(this.conflict.larkLastModified)}` });
    info.createEl('br');
    info.createEl('span', { text: `Local modified: ${formatDate(this.conflict.localLastModified)}` });
    contentEl.createEl('br');
    new Setting(contentEl)
      .setName('Keep Local')
      .setDesc('Overwrite Lark with your local version')
      .addButton(btn => btn.setButtonText('Keep Local').onClick(() => { this.choice = 'local'; this.close(); }));
    new Setting(contentEl)
      .setName('Keep Remote')
      .setDesc('Overwrite your local file with the Lark version')
      .addButton(btn => btn.setButtonText('Keep Remote').setCta().onClick(() => { this.choice = 'remote'; this.close(); }));
    new Setting(contentEl)
      .setName('Open Both')
      .setDesc('View both versions side by side and resolve manually')
      .addButton(btn => btn.setButtonText('Open Both').onClick(() => { this.choice = 'both'; this.close(); }));
  }

  onClose(): void {
    if (this.choice) this.onResolve(this.choice);
    this.contentEl.empty();
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}
