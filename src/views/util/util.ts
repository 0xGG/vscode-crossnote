import { Message } from "../../lib/message";
import { Note } from "../../lib/note";
import { CrossnoteSettings } from "../../lib/settings";
import * as path from "path";
import slash from "slash";

interface VSCodeWebviewAPI {
  postMessage: (message: Message) => void;
}

// @ts-ignore
export const vscode: VSCodeWebviewAPI = acquireVsCodeApi();

export function resolveNoteImageSrc(note: Note, imageSrc: string) {
  if (!note) {
    return imageSrc;
  }
  if (imageSrc.startsWith("https://") || imageSrc.startsWith("data:")) {
    return imageSrc;
  } else if (imageSrc.startsWith("http://")) {
    return "";
  } else if (imageSrc.startsWith("/")) {
    return `vscode-resource://file//${slash(
      path.resolve(note.notebookPath, "." + imageSrc)
    )}`;
  } else {
    return `vscode-resource://file//${slash(
      path.join(note.notebookPath, path.dirname(note.filePath), imageSrc)
    )}`;
  }
}

export const crossnoteSettings: CrossnoteSettings = window[
  "crossnoteSettings"
] as CrossnoteSettings;

export const extensionPath: string = window["extensionPath"] as string;
