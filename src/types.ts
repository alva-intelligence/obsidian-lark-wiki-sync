export interface NodeState {
  path: string;
  objToken: string;
  larkLastModified: string;
  localLastModified: string;
  larkRevisionId: number;
}

export interface SyncState {
  spaceId: string;
  spaceName: string;
  lastSync: string;
  nodes: Record<string, NodeState>;
}

export interface SpaceConfig {
  spaceId: string;
  spaceName: string;
  vaultPath: string;
}

export interface LarkSpace {
  space_id: string;
  name: string;
  description: string;
}

export interface LarkNode {
  node_token: string;
  obj_token: string;
  title: string;
  obj_type: string;
  has_child: boolean;
  obj_edit_time: string;
  parent_node_token: string;
}

export interface Conflict {
  nodeToken: string;
  localPath: string;
  localLastModified: string;
  larkLastModified: string;
}

export interface PluginSettings {
  larkCliPath: string;
  spaces: SpaceConfig[];
  syncAiSkills: boolean;
  wizardCompleted: boolean;
  conflicts: Conflict[];
}
