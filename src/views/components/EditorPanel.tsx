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
} from "mdi-material-ui";
import { Message, MessageAction } from "../../lib/message";
import { vscode } from "../util/util";
import { Note } from "../../lib/note";
import { TagStopRegExp } from "../util/markdown";
const VickyMD = require("vickymd");

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
      borderBottom: "1px solid #eee",
      overflow: "auto",
    },
    bottomPanel: {
      position: "relative",
      padding: theme.spacing(0.5, 1),
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderTop: "1px solid #eee",
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
    editorWrapper: {
      //     display: "contents",
      flex: 1,
      overflow: "auto",
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
          padding: theme.spacing(0),
        },
      },
      "& .CodeMirror-vscrollbar": {
        // display: "none !important",
      },
      [theme.breakpoints.down("sm")]: {
        padding: theme.spacing(1),
      },
    },
    editor: {
      width: "100%",
      height: "100%",
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
  })
);

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
  const [note, setNote] = useState<Note>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.Preview);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [filePathDialogOpen, setFilePathDialogOpen] = useState<boolean>(false);
  const [toggleEncryptionDialogOpen, setToggleEncryptionDialogOpen] = useState<
    boolean
  >(false);
  const [decryptionPassword, setDecryptionPassword] = useState<string>("");
  const [isDecrypted, setIsDecrypted] = useState<boolean>(false);
  const [tagsMenuAnchorEl, setTagsMenuAnchorEl] = useState<HTMLElement>(null);
  const [tagName, setTagName] = useState<string>("");
  const [tagNames, setTagNames] = useState<string[]>([]);

  const togglePin = useCallback(() => {
    /*
    if (note && editor && isDecrypted) {
      note.config.pinned = !note.config.pinned;
      if (!note.config.pinned) {
        delete note.config.pinned;
      }
      crossnoteContainer.updateNoteMarkdown(
        note,
        editor.getValue(),
        note.config.encryption ? decryptionPassword : "",
        (status) => {
          setGitStatus(status);
        }
      );
    }*/
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
        /*
        crossnoteContainer.updateNoteMarkdown(
          note,
          editor.getValue(),
          note.config.encryption ? decryptionPassword : "",
          (status) => {
            setGitStatus(status);
          }
        );
        crossnoteContainer.updateNotebookTagNode();
        */
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
          /* crossnoteContainer.updateNoteMarkdown(
            note,
            editor.getValue(),
            note.config.encryption ? decryptionPassword : "",
            (status) => {
              setGitStatus(status);
            }
          );
          crossnoteContainer.updateNotebookTagNode();
          */

          return newTagNames;
        });
      }
    },
    [note, editor, decryptionPassword, isDecrypted]
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
        inputStyle: "textarea",
      });
      editor.setOption("lineNumbers", false);
      editor.setOption("foldGutter", false);
      editor.setValue("");
      setEditor(editor);
    }
  }, [textAreaElement, editor]);

  useEffect(() => {
    if (note && editor) {
      editor.setValue(note.markdown);
      editor.refresh();
    }
  }, [note, editor]);

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
                  // onClick={/* () => crossnoteContainer.duplicateNote(note) */}
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
                          <Close></Close>
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
          ref={(element: HTMLTextAreaElement) => {
            setTextAreaElement(element);
          }}
        ></textarea>
      </Box>
    </Box>
  );
}
