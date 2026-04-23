import { App, PluginSettingTab, Setting } from 'obsidian';
import type LarkWikiSyncPlugin from './main';
import { registerAndOpenVault } from './main';
import { WizardModal } from './wizard/wizard-modal';

export class LarkSyncSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: LarkWikiSyncPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Lark Wiki Sync' });

    new Setting(containerEl)
      .setName('Lark CLI path')
      .setDesc('Path to the lark binary. Default: /usr/local/bin/lark')
      .addText(t => t
        .setValue(this.plugin.settings.larkCliPath)
        .onChange(async v => {
          this.plugin.settings.larkCliPath = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Sync AI skills')
      .setDesc('Sync wiki docs titled "skill: <name>" into .claude/skills/')
      .addToggle(t => t
        .setValue(this.plugin.settings.syncAiSkills)
        .onChange(async v => {
          this.plugin.settings.syncAiSkills = v;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl('h3', { text: 'Synced Spaces' });

    if (this.plugin.settings.spaces.length === 0) {
      containerEl.createEl('p', { text: 'No spaces configured. Run the setup wizard.', cls: 'setting-item-description' });
    }

    for (const space of this.plugin.settings.spaces) {
      new Setting(containerEl)
        .setName(space.spaceName)
        .setDesc(space.vaultPath)
        .addButton(btn => btn
          .setButtonText('Open vault')
          .setCta()
          .onClick(() => registerAndOpenVault(space.vaultPath, space.spaceName))
        )
        .addButton(btn => btn
          .setButtonText('Remove')
          .onClick(async () => {
            this.plugin.settings.spaces = this.plugin.settings.spaces.filter(s => s.spaceId !== space.spaceId);
            await this.plugin.saveSettings();
            this.display();
          })
        );
    }

    containerEl.createEl('br');

    new Setting(containerEl)
      .setName('Re-run setup wizard')
      .setDesc('Add more spaces or reconfigure authentication')
      .addButton(btn => btn
        .setButtonText('Open wizard')
        .onClick(() => {
          new WizardModal(this.app, this.plugin.settings, async (s) => {
            Object.assign(this.plugin.settings, s);
            await this.plugin.saveSettings();
            this.display();
          }).open();
        })
      );
  }
}
