import { execFile } from 'child_process';
jest.mock('child_process');

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;

function mockLarkSuccess(data: unknown) {
  (mockExecFile as jest.Mock).mockImplementation((_cmd: any, _args: any, cb: any) => {
    cb(null, JSON.stringify({ code: 0, data, msg: 'success' }), '');
  });
}

function mockLarkError(msg = 'unauthorized') {
  (mockExecFile as jest.Mock).mockImplementation((_cmd: any, _args: any, cb: any) => {
    cb(new Error(msg), '', msg);
  });
}

import { LarkCli } from '../src/lark-cli';

describe('LarkCli', () => {
  let cli: LarkCli;

  beforeEach(() => {
    jest.clearAllMocks();
    cli = new LarkCli('/usr/local/bin/lark');
  });

  test('isInstalled returns true when lark runs', async () => {
    (mockExecFile as jest.Mock).mockImplementation((_cmd: any, _args: any, cb: any) => {
      cb(null, 'lark-cli version 1.0.17', '');
    });
    expect(await cli.isInstalled()).toBe(true);
  });

  test('isInstalled returns false on error', async () => {
    mockLarkError('not found');
    expect(await cli.isInstalled()).toBe(false);
  });

  test('isAuthenticated returns true when spaces list succeeds', async () => {
    mockLarkSuccess({ items: [], has_more: false });
    expect(await cli.isAuthenticated()).toBe(true);
  });

  test('isAuthenticated returns false on auth error', async () => {
    mockLarkError('not authenticated');
    expect(await cli.isAuthenticated()).toBe(false);
  });

  test('listSpaces returns array of spaces', async () => {
    mockLarkSuccess({ items: [{ space_id: 'abc', name: 'FCN Wiki', description: '' }], has_more: false });
    const spaces = await cli.listSpaces();
    expect(spaces).toHaveLength(1);
    expect(spaces[0].space_id).toBe('abc');
  });

  test('listNodes returns nodes for a space', async () => {
    mockLarkSuccess({ items: [{ node_token: 'tok1', obj_token: 'obj1', title: 'About', obj_type: 'docx', has_child: false, obj_edit_time: '1700000000', parent_node_token: '' }], has_more: false });
    const nodes = await cli.listNodes('spaceid');
    expect(nodes[0].node_token).toBe('tok1');
  });

  test('getDocContent returns content string', async () => {
    mockLarkSuccess({ content: 'Hello world\n' });
    const content = await cli.getDocContent('obj1');
    expect(content).toBe('Hello world\n');
  });

  test('getDocRevision returns revision_id', async () => {
    mockLarkSuccess({ document: { document_id: 'obj1', revision_id: 42, title: 'Doc' } });
    const rev = await cli.getDocRevision('obj1');
    expect(rev).toBe(42);
  });
});
