import * as vscode from "vscode";
import { CrossnoteSettings } from "../lib/settings";

export class VSCodeCrossnoteSettings implements CrossnoteSettings {
  public static getCurrentSettings() {
    return new VSCodeCrossnoteSettings();
  }

  public readonly theme: string;

  constructor() {
    const config = vscode.workspace.getConfiguration("crossnote");
    this.theme = config.get<string>("theme") || "dark";
  }

  public isEqualTo(otherConfig: VSCodeCrossnoteSettings) {
    const json1 = JSON.stringify(this);
    const json2 = JSON.stringify(otherConfig);
    return json1 === json2;
  }

  [key: string]: any;
}
