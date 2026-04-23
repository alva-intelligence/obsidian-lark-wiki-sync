import { LarkCli } from '../lark-cli';
import { LarkSpace, PluginSettings } from '../types';
import { homedir } from 'os';
import { join } from 'path';

export async function renderStepSpaces(
  container: HTMLElement,
  settings: PluginSettings,
  onNext: () => void
): Promise<void> {
  container.empty();
  container.createEl('h2', { text: 'Step 3 of 5 — Choose Spaces' });
  container.createEl('p', { text: 'Select which Lark Wiki spaces you want to sync to Obsidian.' });

  const loadingEl = container.createEl('p', { text: 'Loading your spaces...' });
  const cli = new LarkCli(settings.larkCliPath);
  let spaces: LarkSpace[] = [];

  try {
    spaces = await cli.listSpaces();
  } catch {
    loadingEl.textContent = '⚠️ Failed to load spaces. Check your connection and go back to re-authenticate.';
    return;
  }

  loadingEl.remove();

  const selected = new Set(settings.spaces.map(s => s.spaceId));

  for (const space of spaces) {
    const row = container.createEl('div', { cls: 'lark-space-item' });
    const cb = row.createEl('input', { attr: { type: 'checkbox' } }) as HTMLInputElement;
    cb.checked = selected.has(space.space_id);
    row.createEl('span', { text: space.name });
    if (space.description) {
      row.createEl('small', { text: ` — ${space.description}`, cls: 'setting-item-description' });
    }
    cb.onchange = () => {
      if (cb.checked) {
        selected.add(space.space_id);
        if (!settings.spaces.find(s => s.spaceId === space.space_id)) {
          settings.spaces.push({ spaceId: space.space_id, spaceName: space.name, vaultPath: join(homedir(), 'Documents', 'Obsidian', space.name) });
        }
      } else {
        selected.delete(space.space_id);
        settings.spaces = settings.spaces.filter(s => s.spaceId !== space.space_id);
      }
    };
  }

  container.createEl('br');
  const nextBtn = container.createEl('button', { text: 'Continue →' });
  nextBtn.onclick = () => {
    if (settings.spaces.length === 0) {
      container.createEl('p', { cls: 'lark-status-error', text: 'Please select at least one space.' });
      return;
    }
    onNext();
  };
}
