import { Message } from "../../lib/message";
import { Note } from "../../lib/note";
import * as path from "path";

interface VSCodeWebviewAPI {
  postMessage: (message: Message) => void;
}

// @ts-ignore
export const vscode: VSCodeWebviewAPI = acquireVsCodeApi();

export function resolveNoteImageSrc(note: Note, imageSrc: string) {
  if (!note) {
    return imageSrc;
  }
  if (imageSrc.startsWith("https://")) {
    return imageSrc;
  } else if (imageSrc.startsWith("http://")) {
    return "";
  } else if (imageSrc.startsWith("/")) {
    return `vscode-resource://file//${path.resolve(
      note.notebookPath,
      "." + imageSrc
    )}`;
  } else {
    return `vscode-resource://file//${path.resolve(
      note.notebookPath,
      imageSrc
    )}`;
  }
}
