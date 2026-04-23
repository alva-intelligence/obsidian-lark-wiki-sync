import { Plugin, Notice } from 'obsidian';
import { PluginSettings, SpaceConfig } from './types';
import { LarkCli } from './lark-cli';
import { PullEngine } from './pull';
import { PushEngine } from './push';
import { ConflictListModal } from './conflict-list-modal';
import { WizardModal } from './wizard/wizard-modal';
import { LarkSyncSettingsTab } from './settings';

const DEFAULT_SETTINGS: PluginSettings = {
  larkCliPath: '/usr/local/bin/lark',
  spaces: [],
  syncAiSkills: false,
  wizardCompleted: false,
  conflicts: []
};

export default class LarkWikiSyncPlugin extends Plugin {
  settings!: PluginSettings;
  private statusBar!: HTMLElement;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.statusBar = this.addStatusBarItem();
    this.updateStatusBar('idle');

    this.addRibbonIcon('sync', 'Lark: Sync all spaces', () => this.syncAll());

    this.addCommand({ id: 'pull-all', name: 'Lark: Pull all spaces', callback: () => this.syncAll() });
    this.addCommand({ id: 'publish-current', name: 'Lark: Publish current file', callback: () => this.publishCurrent() });
    this.addCommand({ id: 'resolve-conflicts', name: 'Lark: Resolve conflicts', callback: () => this.openConflictList() });
    this.addCommand({ id: 'open-settings', name: 'Lark: Open settings', callback: () => (this.app as any).setting?.open?.() });

    this.addSettingTab(new LarkSyncSettingsTab(this.app, this));

    if (!this.settings.wizardCompleted) {
      this.app.workspace.onLayoutReady(() => {
        new WizardModal(this.app, this.settings, async (s) => {
          Object.assign(this.settings, s);
          await this.saveSettings();
        }).open();
      });
    }
  }

  private updateStatusBar(state: 'idle' | 'syncing' | 'conflict'): void {
    const msgs: Record<string, string> = {
      idle: `Lark ✓ synced ${formatTime(new Date())}`,
      syncing: 'Lark ⟳ syncing...',
      conflict: `Lark ⚠ ${this.settings.conflicts.length} conflict(s)`
    };
    this.statusBar.setText(msgs[state]);
  }

  async syncAll(): Promise<void> {
    if (this.settings.spaces.length === 0) {
      new Notice('No spaces configured. Open Lark Wiki Sync settings to add one.');
      return;
    }
    this.updateStatusBar('syncing');
    const cli = new LarkCli(this.settings.larkCliPath);
    const engine = new PullEngine(cli, this.settings);
    let totalConflicts = 0;
    for (const space of this.settings.spaces) {
      try {
        new Notice(`Syncing "${space.spaceName}"...`);
        const result = await engine.pullSpace(space);
        for (const c of result.conflicts) {
          if (!this.settings.conflicts.find(x => x.nodeToken === c.nodeToken)) {
            this.settings.conflicts.push(c);
          }
        }
        totalConflicts += result.conflicts.length;
        new Notice(`✓ "${space.spaceName}": ${result.written} updated, ${result.skipped} unchanged${result.conflicts.length ? `, ${result.conflicts.length} conflicts` : ''}`);
      } catch (e: any) {
        new Notice(`⚠ Error syncing "${space.spaceName}": ${e.message}`);
      }
    }
    await this.saveSettings();
    this.updateStatusBar(totalConflicts > 0 ? 'conflict' : 'idle');
    if (totalConflicts > 0) {
      new Notice(`⚠ ${totalConflicts} conflict(s) need your attention. Use "Lark: Resolve conflicts".`);
    }
  }

  private async publishCurrent(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) { new Notice('No file is open.'); return; }
    const space = this.findSpaceForFile(file.path);
    if (!space) { new Notice('This file is not in any synced Lark vault.'); return; }
    const cli = new LarkCli(this.settings.larkCliPath);
    const engine = new PushEngine(cli);
    const absPath = (this.app.vault.adapter as any).getBasePath?.() + '/' + file.path;
    const result = await engine.push(absPath, space.vaultPath, space.spaceId);
    if (result.status === 'created') {
      new Notice(`✓ Published "${file.basename}" to Lark Wiki.`);
    } else {
      new Notice(result.message ?? 'Could not publish file.');
    }
  }

  private openConflictList(): void {
    if (this.settings.conflicts.length === 0) { new Notice('No conflicts to resolve.'); return; }
    new ConflictListModal(this.app, [...this.settings.conflicts], async (nodeToken, choice) => {
      this.settings.conflicts = this.settings.conflicts.filter(c => c.nodeToken !== nodeToken);
      await this.saveSettings();
      if (choice === 'local') {
        new Notice('Force-push not yet implemented. Edit in Lark directly.');
      } else if (choice === 'remote') {
        new Notice('Force-pull will apply on next sync.');
      }
      this.updateStatusBar(this.settings.conflicts.length > 0 ? 'conflict' : 'idle');
    }).open();
  }

  private findSpaceForFile(relativePath: string): SpaceConfig | null {
    const adapter = this.app.vault.adapter as any;
    const absPath: string = (adapter.getBasePath?.() ?? '') + '/' + relativePath;
    return this.settings.spaces.find(s => absPath.startsWith(s.vaultPath)) ?? null;
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
