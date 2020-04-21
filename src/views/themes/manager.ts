import { CrossnoteTheme } from "./theme";
import { LightTheme } from "./light";
import { DarkTheme } from "./dark";
import { crossnoteSettings } from "../util/util";

export class ThemeManager {
  public themes: CrossnoteTheme[];
  public selectedTheme: CrossnoteTheme;
  constructor() {
    this.themes = [];
    this.selectedTheme = null;
  }
  public addTheme(theme: CrossnoteTheme) {
    this.themes.push(theme);
    if (!this.selectedTheme) {
      this.selectTheme(theme.name);
    }
  }

  public getTheme(name: string) {
    return this.themes.find((theme) => theme.name === name);
  }

  public selectTheme(name: string) {
    if (!name) {
      return;
    }
    const theme = this.themes.find((t) => t.name === name);
    if (!theme) {
      return;
    }
    this.selectedTheme = theme;
  }
}

const _themeManager = new ThemeManager();
_themeManager.addTheme(LightTheme);
_themeManager.addTheme(DarkTheme);

export const themeManager = _themeManager;

export const selectedTheme = themeManager.getTheme(crossnoteSettings.theme);
