import { Setting } from 'obsidian';
import { PluginSettings } from '../types';
import { mkdirSync } from 'fs';

export async function renderStepPaths(
  container: HTMLElement,
  settings: PluginSettings,
  onNext: () => void
): Promise<void> {
  container.empty();
  container.createEl('h2', { text: 'Step 4 of 5 — Vault Locations' });
  container.createEl('p', { text: 'Choose where each space will be saved on your computer. Each space gets its own Obsidian vault folder.' });

  for (const space of settings.spaces) {
    new Setting(container)
      .setName(space.spaceName)
      .setDesc('Folder path where this space will be synced')
      .addText(t => t
        .setValue(space.vaultPath)
        .setPlaceholder('/Users/you/Documents/Obsidian/' + space.spaceName)
        .onChange(v => { space.vaultPath = v; })
      );
  }

  container.createEl('br');
  const nextBtn = container.createEl('button', { text: 'Continue →' });
  nextBtn.onclick = () => {
    for (const space of settings.spaces) {
      try {
        mkdirSync(space.vaultPath, { recursive: true });
      } catch {
        container.createEl('p', { cls: 'lark-status-error', text: `⚠️ Could not create folder: ${space.vaultPath}` });
        return;
      }
    }
    onNext();
  };
}
