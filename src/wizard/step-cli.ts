import { Setting } from 'obsidian';
import { LarkCli } from '../lark-cli';
import { PluginSettings } from '../types';

const KNOWN_PATHS = [
  '/usr/local/bin/lark',
  '/opt/homebrew/bin/lark',
  `${process.env.HOME}/.local/bin/lark`
];

export async function renderStepCli(
  container: HTMLElement,
  settings: PluginSettings,
  onNext: () => void
): Promise<void> {
  container.empty();
  container.createEl('h2', { text: 'Step 1 of 5 — Lark CLI' });
  container.createEl('p', { text: "Lark Wiki Sync uses the Lark CLI to connect to your Lark account. Let's check if it's installed." });

  const statusEl = container.createEl('p', { cls: 'lark-status-error', text: 'Checking...' });
  const nextBtn = container.createEl('button', { text: 'Continue →' });
  nextBtn.disabled = true;

  const initialPath = settings.larkCliPath || KNOWN_PATHS[0];
  const cli = new LarkCli(initialPath);
  if (await cli.isInstalled()) {
    settings.larkCliPath = initialPath;
    statusEl.className = 'lark-status-ok';
    statusEl.textContent = '✓ Lark CLI found at ' + initialPath;
    nextBtn.disabled = false;
    nextBtn.onclick = onNext;
    return;
  }

  for (const p of KNOWN_PATHS) {
    const c = new LarkCli(p);
    if (await c.isInstalled()) {
      settings.larkCliPath = p;
      statusEl.className = 'lark-status-ok';
      statusEl.textContent = '✓ Lark CLI found at ' + p;
      nextBtn.disabled = false;
      nextBtn.onclick = onNext;
      return;
    }
  }

  statusEl.textContent = '';
  container.createEl('p', { text: '⚠️ Lark CLI not found. Follow these steps to install it:' });
  const ol = container.createEl('ol');
  ol.createEl('li').createEl('a', {
    text: 'Download the Lark CLI from GitHub',
    href: 'https://github.com/larksuite/cli/releases/latest',
    attr: { target: '_blank' }
  });
  ol.createEl('li', { text: 'Open your Downloads folder and double-click to install.' });
  ol.createEl('li', { text: 'Come back here and click "Check again".' });

  new Setting(container)
    .setName('Custom path (optional)')
    .setDesc('Only needed if you installed Lark CLI in a non-standard location.')
    .addText(t => t
      .setPlaceholder('/usr/local/bin/lark')
      .setValue(settings.larkCliPath)
      .onChange(v => { settings.larkCliPath = v; })
    );

  const recheckBtn = container.createEl('button', { text: 'Check again' });
  recheckBtn.style.marginRight = '8px';
  recheckBtn.onclick = () => renderStepCli(container, settings, onNext);
  container.appendChild(recheckBtn);
  container.appendChild(nextBtn);
}
