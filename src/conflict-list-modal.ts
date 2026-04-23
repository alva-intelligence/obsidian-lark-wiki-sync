import { App, Modal, Setting } from 'obsidian';
import { Conflict } from './types';
import { ConflictModal, ConflictChoice } from './conflict-modal';

export class ConflictListModal extends Modal {
  constructor(
    app: App,
    private conflicts: Conflict[],
    private onResolved: (nodeToken: string, choice: ConflictChoice) => Promise<void>
  ) {
    super(app);
  }

  onOpen(): void {
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: `Sync Conflicts (${this.conflicts.length})` });
    contentEl.createEl('p', { text: 'The following files have changes in both Lark and your local vault. Resolve each one:' });
    if (this.conflicts.length === 0) {
      contentEl.createEl('p', { text: '✓ No conflicts.' });
      return;
    }
    for (const conflict of this.conflicts) {
      const fileName = conflict.localPath.split('/').pop() ?? conflict.localPath;
      new Setting(contentEl)
        .setName(fileName)
        .setDesc(`Local: ${formatDate(conflict.localLastModified)} · Lark: ${formatDate(conflict.larkLastModified)}`)
        .addButton(btn => btn.setButtonText('Resolve').onClick(() => {
          new ConflictModal(this.app, conflict, async (choice) => {
            await this.onResolved(conflict.nodeToken, choice);
            this.conflicts = this.conflicts.filter(c => c.nodeToken !== conflict.nodeToken);
            this.render();
          }).open();
        }));
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}
