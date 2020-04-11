import { Message } from "../../lib/message";

interface VSCodeWebviewAPI {
  postMessage: (message: Message) => void;
}

// @ts-ignore
export const vscode: VSCodeWebviewAPI = acquireVsCodeApi();
