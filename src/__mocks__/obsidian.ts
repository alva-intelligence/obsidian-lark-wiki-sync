export class Plugin {}
export class Modal {
  app: any;
  contentEl: any = {
    empty: () => {},
    createEl: () => ({ style: {}, textContent: '', className: '', appendChild: () => {}, createEl: () => ({ style: {} }), remove: () => {} }),
    appendChild: () => {}
  };
  modalEl: any = { style: {} };
  constructor(app: any) { this.app = app; }
  open() {}
  close() {}
}
export class PluginSettingTab {
  app: any;
  containerEl: any = {
    empty: () => {},
    createEl: () => ({ style: {} }),
    appendChild: () => {}
  };
  constructor(app: any, plugin: any) { this.app = app; }
}
export class Setting {
  constructor(el: any) {}
  setName(n: string) { return this; }
  setDesc(d: string) { return this; }
  addText(cb: any) { cb({ setValue: () => ({ setPlaceholder: () => ({ onChange: () => {} }) }), setPlaceholder: () => ({ onChange: () => {} }), setValue: () => this, onChange: () => {} }); return this; }
  addToggle(cb: any) { cb({ setValue: () => ({ onChange: () => {} }), onChange: () => {} }); return this; }
  addButton(cb: any) { cb({ setButtonText: () => ({ onClick: () => {}, setCta: () => ({ onClick: () => {} }) }), setCta: () => ({ onClick: () => {} }), onClick: () => {} }); return this; }
}
export class Notice {
  constructor(msg: string) {}
}
export class TFile {}
export function normalizePath(p: string) { return p; }
