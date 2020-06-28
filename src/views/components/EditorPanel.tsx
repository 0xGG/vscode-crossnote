import React, { useState, useEffect, useCallback } from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import clsx from "clsx";
import {
  Box,
  ButtonGroup,
  Tooltip,
  Button,
  Popover,
  List,
  ListItem,
  TextField,
  Typography,
  IconButton,
  Breadcrumbs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
} from "@material-ui/core";
import {
  Editor as CodeMirrorEditor,
  EditorChangeLinkedList,
  TextMarker,
  Position,
} from "codemirror";
import "@mdi/font/css/materialdesignicons.min.css";
import { useTranslation } from "react-i18next";
import {
  Pencil,
  CodeTags,
  FilePresentationBox,
  Tag,
  TagOutline,
  Pin,
  PinOutline,
  Lock,
  LockOpenOutline,
  RenameBox,
  Delete,
  ContentDuplicate,
  Close,
  LockOpen,
  ViewSplitVertical,
} from "mdi-material-ui";
import Noty from "noty";
import * as CryptoJS from "crypto-js";
import { Message, MessageAction } from "../../lib/message";
import { TagNode } from "../../lib/notebook";
import {
  vscode,
  resolveNoteImageSrc,
  extensionPath,
  crossnoteSettings,
  setSelectedSection,
} from "../util/util";
import { Note, getHeaderFromMarkdown } from "../../lib/note";
import { TagStopRegExp } from "../util/markdown";
import { initMathPreview } from "../editor/views/math-preview";
import { CrossnoteSectionType, SelectedSection } from "../../lib/section";
import { renderPreview } from "vickymd/preview";
import EmojiDefinitions from "vickymd/addon/emoji";
import { formatDistance } from "date-fns";
import { DeleteDialog } from "./DeleteDialog";
import ChangeFilePathDialog from "./ChangeFilePathDialog";
import EditImageDialog from "./EditImageDialog";
import { setTheme } from "vickymd/theme";
import { selectedTheme } from "../themes/manager";
import {
  openURL,
  postprocessPreview as previewPostprocessPreview,
} from "../util/preview";
import { TagsMenuPopover } from "./TagsMenuPopover";

const VickyMD = require("vickymd/core");

const HMDFold = {
  image: true,
  link: true,
  math: true,
  html: true, // maybe dangerous
  emoji: true,
  widget: true,
  code: true,
};

interface CommandHint {
  text: string;
  command: string;
  description: string;
  icon?: string;
  render: (element: HTMLElement, data: any, current: CommandHint) => void;
}

const previewZIndex = 99;
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    editorPanel: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderRadius: 0,
      padding: 0,
      margin: 0,
      boxSizing: "border-box",
      backgroundColor: theme.palette.background.paper,
    },
    topPanel: {
      position: "relative",
      padding: theme.spacing(0.5, 1), // theme.spacing(0.5, 1),
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      // borderBottom: "1px solid #eee",
      overflow: "auto",
      backgroundColor: theme.palette.background.paper,
    },
    bottomPanel: {
      position: "relative",
      padding: theme.spacing(0.5, 1),
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.palette.background.paper,
      // color: theme.palette.primary.contrastText,
      // backgroundColor: theme.palette.primary.main
    },
    controlBtn: {
      padding: theme.spacing(0.5, 0),
      color: theme.palette.text.secondary,
    },
    controlBtnSelected: {
      color: theme.palette.primary.main,
    },
    controlBtnSelectedSecondary: {
      color: theme.palette.secondary.main,
    },
    row: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
    },
    cursorPositionInfo: {
      zIndex: 150,
    },
    editorWrapper: {
      //     display: "contents",
      flex: 1,
      overflow: "auto",
      backgroundColor: theme.palette.background.paper,
      "& .CodeMirror-gutters": {
        display: "none",
      },
      "& .CodeMirror-code": {
        width: "100%",
      },
      "& .CodeMirror": {
        height: "100%",
        padding: theme.spacing(0, 2),
        [theme.breakpoints.down("sm")]: {
          padding: theme.spacing(1),
        },
      },
      "& .CodeMirror-vscrollbar": {
        // display: "none !important",
      },
      "& .CodeMirror-placeholder": {
        color: `${theme.palette.action.disabled} !important`,
      },
      /*
      [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(1),
      },
      */
    },
    editor: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.palette.background.default,
      border: "none",
    },
    menuItemOverride: {
      cursor: "default",
      padding: `0 0 0 ${theme.spacing(2)}px`,
      "&:hover": {
        backgroundColor: "inherit",
      },
    },
    menuItemTextField: {
      paddingRight: theme.spacing(2),
    },
    preview: {
      position: "relative",
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
      border: "none",
      overflow: "auto !important",
      padding: theme.spacing(2),
      zIndex: previewZIndex,
      [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(1),
      },
      // gridArea: "2 / 2 / 3 / 3"
    },
    presentation: {
      padding: "0 !important",
    },
    splitView: {
      display: "flex",
      flexDirection: "row",
      "& .CodeMirror.CodeMirror": {
        width: "50%",
      },
      "& $preview": {
        position: "relative",
        width: "50%",
        borderLeft: `1px solid ${theme.palette.divider}`,
      },
    },
    // math
    floatWin: {
      position: "fixed",
      zIndex: 100,
      background: theme.palette.background.paper,
      borderRadius: "5px",
      overflow: "hidden",
      boxShadow: "0 3px 7px rgba(0,0,0,0.3)",
      minWidth: "200px",
      maxWidth: "70%",
    },
    floatWinHidden: {
      display: "none",
    },
    floatWinTitle: {
      display: "flex",
      alignItems: "center",
      background: "#579",
      color: "#eee",
    },
    floatWinContent: {
      maxHeight: "80vh",
      overflow: "auto",
      padding: "10px 20px",
    },
    floatWinClose: {
      color: "#eee",
    },
  })
);

interface CursorPosition {
  ch: number;
  line: number;
}
interface TimerText {
  text: string;
  line: number;
  date: Date;
}
export enum EditorMode {
  VickyMD = "VickyMD",
  SourceCode = "SourceCode",
  Preview = "Preview",
  SplitView = "SplitView",
}

interface Props {}
export default function EditorPanel(props: Props) {
  const classes = useStyles(props);
  const { t } = useTranslation();
  const [textAreaElement, setTextAreaElement] = useState<HTMLTextAreaElement>(
    null
  );
  const [previewElement, setPreviewElement] = useState<HTMLElement>(null);
  const [editor, setEditor] = useState<CodeMirrorEditor>(null);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    line: 0,
    ch: 0,
  });
  const [note, setNote] = useState<Note>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.Preview);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [filePathDialogOpen, setFilePathDialogOpen] = useState<boolean>(false);
  const [toggleEncryptionDialogOpen, setToggleEncryptionDialogOpen] = useState<
    boolean
  >(false);
  const [toggleEncryptionPassword, setToggleEncryptionPassword] = useState<
    string
  >("");
  const [decryptionDialogOpen, setDecryptionDialogOpen] = useState<boolean>(
    false
  );
  const [decryptionPassword, setDecryptionPassword] = useState<string>("");
  const [isDecrypted, setIsDecrypted] = useState<boolean>(false);
  const [tagsMenuAnchorEl, setTagsMenuAnchorEl] = useState<HTMLElement>(null);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [editImageElement, setEditImageElement] = useState<HTMLImageElement>(
    null
  );
  const [editImageTextMarker, setEditImageTextMarker] = useState<TextMarker>(
    null
  );
  const [editImageDialogOpen, setEditImageDialogOpen] = useState<boolean>(
    false
  );
  const [previewIsPresentation, setPreviewIsPresentation] = useState<boolean>(
    false
  );
  const [notebookTagNode, setNotebookTagNode] = useState<TagNode>(null);
  const [forceUpdate, setForceUpdate] = useState<number>(Date.now());

  const updateNote = useCallback(
    (note: Note, markdown: string, password: string = "") => {
      vscode.postMessage({
        action: MessageAction.UpdateNote,
        data: {
          note,
          markdown,
          password,
        },
      });
    },
    []
  );

  const closeFilePathDialog = useCallback(() => {
    if (!note) {
      return;
    }
    setFilePathDialogOpen(false);
  }, [note]);

  const closeEncryptionDialog = useCallback(() => {
    setToggleEncryptionPassword("");
    setToggleEncryptionDialogOpen(false);
  }, []);

  const closeDecryptionDialog = useCallback(() => {
    setDecryptionPassword("");
    setDecryptionDialogOpen(false);
  }, []);

  const togglePin = useCallback(() => {
    if (note && editor && isDecrypted) {
      note.config.pinned = !note.config.pinned;
      if (!note.config.pinned) {
        delete note.config.pinned;
      }
      updateNote(
        note,
        editor.getValue(),
        note.config.encryption ? decryptionPassword : ""
      );
      setForceUpdate(Date.now());
    }
  }, [note, editor, decryptionPassword, isDecrypted]);

  const addTag = useCallback(
    (tagName: string) => {
      let tag = tagName.trim() || "";
      if (!note || !tag.length || !editor || !isDecrypted) {
        return;
      }
      tag = tag
        .replace(/\s+/g, " ")
        .replace(TagStopRegExp, "")
        .split("/")
        .map((t) => t.trim())
        .filter((x) => x.length > 0)
        .join("/");
      if (!tag.length) {
        return;
      }
      setTagNames((tagNames) => {
        const newTagNames =
          tagNames.indexOf(tag) >= 0 ? [...tagNames] : [tag, ...tagNames];
        note.config.tags = newTagNames.sort((x, y) => x.localeCompare(y));
        updateNote(
          note,
          editor.getValue(),
          note.config.encryption ? decryptionPassword : ""
        );
        // crossnoteContainer.updateNotebookTagNode();
        return newTagNames;
      });
    },
    [note, editor, decryptionPassword, isDecrypted]
  );

  const deleteTag = useCallback(
    (tagName: string) => {
      if (note && editor && isDecrypted) {
        setTagNames((tagNames) => {
          const newTagNames = tagNames.filter((t) => t !== tagName);
          note.config.tags = newTagNames.sort((x, y) => x.localeCompare(y));
          updateNote(
            note,
            editor.getValue(),
            note.config.encryption ? decryptionPassword : ""
          );
          // crossnoteContainer.updateNotebookTagNode();
          return newTagNames;
        });
      }
    },
    [note, editor, decryptionPassword, isDecrypted]
  );

  const toggleEncryption = useCallback(() => {
    if (!note || !editor) {
      return;
    }
    const markdown = editor.getValue();
    if (note.config.encryption) {
      // Disable encryption
      // Check if the password is correct
      try {
        const bytes = CryptoJS.AES.decrypt(
          note.markdown.trim(),
          toggleEncryptionPassword
        );
        const json = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        // Disable encryption
        note.config.encryption = null;
        delete note.config.encryption;
        updateNote(note, json.markdown, "");
        setDecryptionPassword("");
        setIsDecrypted(true);
        closeEncryptionDialog();
        // editor.setValue(json.markdown);
        editor.setOption("readOnly", false);
      } catch (error) {
        new Noty({
          type: "error",
          text: t("error/failed-to-disable-encryption"),
          layout: "topRight",
          theme: "relax",
          timeout: 5000,
        }).show();
      }
    } else {
      // Enable encryption
      note.config.encryption = {
        title: getHeaderFromMarkdown(markdown),
      };
      updateNote(note, editor.getValue(), toggleEncryptionPassword);
      setDecryptionPassword(toggleEncryptionPassword);
      setIsDecrypted(true);
      closeEncryptionDialog();
    }
  }, [note, editor, closeEncryptionDialog, toggleEncryptionPassword]);

  const decryptNote = useCallback(() => {
    if (!note || !editor) {
      return;
    }

    // Decrypt
    try {
      const bytes = CryptoJS.AES.decrypt(
        note.markdown.trim(),
        decryptionPassword
      );
      const json = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      editor.setOption("readOnly", false);
      editor.setValue(json.markdown);
      setIsDecrypted(true);
      setDecryptionDialogOpen(false); // Don't clear decryptionPassword

      if (json.markdown.length === 0) {
        setEditorMode(EditorMode.VickyMD);
      } else {
        setEditorMode(EditorMode.Preview);
      }
    } catch (error) {
      new Noty({
        type: "error",
        text: t("error/decryption-failed"),
        layout: "topRight",
        theme: "relax",
        timeout: 5000,
      }).show();
      setIsDecrypted(false);
    }
  }, [note, editor, decryptionPassword, closeDecryptionDialog]);

  const duplicateNote = useCallback(() => {
    if (!note) {
      return;
    }
    const message: Message = {
      action: MessageAction.DuplicateNote,
      data: note,
    };
    vscode.postMessage(message);
  }, [note]);

  const postprocessPreview = useCallback(
    (previewElement: HTMLElement) => {
      previewPostprocessPreview(previewElement, note, (flag) => {
        setPreviewIsPresentation(flag);
      });
    },
    [note]
  );
  useEffect(() => {
    const message: Message = {
      action: MessageAction.InitializedEditorPanelWebview,
      data: {},
    };
    vscode.postMessage(message);

    return () => {
      setEditor(null);
      setTextAreaElement(null);
      setPreviewElement(null);
    };
  }, []);

  useEffect(() => {
    const onMessage = (event) => {
      const message: Message = event.data;
      switch (message.action) {
        case MessageAction.SendNote:
          setNote(message.data);
          break;
        case MessageAction.UpdatedNote:
          setNote(message.data);
          break;
        case MessageAction.SendNotebookTagNode:
          setNotebookTagNode(message.data);
        default:
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (textAreaElement && !editor) {
      // console.log("textarea element mounted");
      const editor: CodeMirrorEditor = VickyMD.fromTextArea(textAreaElement, {
        mode: {
          name: "hypermd",
          hashtag: true,
        },
        hmdFold: HMDFold,
        keyMap: crossnoteSettings.keyMap,
        showCursorWhenSelecting: true,
        inputStyle: "contenteditable",
        hmdClick: (info: any, cm: CodeMirrorEditor) => {
          let { text, url } = info;
          if (info.type === "link" || info.type === "url") {
            const footnoteRef = text.match(/\[[^[\]]+\](?:\[\])?$/); // bare link, footref or [foot][] . assume no escaping char inside
            if (!footnoteRef && (info.ctrlKey || info.altKey) && url) {
              // just open URL
              openURL(url, note);
              return false; // Prevent default click event
            }
          }
        },
      });
      editor.setOption("lineNumbers", false);
      editor.setOption("foldGutter", false);
      editor.setValue("");
      editor.on("cursorActivity", (instance) => {
        const cursor = instance.getCursor();
        if (cursor) {
          setCursorPosition({
            line: cursor.line,
            ch: cursor.ch,
          });
        }
      });
      setEditor(editor);
      initMathPreview(editor);
    }
  }, [textAreaElement, editor]);

  useEffect(() => {
    if (editor) {
      setTheme({
        editor,
        themeName: selectedTheme.name,
        baseUri:
          extensionPath +
          (extensionPath.endsWith("/") ? "" : "/") +
          "node_modules/vickymd/theme/",
      });
    }
  }, [editor]);

  // Initialize cursor color
  useEffect(() => {
    const styleID = "codemirror-cursor-style";
    let style = document.getElementById(styleID);
    if (!style) {
      style = document.createElement("style");
      style.id = styleID;
      document.body.appendChild(style);
    }
    style.innerText = `
    .CodeMirror-cursor.CodeMirror-cursor {
      border-left: 2px solid rgba(74, 144, 226, 1);
    }    
    `;
  }, []);

  /*
  useEffect(() => {
    if (note && editor) {
      editor.setValue(note.markdown);
      editor.refresh();
    }
  }, [note, editor]);
  */

  // Decryption
  useEffect(() => {
    if (!editor || !note) {
      return;
    }
    if (note.config.encryption) {
      setIsDecrypted(false);
      setDecryptionPassword("");
      editor.setOption("readOnly", true);
      editor.setValue(`🔐 ${t("general/encrypted")}`);
      setDecryptionDialogOpen(true);
    } else {
      setIsDecrypted(true);
      setDecryptionPassword("");
      editor.setOption("readOnly", false);
      editor.setValue(note.markdown);
      setDecryptionDialogOpen(false);

      if (note.markdown.length === 0) {
        setEditorMode(EditorMode.VickyMD);
      } else {
        setEditorMode(EditorMode.Preview);
      }
    }
  }, [editor, note]);

  useEffect(() => {
    if (!editor || !note) {
      return;
    }
    setTagNames(note.config.tags || []);
    const changesHandler = () => {
      if (editor.getOption("readOnly") || !isDecrypted) {
        // This line is necessary for decryption...
        return;
      }
      const markdown = editor.getValue();

      if (!note.config.encryption && markdown === note.markdown) {
        return;
      }
      updateNote(
        note,
        markdown,
        note.config.encryption ? decryptionPassword : ""
      );
      setTagNames(note.config.tags || []); // After resolve conflicts
    };
    editor.on("changes", changesHandler);

    const keyupHandler = () => {
      if (!isDecrypted && note.config.encryption) {
        setDecryptionDialogOpen(true);
      }
    };
    editor.on("keyup", keyupHandler);

    const imageClickedHandler = (args: any) => {
      const marker: TextMarker = args.marker;
      const imageElement: HTMLImageElement = args.element;
      imageElement.setAttribute(
        "data-marker-position",
        JSON.stringify(marker.find())
      );
      setEditImageElement(imageElement);
      setEditImageTextMarker(marker);
      setEditImageDialogOpen(true);
    };
    editor.on("imageClicked", imageClickedHandler);

    const loadImage = (args: any) => {
      const element = args.element;
      const imageSrc = element.getAttribute("data-src");
      element.setAttribute("src", resolveNoteImageSrc(note, imageSrc));
    };
    editor.on("imageReadyToLoad", loadImage);

    return () => {
      editor.off("changes", changesHandler);
      editor.off("keyup", keyupHandler);
      editor.off("imageClicked", imageClickedHandler);
      editor.off("imageReadyToLoad", loadImage);
    };
  }, [editor, note, decryptionPassword, isDecrypted]);

  useEffect(() => {
    if (!editor || !note) {
      return;
    }
    if (editorMode === EditorMode.VickyMD) {
      VickyMD.switchToHyperMD(editor);
      // @ts-ignore
      editor.setOption("hmdFold", HMDFold);
      editor.getWrapperElement().style.display = "block";
      editor.refresh();
    } else if (editorMode === EditorMode.SourceCode) {
      VickyMD.switchToNormal(editor);
      editor.getWrapperElement().style.display = "block";
      editor.refresh();
    } else if (editorMode === EditorMode.Preview) {
      editor.getWrapperElement().style.display = "none";
    } else if (editorMode === EditorMode.SplitView) {
      VickyMD.switchToNormal(editor);
      editor.getWrapperElement().style.display = "block";
      editor.refresh();
    }
  }, [editorMode, editor, note, isDecrypted]);

  // Render Preview
  useEffect(() => {
    if (
      (editorMode === EditorMode.Preview ||
        editorMode === EditorMode.SplitView) &&
      editor &&
      note &&
      previewElement
    ) {
      if (isDecrypted) {
        try {
          renderPreview(previewElement, editor.getValue());
          postprocessPreview(previewElement);
          previewElement.scrollTop = 0;
        } catch (error) {
          previewElement.innerText = error;
        }
      } else {
        previewElement.innerHTML = `🔐 ${t("general/encrypted")}`;
        const clickHandler = () => {
          setDecryptionDialogOpen(true);
        };
        previewElement.addEventListener("click", clickHandler);
        return () => {
          previewElement.removeEventListener("click", clickHandler);
        };
      }
    }
  }, [
    editorMode,
    editor,
    previewElement,
    note,
    isDecrypted,
    postprocessPreview,
    t,
  ]);

  // Command
  useEffect(() => {
    if (!editor || !note) {
      return;
    }

    const onChangeHandler = (
      instance: CodeMirrorEditor,
      changeObject: EditorChangeLinkedList
    ) => {
      // Check commands
      if (changeObject.text.length === 1 && changeObject.text[0] === "/") {
        const aheadStr = editor
          .getLine(changeObject.from.line)
          .slice(0, changeObject.from.ch + 1);
        if (!aheadStr.match(/#[^\s]+?\/$/)) {
          // Not `/` inside a tag
          // @ts-ignore
          editor.showHint({
            closeOnUnfocus: false,
            completeSingle: false,
            hint: () => {
              const cursor = editor.getCursor();
              const token = editor.getTokenAt(cursor);
              const line = cursor.line;
              const lineStr = editor.getLine(line);
              const end: number = cursor.ch;
              let start = token.start;
              if (lineStr[start] !== "/") {
                start = start - 1;
              }
              const currentWord: string = lineStr
                .slice(start, end)
                .replace(/^\//, "");

              const render = (
                element: HTMLElement,
                data: CommandHint[],
                cur: CommandHint
              ) => {
                const wrapper = document.createElement("div");
                wrapper.style.padding = "6px 0";
                wrapper.style.display = "flex";
                wrapper.style.flexDirection = "row";
                wrapper.style.alignItems = "flex-start";
                wrapper.style.maxWidth = "100%";
                wrapper.style.minWidth = "200px";

                const leftPanel = document.createElement("div");
                const iconWrapper = document.createElement("div");
                iconWrapper.style.padding = "0 6px";
                iconWrapper.style.marginRight = "6px";
                iconWrapper.style.fontSize = "1rem";

                const iconElement = document.createElement("span");
                iconElement.classList.add("mdi");
                iconElement.classList.add(
                  cur.icon || "mdi-help-circle-outline"
                );
                iconWrapper.appendChild(iconElement);
                leftPanel.appendChild(iconWrapper);

                const rightPanel = document.createElement("div");

                const descriptionElement = document.createElement("p");
                descriptionElement.innerText = cur.description;
                descriptionElement.style.margin = "2px 0";
                descriptionElement.style.padding = "0";

                const commandElement = document.createElement("p");
                commandElement.innerText = cur.command;
                commandElement.style.margin = "0";
                commandElement.style.padding = "0";
                commandElement.style.fontSize = "0.7rem";

                rightPanel.appendChild(descriptionElement);
                rightPanel.appendChild(commandElement);

                wrapper.appendChild(leftPanel);
                wrapper.appendChild(rightPanel);
                element.appendChild(wrapper);
              };

              const commands: CommandHint[] = [
                {
                  text: "# ",
                  command: "/h1",
                  description: t("editor/toolbar/insert-header-1"),
                  icon: "mdi-format-header-1",
                  render,
                },
                {
                  text: "## ",
                  command: "/h2",
                  description: t("editor/toolbar/insert-header-2"),
                  icon: "mdi-format-header-2",
                  render,
                },
                {
                  text: "### ",
                  command: "/h3",
                  description: t("editor/toolbar/insert-header-3"),
                  icon: "mdi-format-header-3",
                  render,
                },
                {
                  text: "#### ",
                  command: "/h4",
                  description: t("editor/toolbar/insert-header-4"),
                  icon: "mdi-format-header-4",
                  render,
                },
                {
                  text: "##### ",
                  command: "/h5",
                  description: t("editor/toolbar/insert-header-5"),
                  icon: "mdi-format-header-5",
                  render,
                },
                {
                  text: "###### ",
                  command: "/h6",
                  description: t("editor/toolbar/insert-header-6"),
                  icon: "mdi-format-header-6",
                  render,
                },
                {
                  text: "> ",
                  command: "/blockquote",
                  description: t("editor/toolbar/insert-blockquote"),
                  icon: "mdi-format-quote-open",
                  render,
                },
                {
                  text: "* ",
                  command: "/ul",
                  description: t("editor/toolbar/insert-unordered-list"),
                  icon: "mdi-format-list-bulleted",
                  render,
                },
                {
                  text: "1. ",
                  command: "/ol",
                  description: t("editor/toolbar/insert-ordered-list"),
                  icon: "mdi-format-list-numbered",
                  render,
                },
                {
                  text: "<!-- @crossnote.image -->\n",
                  command: "/image",
                  description: t("editor/toolbar/insert-image"),
                  icon: "mdi-image",
                  render,
                },
                {
                  text: `|   |   |
  |---|---|
  |   |   |
  `,
                  command: "/table",
                  description: t("editor/toolbar/insert-table"),
                  icon: "mdi-table",
                  render,
                },
                {
                  text:
                    "<!-- @timer " +
                    JSON.stringify({ date: new Date().toString() })
                      .replace(/^{/, "")
                      .replace(/}$/, "") +
                    " -->\n",
                  command: "/timer",
                  description: t("editor/toolbar/insert-clock"),
                  icon: "mdi-timer",
                  render,
                },
                {
                  text: "<!-- @crossnote.audio -->  \n",
                  command: "/audio",
                  description: t("editor/toolbar/insert-audio"),
                  icon: "mdi-music",
                  render,
                },
                /*
                  {
                    text: "<!-- @crossnote.netease_music -->  \n",
                    displayText: `/netease - ${t(
                      "editor/toolbar/netease-music",
                    )}`,
                  },
                  */
                {
                  text: "<!-- @crossnote.video -->  \n",
                  command: "/video",
                  description: t("editor/toolbar/insert-video"),
                  icon: "mdi-video",
                  render,
                },
                {
                  text: "<!-- @crossnote.youtube -->  \n",
                  command: "/youtube",
                  description: t("editor/toolbar/insert-youtube"),
                  icon: "mdi-youtube",
                  render,
                },
                {
                  text: "<!-- @crossnote.bilibili -->  \n",
                  command: "/bilibili",
                  description: t("editor/toolbar/insert-bilibili"),
                  icon: "mdi-television-classic",
                  render,
                },
                {
                  text: "<!-- slide -->  \n",
                  command: "/slide",
                  description: t("editor/toolbar/insert-slide"),
                  icon: "mdi-presentation",
                  render,
                },
                {
                  text: "<!-- @crossnote.ocr -->  \n",
                  command: "/ocr",
                  description: t("editor/toolbar/insert-ocr"),
                  icon: "mdi-ocr",
                  render,
                },
                {
                  text:
                    '<!-- @crossnote.kanban "v":2,"board":{"columns":[]} -->  \n',
                  command: "/kanban",
                  description: `${t("editor/toolbar/insert-kanban")} (beta)`,
                  icon: "mdi-developer-board",
                  render,
                },
                /*
                  {
                    text: "<!-- @crossnote.abc -->  \n",
                    displayText: `/abc - ${t(
                      "editor/toolbar/insert-abc-notation",
                    )}`,
                  },
                  */
                {
                  text: "<!-- @crossnote.github_gist -->  \n",
                  command: "/github_gist",
                  description: t("editor/toolbar/insert-github-gist"),
                  icon: "mdi-github",
                  render,
                },
                /*
                {
                  text: "<!-- @crossnote.comment -->  \n",
                  command: "/crossnote.comment",
                  description: t("editor/toolbar/insert-comment"),
                  icon: "mdi-comment-multiple",
                  render,
                },
                */
              ];
              const filtered = commands.filter(
                (item) =>
                  (item.command + item.description)
                    .toLocaleLowerCase()
                    .indexOf(currentWord.toLowerCase()) >= 0
              );
              return {
                list: filtered.length ? filtered : commands,
                from: { line, ch: start },
                to: { line, ch: end },
              };
            },
          });
        }
      }

      // Check emoji
      if (
        changeObject.text.length === 1 &&
        changeObject.text[0].length > 0 &&
        changeObject.text[0] !== " " &&
        changeObject.text[0] !== ":" &&
        changeObject.from.ch > 0 &&
        editor.getLine(changeObject.from.line)[changeObject.from.ch - 1] === ":"
      ) {
        // @ts-ignore
        editor.showHint({
          closeOnUnfocus: true,
          completeSingle: false,
          hint: () => {
            const cursor = editor.getCursor();
            const token = editor.getTokenAt(cursor);
            const line = cursor.line;
            const lineStr = editor.getLine(line);
            const end: number = cursor.ch;
            let start = token.start;
            let doubleSemiColon = false;
            if (lineStr[start] !== ":") {
              start = start - 1;
            }
            if (start > 0 && lineStr[start - 1] === ":") {
              start = start - 1;
              doubleSemiColon = true;
            }
            const currentWord: string = lineStr
              .slice(start, end)
              .replace(/^:+/, "");

            const commands: { text: string; displayText: string }[] = [];
            for (const def in EmojiDefinitions) {
              const emoji = EmojiDefinitions[def];
              commands.push({
                text: doubleSemiColon ? `:${def}: ` : `${emoji} `,
                displayText: `:${def}: ${emoji}`,
              });
            }
            const filtered = commands.filter(
              (item) =>
                item.displayText
                  .toLocaleLowerCase()
                  .indexOf(currentWord.toLowerCase()) >= 0
            );
            return {
              list: filtered.length ? filtered : commands,
              from: { line, ch: start },
              to: { line, ch: end },
            };
          },
        });
      }

      // Check tag
      if (
        changeObject.text.length === 1 &&
        changeObject.text[0] !== " " &&
        changeObject.from.ch > 0 &&
        editor.getLine(changeObject.from.line)[changeObject.from.ch - 1] === "#"
      ) {
        // @ts-ignore
        editor.showHint({
          closeOnUnfocus: true,
          completeSingle: false,
          hint: () => {
            const cursor = editor.getCursor();
            const token = editor.getTokenAt(cursor);
            const line = cursor.line;
            const lineStr = editor.getLine(line);
            const end: number = cursor.ch;
            let start = token.start;
            if (lineStr[start] !== "#") {
              start = start - 1;
            }
            const currentWord: string = lineStr
              .slice(start, end)
              .replace(TagStopRegExp, "");
            const commands: { text: string; displayText: string }[] = [];
            if (currentWord.trim().length > 0) {
              commands.push({
                text: `#${currentWord} `,
                displayText: `+ #${currentWord}`,
              });
            }
            const helper = (children: TagNode[]) => {
              if (!children || !children.length) {
                return;
              }
              for (let i = 0; i < children.length; i++) {
                const tag = children[i].path;
                commands.push({
                  text: `#${tag} `,
                  displayText: `+ #${tag}`,
                });
                helper(children[i].children);
              }
            };
            helper(notebookTagNode?.children || []);
            const filtered = commands.filter(
              (item) => item.text.toLocaleLowerCase().indexOf(currentWord) >= 0
            );

            return {
              list: filtered.length ? filtered : commands,
              from: { line, ch: start },
              to: { line, ch: end },
            };
          },
        });
      }

      // Timer
      if (
        changeObject.text.length > 0 &&
        changeObject.text[0].startsWith("<!-- @timer ") &&
        changeObject.removed.length > 0 &&
        changeObject.removed[0].startsWith("/")
      ) {
        // Calcuate date time
        const lines = editor.getValue().split("\n");
        const timerTexts: TimerText[] = [];
        for (let i = 0; i < lines.length; i++) {
          const match = lines[i].match(/^`@timer\s.+`/);
          if (match) {
            const text = match[0];
            const dataMatch = text.match(/^`@timer\s+(.+)`/);
            if (!dataMatch || !dataMatch.length) {
              continue;
            }
            const dataStr = dataMatch[1];
            try {
              const data = JSON.parse(`{${dataStr}}`);
              const datetime = data["date"];
              if (datetime) {
                timerTexts.push({
                  text: text,
                  line: i,
                  date: new Date(datetime),
                });
              }
            } catch (error) {
              continue;
            }
          }
        }
        for (let i = 1; i < timerTexts.length; i++) {
          const currentTimerText = timerTexts[i];
          const previousTimerText = timerTexts[i - 1];
          const duration = formatDistance(
            currentTimerText.date,
            previousTimerText.date,
            { includeSeconds: true }
          );
          const newText = `\`@timer ${JSON.stringify({
            date: currentTimerText.date.toString(),
            duration,
          })
            .replace(/^{/, "")
            .replace(/}$/, "")}\``;
          editor.replaceRange(
            newText,
            { line: currentTimerText.line, ch: 0 },
            { line: currentTimerText.line, ch: currentTimerText.text.length }
          );
        }
      }

      // Add Tag
      if (
        changeObject.origin === "complete" &&
        changeObject.removed[0] &&
        changeObject.removed[0].match(/^#[^\s]/) &&
        changeObject.text[0] &&
        changeObject.text[0].match(/^#[^\s]/)
      ) {
        addTag(changeObject.text[0].replace(/^#/, ""));
      }
    };
    editor.on("change", onChangeHandler);

    const onCursorActivityHandler = (instance: CodeMirrorEditor) => {
      // console.log("cursorActivity", editor.getCursor());
      // console.log("selection: ", editor.getSelection());
      return;
    };
    editor.on("cursorActivity", onCursorActivityHandler);

    return () => {
      editor.off("change", onChangeHandler);
      editor.off("cursorActivity", onCursorActivityHandler);
    };
  }, [editor, note, notebookTagNode, addTag /*t*/]);

  // Split view
  useEffect(() => {
    if (
      !editor ||
      !note ||
      !previewElement ||
      editorMode !== EditorMode.SplitView
    ) {
      return;
    }
    let onChangeCallback: any = null;
    let onCursorActivityCallback: any = null;
    let onScrollCallback: any = null;
    let onWindowResizeCallback: any = null;
    let scrollMap: any = null;
    let scrollTimeout: NodeJS.Timeout = null;
    let previewScrollDelay = Date.now();
    let editorScrollDelay = Date.now();
    let currentLine: number = -1;
    let editorClientWidth = editor.getScrollInfo().clientWidth;
    let editorClientHeight = editor.getScrollInfo().clientHeight;
    let lastCursorPosition: Position = null;

    const totalLineCount = editor.lineCount();
    const buildScrollMap = () => {
      if (!totalLineCount) {
        return null;
      }
      const scrollMap = [];
      const nonEmptyList = [];

      for (let i = 0; i < totalLineCount; i++) {
        scrollMap.push(-1);
      }

      nonEmptyList.push(0);
      scrollMap[0] = 0;

      // write down the offsetTop of element that has 'data-line' property to scrollMap
      const lineElements = previewElement.getElementsByClassName("sync-line");

      for (let i = 0; i < lineElements.length; i++) {
        let el = lineElements[i] as HTMLElement;
        let t: any = el.getAttribute("data-line");
        if (!t) {
          continue;
        }

        t = parseInt(t, 10);
        if (!t) {
          continue;
        }

        // this is for ignoring footnote scroll match
        if (t < nonEmptyList[nonEmptyList.length - 1]) {
          el.removeAttribute("data-line");
        } else {
          nonEmptyList.push(t);

          let offsetTop = 0;
          while (el && el !== previewElement) {
            offsetTop += el.offsetTop;
            el = el.offsetParent as HTMLElement;
          }

          scrollMap[t] = Math.round(offsetTop);
        }
      }

      nonEmptyList.push(totalLineCount);
      scrollMap.push(previewElement.scrollHeight);

      let pos = 0;
      for (let i = 0; i < totalLineCount; i++) {
        if (scrollMap[i] !== -1) {
          pos++;
          continue;
        }

        const a = nonEmptyList[pos - 1];
        const b = nonEmptyList[pos];
        scrollMap[i] = Math.round(
          (scrollMap[b] * (i - a) + scrollMap[a] * (b - i)) / (b - a)
        );
      }

      return scrollMap; // scrollMap's length == screenLineCount (vscode can't get screenLineCount... sad)
    };
    const scrollToPos = (scrollTop: number) => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }

      if (scrollTop < 0) {
        return;
      }

      const delay = 10;

      const helper = (duration = 0) => {
        scrollTimeout = setTimeout(() => {
          if (duration <= 0) {
            previewScrollDelay = Date.now() + 500;
            previewElement.scrollTop = scrollTop;
            return;
          }

          const difference = scrollTop - previewElement.scrollTop;

          const perTick = (difference / duration) * delay;

          // disable preview onscroll
          previewScrollDelay = Date.now() + 500;

          previewElement.scrollTop += perTick;
          if (previewElement.scrollTop === scrollTop) {
            return;
          }

          helper(duration - delay);
        }, delay);
      };

      const scrollDuration = 120;
      helper(scrollDuration);
    };
    const scrollToRevealSourceLine = (line: number, topRatio = 0.372) => {
      if (line === currentLine) {
        return;
      } else {
        currentLine = line;
      }

      // disable preview onscroll
      previewScrollDelay = Date.now() + 500;

      /*
        if (presentationMode) {
          scrollSyncToSlide(line);
        } else {
          scrollSyncToLine(line, topRatio);
        }
        */
      scrollSyncToLine(line, topRatio);
    };
    const scrollSyncToLine = (line: number, topRatio: number = 0.372) => {
      if (!scrollMap) {
        scrollMap = buildScrollMap();
      }
      if (!scrollMap || line >= scrollMap.length) {
        return;
      }

      if (line + 1 === totalLineCount) {
        // last line
        scrollToPos(previewElement.scrollHeight);
      } else {
        /**
         * Since I am not able to access the viewport of the editor
         * I used `golden section` (0.372) here for scrollTop.
         */
        scrollToPos(
          Math.max(scrollMap[line] - previewElement.offsetHeight * topRatio, 0)
        );
      }
    };
    const revealEditorLine = (line: number) => {
      const scrollInfo = editor.getScrollInfo();
      editor.scrollIntoView({ line: line, ch: 0 }, scrollInfo.clientHeight / 2);
      editorScrollDelay = Date.now() + 500;
      if (
        scrollInfo.clientHeight !== editorClientHeight ||
        scrollInfo.clientWidth !== editorClientWidth
      ) {
        editorClientHeight = scrollInfo.clientHeight;
        editorClientWidth = scrollInfo.clientWidth;
        scrollMap = null;
      }
    };
    const previewSyncSource = () => {
      let scrollToLine;

      if (previewElement.scrollTop === 0) {
        // editorScrollDelay = Date.now() + 100
        scrollToLine = 0;

        revealEditorLine(scrollToLine);
        return;
      }

      const top = previewElement.scrollTop + previewElement.offsetHeight / 2;

      // try to find corresponding screen buffer row
      if (!scrollMap) {
        scrollMap = buildScrollMap();
      }

      let i = 0;
      let j = scrollMap.length - 1;
      let count = 0;
      let screenRow = -1; // the screenRow is the bufferRow in vscode.
      let mid;

      while (count < 20) {
        if (Math.abs(top - scrollMap[i]) < 20) {
          screenRow = i;
          break;
        } else if (Math.abs(top - scrollMap[j]) < 20) {
          screenRow = j;
          break;
        } else {
          mid = Math.floor((i + j) / 2);
          if (top > scrollMap[mid]) {
            i = mid;
          } else {
            j = mid;
          }
        }
        count++;
      }

      if (screenRow === -1) {
        screenRow = mid;
      }

      scrollToLine = screenRow;
      revealEditorLine(scrollToLine);
      // @scrollToPos(screenRow * @editor.getLineHeightInPixels() - @previewElement.offsetHeight / 2, @editor.getElement())
      // # @editor.getElement().setScrollTop

      // track currnet time to disable onDidChangeScrollTop
      // editorScrollDelay = Date.now() + 100
    };

    onChangeCallback = () => {
      try {
        const markdown = editor.getValue();
        setTimeout(() => {
          const newMarkdown = editor.getValue();
          if (markdown === newMarkdown) {
            renderPreview(previewElement, newMarkdown);
            postprocessPreview(previewElement);
          }
        }, 300);
      } catch (error) {
        previewElement.innerText = error;
      }
      // Reset scrollMap
      scrollMap = null;
    };
    onCursorActivityCallback = () => {
      const cursor = editor.getCursor();
      const scrollInfo = editor.getScrollInfo();
      const firstLine = editor.lineAtHeight(scrollInfo.top, "local");
      const lastLine = editor.lineAtHeight(
        scrollInfo.top + scrollInfo.clientHeight,
        "local"
      );
      if (!lastCursorPosition || lastCursorPosition.line !== cursor.line) {
        scrollSyncToLine(
          cursor.line,
          (cursor.line - firstLine) / (lastLine - firstLine)
        );
      }
      lastCursorPosition = cursor;
    };
    onScrollCallback = () => {
      // console.log("scroll editor: ", editor.getScrollInfo());
      // console.log("viewport: ", editor.getViewport());
      const scrollInfo = editor.getScrollInfo();
      if (
        scrollInfo.clientHeight !== editorClientHeight ||
        scrollInfo.clientWidth !== editorClientWidth
      ) {
        editorClientHeight = scrollInfo.clientHeight;
        editorClientWidth = scrollInfo.clientWidth;
        scrollMap = null;
      }

      if (Date.now() < editorScrollDelay) {
        return;
      }
      const topLine = editor.lineAtHeight(scrollInfo.top, "local");
      const bottomLine = editor.lineAtHeight(
        scrollInfo.top + scrollInfo.clientHeight,
        "local"
      );
      let midLine;
      if (topLine === 0) {
        midLine = 0;
      } else if (bottomLine === totalLineCount - 1) {
        midLine = bottomLine;
      } else {
        midLine = Math.floor((topLine + bottomLine) / 2);
      }
      scrollSyncToLine(midLine);
    };
    onWindowResizeCallback = () => {
      const scrollInfo = editor.getScrollInfo();
      editorClientHeight = scrollInfo.clientHeight;
      editorClientWidth = scrollInfo.clientWidth;
      scrollMap = null;
    };

    editor.on("changes", onChangeCallback);
    onChangeCallback();

    editor.on("cursorActivity", onCursorActivityCallback);
    editor.on("scroll", onScrollCallback);
    previewElement.onscroll = () => {
      // console.log("scroll preview: ", previewElement.scrollTop);
      if (Date.now() < previewScrollDelay) {
        return;
      }
      previewSyncSource();
    };
    window.addEventListener("resize", onWindowResizeCallback);

    return () => {
      if (onChangeCallback) {
        editor.off("changes", onChangeCallback);
      }
      if (onCursorActivityCallback) {
        editor.off("cursorActivity", onCursorActivityCallback);
      }
      if (onScrollCallback) {
        editor.off("scroll", onScrollCallback);
      }
      if (onWindowResizeCallback) {
        window.removeEventListener("resize", onWindowResizeCallback);
      }
    };
  }, [editor, note, previewElement, editorMode, postprocessPreview]);

  if (!note) {
    return (
      <Box className={clsx(classes.editorPanel, "editor-panel")}>
        <Box
          style={{
            margin: "0 auto",
            top: "50%",
            position: "relative",
          }}
        >
          <Typography>{`📝 ${t("general/no-notes-found")}`}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={clsx(classes.editorPanel)}>
      <Box className={clsx(classes.topPanel)}>
        <Box className={clsx(classes.row)}>
          <ButtonGroup
            variant={"outlined"}
            color="default"
            aria-label="editor mode"
          >
            <Tooltip title={t("general/vickymd")}>
              <Button
                className={clsx(
                  classes.controlBtn,
                  editorMode === EditorMode.VickyMD &&
                    classes.controlBtnSelected
                )}
                color={
                  editorMode === EditorMode.VickyMD ? "primary" : "default"
                }
                onClick={() => setEditorMode(EditorMode.VickyMD)}
              >
                <Pencil></Pencil>
              </Button>
            </Tooltip>
            <Tooltip title={t("editor/note-control/source-code")}>
              <Button
                className={clsx(
                  classes.controlBtn,
                  editorMode === EditorMode.SourceCode &&
                    classes.controlBtnSelected
                )}
                color={
                  editorMode === EditorMode.SourceCode ? "primary" : "default"
                }
                onClick={() => setEditorMode(EditorMode.SourceCode)}
              >
                <CodeTags></CodeTags>
              </Button>
            </Tooltip>
            <Tooltip title={t("editor/note-control/split-view")}>
              <Button
                className={clsx(
                  classes.controlBtn,
                  editorMode === EditorMode.SplitView &&
                    classes.controlBtnSelected
                )}
                color={
                  editorMode === EditorMode.SplitView ? "primary" : "default"
                }
                onClick={() => setEditorMode(EditorMode.SplitView)}
              >
                <ViewSplitVertical></ViewSplitVertical>
              </Button>
            </Tooltip>
            <Tooltip title={t("editor/note-control/preview")}>
              <Button
                className={clsx(
                  classes.controlBtn,
                  editorMode === EditorMode.Preview &&
                    classes.controlBtnSelected
                )}
                color={
                  editorMode === EditorMode.Preview ? "primary" : "default"
                }
                onClick={() => setEditorMode(EditorMode.Preview)}
              >
                <FilePresentationBox></FilePresentationBox>
              </Button>
            </Tooltip>
          </ButtonGroup>
          <ButtonGroup style={{ marginLeft: "8px" }}>
            {isDecrypted && note && (
              <Tooltip title={t("general/tags")}>
                <Button
                  className={clsx(
                    classes.controlBtn,
                    note.config.tags &&
                      note.config.tags.length > 0 &&
                      classes.controlBtnSelectedSecondary
                  )}
                  onClick={(event) => setTagsMenuAnchorEl(event.currentTarget)}
                >
                  {note.config.tags && note.config.tags.length > 0 ? (
                    <Tag></Tag>
                  ) : (
                    <TagOutline></TagOutline>
                  )}
                </Button>
              </Tooltip>
            )}
            {isDecrypted && note && (
              <Tooltip title={t("general/Pin")}>
                <Button
                  className={clsx(
                    classes.controlBtn,
                    note.config.pinned && classes.controlBtnSelectedSecondary
                  )}
                  onClick={togglePin}
                >
                  {note.config.pinned ? <Pin></Pin> : <PinOutline></PinOutline>}
                </Button>
              </Tooltip>
            )}
            {note && (
              <Tooltip title={t("general/Encryption")}>
                <Button
                  className={clsx(
                    classes.controlBtn,
                    note.config.encryption &&
                      classes.controlBtnSelectedSecondary
                  )}
                  onClick={() => setToggleEncryptionDialogOpen(true)}
                >
                  {note.config.encryption ? (
                    <Lock></Lock>
                  ) : (
                    <LockOpenOutline></LockOpenOutline>
                  )}
                </Button>
              </Tooltip>
            )}
          </ButtonGroup>
          <ButtonGroup style={{ marginLeft: "8px" }}>
            <Tooltip title={t("general/change-file-path")}>
              <Button
                className={clsx(classes.controlBtn)}
                onClick={() => setFilePathDialogOpen(true)}
              >
                <RenameBox></RenameBox>
              </Button>
            </Tooltip>
            <Tooltip title={t("general/Delete")}>
              <Button
                className={clsx(classes.controlBtn)}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Delete></Delete>
              </Button>
            </Tooltip>
            {note && !note.config.encryption && (
              <Tooltip title={t("general/create-a-copy")}>
                <Button
                  className={clsx(classes.controlBtn)}
                  onClick={duplicateNote}
                >
                  <ContentDuplicate></ContentDuplicate>
                </Button>
              </Tooltip>
            )}
          </ButtonGroup>
          <TagsMenuPopover
            anchorElement={tagsMenuAnchorEl}
            onClose={() => setTagsMenuAnchorEl(null)}
            addTag={addTag}
            deleteTag={deleteTag}
            tagNames={tagNames}
            notebookTagNode={notebookTagNode}
          ></TagsMenuPopover>
        </Box>
      </Box>
      <Box
        className={clsx(
          classes.editorWrapper,
          editorMode === EditorMode.SplitView ? classes.splitView : null
        )}
      >
        <textarea
          className={clsx(classes.editor, "editor-textarea")}
          placeholder={t("editor/placeholder")}
          ref={(element: HTMLTextAreaElement) => {
            setTextAreaElement(element);
          }}
        ></textarea>
        {(editorMode === EditorMode.Preview ||
          editorMode === EditorMode.SplitView) &&
        editor ? (
          <div
            className={clsx(
              classes.preview,
              "preview",
              previewIsPresentation ? classes.presentation : null
            )}
            ref={(element: HTMLElement) => {
              setPreviewElement(element);
            }}
          ></div>
        ) : null}
      </Box>
      <Box className={clsx(classes.bottomPanel, "editor-bottom-panel")}>
        {note && (
          <Box className={clsx(classes.row)}>
            <Breadcrumbs aria-label={"File path"} maxItems={4}>
              {note.filePath.split("/").map((path, offset, arr) => {
                return (
                  <Typography
                    variant={"caption"}
                    style={{ cursor: "pointer" }}
                    color={"textPrimary"}
                    key={`${offset}-${path}`}
                    onClick={() => {
                      if (offset === arr.length - 1) {
                        setFilePathDialogOpen(true);
                      } else {
                        setSelectedSection({
                          type: CrossnoteSectionType.Directory,
                          path: arr.slice(0, offset + 1).join("/"),
                          notebook: {
                            name: "",
                            dir: note.notebookPath,
                          },
                        });
                      }
                    }}
                  >
                    {path}
                  </Typography>
                );
              })}
            </Breadcrumbs>
          </Box>
        )}
        <Box className={clsx(classes.cursorPositionInfo)}>
          <Typography variant={"caption"} color={"textPrimary"}>
            {`Ln ${cursorPosition.line + 1}, Col ${cursorPosition.ch}`}
          </Typography>
        </Box>
      </Box>

      <Card
        id="math-preview"
        className={clsx(classes.floatWin, "float-win", "float-win-hidden")}
      >
        <Box className={clsx(classes.floatWinTitle, "float-win-title")}>
          <IconButton
            className={clsx(classes.floatWinClose, "float-win-close")}
          >
            <Close></Close>
          </IconButton>
          <Typography>{t("general/math-preview")}</Typography>
        </Box>
        <Box
          className={clsx(classes.floatWinContent, "float-win-content")}
          id="math-preview-content"
        ></Box>
      </Card>

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        note={note}
      ></DeleteDialog>
      <ChangeFilePathDialog
        note={note}
        open={filePathDialogOpen}
        onClose={closeFilePathDialog}
      ></ChangeFilePathDialog>
      <EditImageDialog
        open={editImageDialogOpen}
        onClose={() => setEditImageDialogOpen(false)}
        editor={editor}
        imageElement={editImageElement}
        marker={editImageTextMarker}
        note={note}
      ></EditImageDialog>

      <Dialog open={toggleEncryptionDialogOpen} onClose={closeEncryptionDialog}>
        <DialogTitle>
          {note.config.encryption
            ? t("general/disable-the-encryption-on-this-note")
            : t("general/encrypt-this-note-with-password")}
        </DialogTitle>
        <DialogContent>
          <TextField
            value={toggleEncryptionPassword}
            autoFocus={true}
            onChange={(event) =>
              setToggleEncryptionPassword(event.target.value)
            }
            onKeyUp={(event) => {
              if (event.which === 13) {
                toggleEncryption();
              }
            }}
            placeholder={t("general/Password")}
            type={"password"}
          ></TextField>
        </DialogContent>
        <DialogActions>
          <Button
            variant={"contained"}
            color={"primary"}
            onClick={toggleEncryption}
          >
            {note.config.encryption ? <Lock></Lock> : <LockOpen></LockOpen>}
            {note.config.encryption
              ? t("general/disable-encryption")
              : t("general/encrypt")}
          </Button>
          <Button onClick={closeEncryptionDialog}>{t("general/cancel")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={decryptionDialogOpen} onClose={closeDecryptionDialog}>
        <DialogTitle>{t("general/decrypt-this-note")}</DialogTitle>
        <DialogContent>
          <TextField
            value={decryptionPassword}
            autoFocus={true}
            onChange={(event) => setDecryptionPassword(event.target.value)}
            placeholder={t("general/Password")}
            type={"password"}
            onKeyUp={(event) => {
              if (event.which === 13) {
                decryptNote();
              }
            }}
          ></TextField>
        </DialogContent>
        <DialogActions>
          <Button variant={"contained"} color={"primary"} onClick={decryptNote}>
            {t("general/decrypt")}
          </Button>
          <Button onClick={closeDecryptionDialog}>{t("general/cancel")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
