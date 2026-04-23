import { execFile } from 'child_process';
import { LarkSpace, LarkNode } from './types';

export class LarkCli {
  constructor(private cliPath: string) {}

  private async run(args: string[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      execFile(this.cliPath, args, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve(stdout);
        }
      });
    });
  }

  async isInstalled(): Promise<boolean> {
    try {
      await this.run(['--version']);
      return true;
    } catch {
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.run(['wiki', 'spaces', 'list']);
      return true;
    } catch {
      return false;
    }
  }

  async listSpaces(): Promise<LarkSpace[]> {
    const res = await this.run(['wiki', 'spaces', 'list', '--page-all']) as any;
    return res.data?.items ?? [];
  }

  async listNodes(spaceId: string, parentNodeToken?: string): Promise<LarkNode[]> {
    const params: Record<string, string> = { space_id: spaceId };
    if (parentNodeToken) params.parent_node_token = parentNodeToken;
    const res = await this.run(['wiki', 'nodes', 'list', '--params', JSON.stringify(params), '--page-all']) as any;
    return res.data?.items ?? [];
  }

  async getDocContent(objToken: string): Promise<string> {
    const res = await this.run(['api', 'GET', `/open-apis/docx/v1/documents/${objToken}/raw_content`]) as any;
    return res.data?.content ?? '';
  }

  async getDocRevision(objToken: string): Promise<number> {
    const res = await this.run(['api', 'GET', `/open-apis/docx/v1/documents/${objToken}`]) as any;
    return res.data?.document?.revision_id ?? 0;
  }

  async createWikiNode(spaceId: string, title: string, parentNodeToken?: string): Promise<{ nodeToken: string; objToken: string }> {
    const args = ['wiki', '+node-create', '--space-id', spaceId, '--title', title, '--obj-type', 'docx'];
    if (parentNodeToken) args.push('--parent-node-token', parentNodeToken);
    const res = await this.run(args) as any;
    const node = res.data?.node;
    return { nodeToken: node.node_token, objToken: node.obj_token };
  }

  async addDocContentBlocks(objToken: string, lines: string[]): Promise<void> {
    const blocks = lines.map(line => markdownLineToBlock(line));
    await this.run(['api', 'POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, '--data', JSON.stringify({ children: blocks, index: 0 })]);
  }

  openTerminalForLogin(): void {
    // Validate cliPath only contains safe characters before embedding in AppleScript
    if (!/^[a-zA-Z0-9/_.-]+$/.test(this.cliPath)) {
      console.error('LarkCli: unsafe cliPath, refusing to open terminal');
      return;
    }
    const { execFile: ef } = require('child_process');
    setTimeout(() => {
      ef('osascript', [
        '-e',
        `tell application "Terminal" to do script "${this.cliPath} login"`
      ], () => {});
    }, 100);
  }
}

function markdownLineToBlock(line: string): unknown {
  const h1 = line.match(/^# (.+)/);
  const h2 = line.match(/^## (.+)/);
  const h3 = line.match(/^### (.+)/);
  const text = h1?.[1] ?? h2?.[1] ?? h3?.[1] ?? line;
  const blockType = h1 ? 3 : h2 ? 4 : h3 ? 5 : 2;
  const key = blockType === 2 ? 'text' : `heading${blockType - 2}`;
  return { block_type: blockType, [key]: { elements: [{ text_run: { content: text } }], style: {} } };
}
