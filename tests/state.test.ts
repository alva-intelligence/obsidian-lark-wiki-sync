import * as fs from 'fs';
jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

import { StateManager } from '../src/state';
import { SyncState } from '../src/types';

const VAULT = '/Users/jeff/Documents/Obsidian/FCN Wiki';
const STATE_PATH = `${VAULT}/.lark-sync-state.json`;

const baseState: SyncState = {
  spaceId: 'space1',
  spaceName: 'FCN Wiki',
  lastSync: '2026-01-01T00:00:00Z',
  nodes: {}
};

describe('StateManager', () => {
  beforeEach(() => jest.clearAllMocks());

  test('read returns null when file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(StateManager.read(VAULT)).toBeNull();
  });

  test('read returns parsed state when file exists', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(baseState) as any);
    const state = StateManager.read(VAULT);
    expect(state?.spaceId).toBe('space1');
  });

  test('write serialises state to file', () => {
    mockFs.writeFileSync.mockImplementation(() => {});
    StateManager.write(VAULT, baseState);
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      STATE_PATH,
      JSON.stringify(baseState, null, 2),
      'utf-8'
    );
  });

  test('getNodeByPath finds node by relative path', () => {
    const state: SyncState = {
      ...baseState,
      nodes: {
        tok1: { path: 'About.md', objToken: 'obj1', larkLastModified: '2026-01-01T00:00:00Z', localLastModified: '2026-01-01T00:00:00Z', larkRevisionId: 1 }
      }
    };
    const result = StateManager.getNodeByPath(state, 'About.md');
    expect(result?.token).toBe('tok1');
  });
});
