import { PushEngine } from '../src/push';
import { LarkCli } from '../src/lark-cli';
import { StateManager } from '../src/state';
import * as fs from 'fs';

jest.mock('../src/lark-cli');
jest.mock('../src/state');
jest.mock('fs');

const MockLarkCli = LarkCli as jest.MockedClass<typeof LarkCli>;

describe('PushEngine', () => {
  let cli: jest.Mocked<LarkCli>;
  let engine: PushEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    cli = new MockLarkCli('/usr/local/bin/lark') as jest.Mocked<LarkCli>;
    engine = new PushEngine(cli);
  });

  test('returns already_synced when node exists in state', async () => {
    (StateManager.read as jest.Mock).mockReturnValue({
      spaceId: 's1', spaceName: 'FCN', lastSync: '', nodes: {
        'tok1': { path: 'About.md', objToken: 'obj1', larkLastModified: '', localLastModified: '', larkRevisionId: 1 }
      }
    });
    (fs.readFileSync as jest.Mock).mockReturnValue('content');
    const result = await engine.push('/vault/About.md', '/vault', 's1');
    expect(result.status).toBe('already_synced');
  });

  test('creates new wiki node when file is not in state', async () => {
    (StateManager.read as jest.Mock).mockReturnValue({ spaceId: 's1', spaceName: 'FCN', lastSync: '', nodes: {} });
    (fs.readFileSync as jest.Mock).mockReturnValue('# Hello\nWorld');
    (fs.statSync as jest.Mock).mockReturnValue({ mtime: new Date('2026-01-01') });
    (StateManager.write as jest.Mock).mockImplementation(() => {});
    cli.createWikiNode.mockResolvedValue({ nodeToken: 'newTok', objToken: 'newObj' });
    cli.addDocContentBlocks.mockResolvedValue(undefined);
    cli.getDocRevision.mockResolvedValue(1);
    const result = await engine.push('/vault/New Draft.md', '/vault', 's1');
    expect(result.status).toBe('created');
    expect(cli.createWikiNode).toHaveBeenCalledWith('s1', 'New Draft', undefined);
  });
});
