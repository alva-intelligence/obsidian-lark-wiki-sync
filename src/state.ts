import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { SyncState, NodeState } from './types';

const STATE_FILE = '.lark-sync-state.json';

export class StateManager {
  static read(vaultPath: string): SyncState | null {
    const p = join(vaultPath, STATE_FILE);
    if (!existsSync(p)) return null;
    return JSON.parse(readFileSync(p, 'utf-8')) as SyncState;
  }

  static write(vaultPath: string, state: SyncState): void {
    const p = join(vaultPath, STATE_FILE);
    writeFileSync(p, JSON.stringify(state, null, 2), 'utf-8');
  }

  static fresh(spaceId: string, spaceName: string): SyncState {
    return { spaceId, spaceName, lastSync: '', nodes: {} };
  }

  static getNodeByPath(state: SyncState, relativePath: string): { token: string; node: NodeState } | null {
    for (const [token, node] of Object.entries(state.nodes)) {
      if (node.path === relativePath) return { token, node };
    }
    return null;
  }
}
