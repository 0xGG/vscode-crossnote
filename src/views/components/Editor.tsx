import React, { useState, useEffect } from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import clsx from "clsx";
import { Box } from "@material-ui/core";
import {
  Editor as CodeMirrorEditor,
  EditorChangeLinkedList,
  TextMarker,
} from "codemirror";
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
      backgroundColor: "inherit",
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
  })
);

interface Props {}
export default function Editor(props: Props) {
  const classes = useStyles(props);
  const [textAreaElement, setTextAreaElement] = useState<HTMLTextAreaElement>(
    null
  );
  const [previewElement, setPreviewElement] = useState<HTMLElement>(null);
  const [editor, setEditor] = useState<CodeMirrorEditor>(null);

  useEffect(() => {
    return () => {
      setEditor(null);
      setTextAreaElement(null);
      setPreviewElement(null);
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

  return (
    <Box className={clsx(classes.editorPanel)}>
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
