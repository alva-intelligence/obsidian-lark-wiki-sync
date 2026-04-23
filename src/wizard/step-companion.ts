import { App, Setting } from 'obsidian';
import { PluginSettings } from '../types';

export async function renderStepCompanion(
  container: HTMLElement,
  app: App,
  settings: PluginSettings,
  onFinish: () => void
): Promise<void> {
  container.empty();
  container.createEl('h2', { text: 'Step 5 of 5 — Almost done!' });

  const hasObsidianGit = !!(app as any).plugins?.getPlugin('obsidian-git');

  if (hasObsidianGit) {
    container.createEl('p', { cls: 'lark-status-ok', text: '✓ Obsidian Git is installed — your vault will be automatically versioned.' });
  } else {
    container.createEl('p', { text: 'We recommend installing Obsidian Git to keep a version history of your wiki files.' });
    container.createEl('p', { text: 'To install: open Settings → Community plugins → Browse, and search for "Obsidian Git".', cls: 'setting-item-description' });
  }

  container.createEl('br');

  new Setting(container)
    .setName('Sync AI skills')
    .setDesc('Wiki docs titled "skill: <name>" will be synced to .claude/skills/ so Claude Code can use them automatically.')
    .addToggle(t => t.setValue(settings.syncAiSkills).onChange(v => { settings.syncAiSkills = v; }));

  container.createEl('br');
  const doneBtn = container.createEl('button', { text: '✓ Start syncing' });
  doneBtn.addClass('mod-cta');
  doneBtn.onclick = onFinish;
}
