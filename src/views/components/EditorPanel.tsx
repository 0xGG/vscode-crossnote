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
} from "codemirror";
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
    iconBtnSVG: {
      color: theme.palette.text.secondary,
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
  const [tagName, setTagName] = useState<string>("");
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

  const openURL = useCallback(
    (url: string) => {
      if (!note) {
        return;
      }
      const message: Message = {
        action: MessageAction.OpenURL,
        data: {
          note,
          url,
        },
      };
      vscode.postMessage(message);
    },
    [note]
  );

  const setSelectedSection = useCallback((selectedSection: SelectedSection) => {
    const message: Message = {
      action: MessageAction.SetSelectedSection,
      data: selectedSection,
    };
    vscode.postMessage(message);
  }, []);

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
      setTagName("");
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

    const linkIconClickedHandler = (args: any) => {
      const url = args.element.getAttribute("data-url");
      openURL(url || "");
    };
    editor.on("linkIconClicked", linkIconClickedHandler);

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
      editor.off("linkIconClicked", linkIconClickedHandler);
      editor.off("imageClicked", imageClickedHandler);
      editor.off("imageReadyToLoad", loadImage);
    };
  }, [editor, note, decryptionPassword, isDecrypted, openURL]);

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
    } else {
      editor.getWrapperElement().style.display = "none";
    }
  }, [editorMode, editor, note, isDecrypted]);

  // Render Preview
  useEffect(() => {
    if (editorMode === EditorMode.Preview && editor && note && previewElement) {
      if (isDecrypted) {
        const handleLinksClickEvent = (preview: HTMLElement) => {
          // Handle link click event
          const links = preview.getElementsByTagName("A");
          for (let i = 0; i < links.length; i++) {
            const link = links[i] as HTMLAnchorElement;
            link.onclick = (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (link.hasAttribute("data-topic")) {
                const tag = link.getAttribute("data-topic");
                if (tag.length) {
                  setSelectedSection({
                    type: CrossnoteSectionType.Tag,
                    path: tag,
                    notebook: {
                      dir: note.notebookPath,
                      name: "",
                    },
                  });
                }
              } else {
                openURL(link.getAttribute("href"));
              }
            };
          }
        };
        const resolveImages = (preview: HTMLElement) => {
          const images = preview.getElementsByTagName("IMG");
          for (let i = 0; i < images.length; i++) {
            const image = images[i] as HTMLImageElement;
            const imageSrc = image.getAttribute("src");
            if (imageSrc) {
              image.setAttribute("src", resolveNoteImageSrc(note, imageSrc));
            }
          }
        };
        renderPreview(previewElement, editor.getValue());
        if (
          previewElement.childElementCount &&
          previewElement.children[0].tagName.toUpperCase() === "IFRAME"
        ) {
          // presentation
          previewElement.style.maxWidth = "100%";
          previewElement.style.height = "100%";
          previewElement.style.overflow = "hidden !important";
          handleLinksClickEvent(
            (previewElement.children[0] as HTMLIFrameElement).contentDocument
              .body as HTMLElement
          );
          resolveImages(
            (previewElement.children[0] as HTMLIFrameElement).contentDocument
              .body as HTMLElement
          );
          setPreviewIsPresentation(true);
        } else {
          // normal
          // previewElement.style.maxWidth = `${EditorPreviewMaxWidth}px`;
          previewElement.style.height = "100%";
          previewElement.style.overflow = "hidden !important";
          handleLinksClickEvent(previewElement);
          resolveImages(previewElement);
          setPreviewIsPresentation(false);
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
  }, [editorMode, editor, previewElement, note, isDecrypted, openURL, t]);

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

              const commands = [
                {
                  text: "# ",
                  displayText: `/h1 - ${t("editor/toolbar/insert-header-1")}`,
                },
                {
                  text: "## ",
                  displayText: `/h2 - ${t("editor/toolbar/insert-header-2")}`,
                },
                {
                  text: "### ",
                  displayText: `/h3 - ${t("editor/toolbar/insert-header-3")}`,
                },
                {
                  text: "#### ",
                  displayText: `/h4 - ${t("editor/toolbar/insert-header-4")}`,
                },
                {
                  text: "##### ",
                  displayText: `/h5 - ${t("editor/toolbar/insert-header-5")}`,
                },
                {
                  text: "###### ",
                  displayText: `/h6 - ${t("editor/toolbar/insert-header-6")}`,
                },
                {
                  text: "> ",
                  displayText: `/blockquote - ${t(
                    "editor/toolbar/insert-blockquote"
                  )}`,
                },
                {
                  text: "* ",
                  displayText: `/ul - ${t(
                    "editor/toolbar/insert-unordered-list"
                  )}`,
                },
                {
                  text: "1. ",
                  displayText: `/ol - ${t(
                    "editor/toolbar/insert-ordered-list"
                  )}`,
                },
                {
                  text: "<!-- @crossnote.image -->\n",
                  displayText: `/image - ${t("editor/toolbar/insert-image")}`,
                },
                {
                  text: `|   |   |
|---|---|
|   |   |
  `,
                  displayText: `/table - ${t("editor/toolbar/insert-table")}`,
                },
                {
                  text:
                    "<!-- @timer " +
                    JSON.stringify({ date: new Date().toString() })
                      .replace(/^{/, "")
                      .replace(/}$/, "") +
                    " -->\n",
                  displayText: `/timer - ${t("editor/toolbar/insert-clock")}`,
                },
                {
                  text: "<!-- @crossnote.audio -->  \n",
                  displayText: `/audio - ${t("editor/toolbar/audio-url")}`,
                },
                /*
                {
                  text: "<!-- @crossnote.netease_music -->  \n",
                  displayText: `/netease - ${t(
                    "editor/toolbar/netease-music"
                  )}`,
                },*/
                {
                  text: "<!-- @crossnote.video -->  \n",
                  displayText: `/video - ${t("editor/toolbar/video-url")}`,
                },
                {
                  text: "<!-- @crossnote.youtube -->  \n",
                  displayText: `/youtube - ${t("editor/toolbar/youtube")}`,
                },
                {
                  text: "<!-- @crossnote.bilibili -->  \n",
                  displayText: `/bilibili - ${t("editor/toolbar/bilibili")}`,
                },
                {
                  text: "<!-- slide -->  \n",
                  displayText: `/slide - ${t("editor/toolbar/insert-slide")}`,
                },
                {
                  text: "<!-- @crossnote.ocr -->  \n",
                  displayText: `/ocr - ${t("editor/toolbar/insert-ocr")}`,
                },
                {
                  text:
                    '<!-- @crossnote.kanban "v":2,"board":{"columns":[]} -->  \n',
                  displayText: `/kanban - ${t(
                    "editor/toolbar/insert-kanban"
                  )} (beta)`,
                },
                /*
                {
                  text: "<!-- @crossnote.abc -->  \n",
                  displayText: `/abc - ${t(
                    "editor/toolbar/insert-abc-notation"
                  )}`,
                },
                */
                {
                  text: "<!-- @crossnote.github_gist -->  \n",
                  displayText: `/github_gist - ${t(
                    "editor/toolbar/insert-github-gist"
                  )}`,
                },
                /*{
                  text: "<!-- @crossnote.comment -->  \n",
                  displayText: `/crossnote.comment - ${t(
                    "editor/toolbar/insert-comment"
                  )}`,
                },*/
              ];
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
      }

      // Check emoji
      if (changeObject.text.length === 1 && changeObject.text[0] === ":") {
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
            if (lineStr[start] !== ":") {
              start = start - 1;
            }
            const currentWord: string = lineStr
              .slice(start, end)
              .replace(/^:/, "");

            const commands: { text: string; displayText: string }[] = [];
            for (const def in EmojiDefinitions) {
              const emoji = EmojiDefinitions[def];
              commands.push({
                text: `:${def}: `,
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
          <Popover
            open={Boolean(tagsMenuAnchorEl)}
            anchorEl={tagsMenuAnchorEl}
            keepMounted
            onClose={() => setTagsMenuAnchorEl(null)}
          >
            <List>
              <ListItem
                className={clsx(
                  classes.menuItemOverride,
                  classes.menuItemTextField
                )}
              >
                <TextField
                  placeholder={t("general/add-a-tag")}
                  autoFocus={true}
                  value={tagName}
                  onChange={(event) => {
                    event.stopPropagation();
                    setTagName(event.target.value);
                  }}
                  onKeyUp={(event) => {
                    if (event.which === 13) {
                      addTag(tagName);
                    }
                  }}
                ></TextField>
              </ListItem>
              {tagNames.length > 0 ? (
                tagNames.map((tagName) => {
                  return (
                    <ListItem
                      key={tagName}
                      className={clsx(classes.menuItemOverride)}
                    >
                      <Box
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Typography>{tagName}</Typography>
                        <IconButton onClick={() => deleteTag(tagName)}>
                          <Close className={clsx(classes.iconBtnSVG)}></Close>
                        </IconButton>
                      </Box>
                    </ListItem>
                  );
                })
              ) : (
                <ListItem className={clsx(classes.menuItemOverride)}>
                  <Typography style={{ margin: "8px 0" }}>
                    {t("general/no-tags")}
                  </Typography>
                </ListItem>
              )}
            </List>
          </Popover>
        </Box>
      </Box>
      <Box className={clsx(classes.editorWrapper)}>
        <textarea
          className={clsx(classes.editor, "editor-textarea")}
          placeholder={t("editor/placeholder")}
          ref={(element: HTMLTextAreaElement) => {
            setTextAreaElement(element);
          }}
        ></textarea>
        {editorMode === EditorMode.Preview &&
        /*!editorContainer.pinPreviewOnTheSide &&*/
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
