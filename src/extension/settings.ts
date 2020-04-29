import * as vscode from "vscode";
import { CrossnoteSettings } from "../lib/settings";
import { KeyMap, getKeyMap } from "../lib/keymap";

export class VSCodeCrossnoteSettings implements CrossnoteSettings {
  public static getCurrentSettings() {
    return new VSCodeCrossnoteSettings();
  }

  public readonly theme: string;
  public readonly keyMap: KeyMap;

  constructor() {
    const config = vscode.workspace.getConfiguration("crossnote");
    this.theme = config.get<string>("theme") || "dark";
    this.keyMap = getKeyMap(config.get<string>("keyMap") || "default");
  }

  public isEqualTo(otherConfig: VSCodeCrossnoteSettings) {
    const json1 = JSON.stringify(this);
    const json2 = JSON.stringify(otherConfig);
    return json1 === json2;
  }

  [key: string]: any;
}
