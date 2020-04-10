export enum MessageAction {
  SelectedTreeItem = "SelectedTreeItem",
}
export interface Message {
  action: MessageAction;
  data: any;
}
