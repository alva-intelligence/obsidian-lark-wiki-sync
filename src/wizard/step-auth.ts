import { LarkCli } from '../lark-cli';
import { PluginSettings } from '../types';

export async function renderStepAuth(
  container: HTMLElement,
  settings: PluginSettings,
  onNext: () => void
): Promise<void> {
  container.empty();
  container.createEl('h2', { text: 'Step 2 of 5 — Sign in to Lark' });
  container.createEl('p', { text: "Checking if you're already signed in..." });

  const cli = new LarkCli(settings.larkCliPath);
  const authed = await cli.isAuthenticated();

  container.empty();
  container.createEl('h2', { text: 'Step 2 of 5 — Sign in to Lark' });
  const nextBtn = container.createEl('button', { text: 'Continue →' });

  if (authed) {
    container.createEl('p', { cls: 'lark-status-ok', text: "✓ You're signed in to Lark." });
    nextBtn.disabled = false;
    nextBtn.onclick = onNext;
    container.appendChild(nextBtn);
    return;
  }

  nextBtn.disabled = true;
  container.createEl('p', { text: "You're not signed in yet. Click the button below — it will open a Terminal window where you can sign in with your Lark account." });

  const loginBtn = container.createEl('button', { text: '🔑 Sign in to Lark' });
  loginBtn.style.marginRight = '8px';
  loginBtn.onclick = () => cli.openTerminalForLogin();

  const recheckBtn = container.createEl('button', { text: 'Done, check again' });
  recheckBtn.style.marginRight = '8px';
  recheckBtn.onclick = () => renderStepAuth(container, settings, onNext);

  container.appendChild(loginBtn);
  container.appendChild(recheckBtn);
  container.appendChild(nextBtn);
}
