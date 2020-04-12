export enum CrossnoteSectionType {
  Notebook = "Notebook",
  Notes = "Notes",
  Today = "Today",
  Todo = "Todo",
  Tagged = "Tagged",
  Untagged = "Untagged",
  Conflicted = "Conflicted",
  Encrypted = "Encrypted",
  Wiki = "Wiki",
  Error = "Error",
  Tag = "Tag",
  Directory = "Directory",
}

export interface SelectedSection {
  path: string;
  type: CrossnoteSectionType;
  notebook: {
    name: string;
    dir: string;
  };
}
