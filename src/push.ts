import { readFileSync, statSync } from 'fs';
import { basename, relative } from 'path';
import { LarkCli } from './lark-cli';
import { StateManager } from './state';

export interface PushResult {
  status: 'created' | 'already_synced' | 'error';
  message?: string;
}

export class PushEngine {
  constructor(private cli: LarkCli) {}

  async push(absFilePath: string, vaultPath: string, spaceId: string, parentNodeToken?: string): Promise<PushResult> {
    const state = StateManager.read(vaultPath);
    const relPath = relative(vaultPath, absFilePath);
    if (state) {
      const alreadySynced = Object.values(state.nodes).some(n => n.path === relPath);
      if (alreadySynced) {
        return { status: 'already_synced', message: 'This file is already synced with Lark. Content updates via the plugin are not yet supported — edit the doc in Lark directly, then pull.' };
      }
    }
    try {
      const title = basename(absFilePath, '.md');
      const content = readFileSync(absFilePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      const { nodeToken, objToken } = await this.cli.createWikiNode(spaceId, title, parentNodeToken);
      await this.cli.addDocContentBlocks(objToken, lines);
      const revision = await this.cli.getDocRevision(objToken);
      if (state) {
        const localMtime = new Date(statSync(absFilePath).mtime).toISOString();
        state.nodes[nodeToken] = { path: relPath, objToken, larkLastModified: '', localLastModified: localMtime, larkRevisionId: revision };
        StateManager.write(vaultPath, state);
      }
      return { status: 'created' };
    } catch (e: any) {
      return { status: 'error', message: e.message };
    }
  }
}
