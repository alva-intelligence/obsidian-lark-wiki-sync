import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { LarkCli } from './lark-cli';
import { StateManager } from './state';
import { SpaceConfig, SyncState, Conflict, LarkNode, PluginSettings } from './types';
import { unixToISO, isCLAUDEMD, isSkillDoc, skillFileName, buildRelativePath } from './utils';

export interface PullResult {
  written: number;
  skipped: number;
  conflicts: Conflict[];
}

export class PullEngine {
  constructor(
    private cli: LarkCli,
    private settings: PluginSettings
  ) {}

  async pullSpace(config: SpaceConfig): Promise<PullResult> {
    const state = StateManager.read(config.vaultPath)
      ?? StateManager.fresh(config.spaceId, config.spaceName);
    const result: PullResult = { written: 0, skipped: 0, conflicts: [] };
    await this.walkNodes(config.spaceId, '', '', config.vaultPath, state, result);
    state.lastSync = new Date().toISOString();
    StateManager.write(config.vaultPath, state);
    this.ensureGitignore(config.vaultPath);
    return result;
  }

  private async walkNodes(
    spaceId: string,
    parentNodeToken: string,
    parentRelDir: string,
    vaultPath: string,
    state: SyncState,
    result: PullResult
  ): Promise<void> {
    const nodes = await this.cli.listNodes(spaceId, parentNodeToken || undefined);
    for (const node of nodes) {
      if (node.obj_type !== 'docx') continue;
      const larkModified = unixToISO(node.obj_edit_time);
      const existing = state.nodes[node.node_token];
      if (existing && existing.larkLastModified === larkModified) {
        result.skipped++;
        if (node.has_child) {
          const relDir = existing.path.replace(/\.md$/, '');
          await this.walkNodes(spaceId, node.node_token, relDir, vaultPath, state, result);
        }
        continue;
      }
      const relPath = this.resolveRelPath(node, parentRelDir);
      const absPath = join(vaultPath, relPath);
      if (existing && existsSync(absPath)) {
        const localMtime = new Date(statSync(absPath).mtime).toISOString();
        if (PullEngine.detectConflict(larkModified, existing.localLastModified, localMtime)) {
          result.conflicts.push({ nodeToken: node.node_token, localPath: absPath, localLastModified: localMtime, larkLastModified: larkModified });
          continue;
        }
      }
      const content = await this.cli.getDocContent(node.obj_token);
      const revision = await this.cli.getDocRevision(node.obj_token);
      mkdirSync(dirname(absPath), { recursive: true });
      writeFileSync(absPath, content, 'utf-8');
      const localMtime = new Date(statSync(absPath).mtime).toISOString();
      state.nodes[node.node_token] = { path: relPath, objToken: node.obj_token, larkLastModified: larkModified, localLastModified: localMtime, larkRevisionId: revision };
      result.written++;
      if (node.has_child) {
        const relDir = relPath.replace(/\.md$/, '');
        await this.walkNodes(spaceId, node.node_token, relDir, vaultPath, state, result);
      }
    }
  }

  private resolveRelPath(node: LarkNode, parentRelDir: string): string {
    if (isCLAUDEMD(node.title)) return 'CLAUDE.md';
    if (this.settings.syncAiSkills && isSkillDoc(node.title)) {
      return join('.claude', 'skills', skillFileName(node.title));
    }
    return buildRelativePath(parentRelDir, node.title);
  }

  private ensureGitignore(vaultPath: string): void {
    const p = join(vaultPath, '.gitignore');
    const lines = ['.obsidian/', '.lark-sync-state.json'];
    if (!existsSync(p)) {
      writeFileSync(p, lines.join('\n') + '\n', 'utf-8');
      return;
    }
    const current = readFileSync(p, 'utf-8');
    const toAdd = lines.filter(l => !current.includes(l));
    if (toAdd.length) appendFileSync(p, '\n' + toAdd.join('\n') + '\n');
  }

  static detectConflict(larkLastModified: string, stateLocalLastModified: string, actualLocalMtime: string): boolean {
    const larkChanged = new Date(larkLastModified) > new Date(stateLocalLastModified);
    const localChanged = new Date(actualLocalMtime) > new Date(stateLocalLastModified);
    return larkChanged && localChanged;
  }
}
