import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
} from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import clsx from "clsx";
import { Editor as CodeMirrorEditor, TextMarker } from "codemirror";
import { useTranslation } from "react-i18next";
import { Note } from "../../lib/note";
import { resolveNoteImageSrc } from "../util/util";

interface Props {
  open: boolean;
  onClose: () => void;
  editor: CodeMirrorEditor;
  marker: TextMarker;
  imageElement: HTMLImageElement;
  note: Note;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    imageWrapper: {
      textAlign: "center",
    },
    imagePreview: {
      maxWidth: "100%",
      maxHeight: "400px",
    },
  })
);

export default function EditImageDialog(props: Props) {
  const classes = useStyles(props);
  const { t } = useTranslation();
  const editor = props.editor;
  const marker = props.marker;
  const imageElement = props.imageElement;
  const [imageSrc, setImageSrc] = useState<string>("");
  const [imageAlt, setImageAlt] = useState<string>("");
  const [imageTitle, setImageTitle] = useState<string>("");

  const deleteImage = useCallback(() => {
    if (!imageElement || !editor || !marker) {
      return;
    }
    const pos = marker.find();
    editor.replaceRange("", pos.from, pos.to);
    props.onClose();
  }, [imageElement, editor, marker, props]);

  const updateImage = useCallback(() => {
    if (!imageElement || !editor || !marker) {
      return;
    }
    const pos = marker.find();
    if (!pos) {
      return;
    }
    if (imageTitle.trim().length) {
      editor.replaceRange(
        `![${imageAlt.trim()}](${imageSrc.trim()} ${JSON.stringify(
          imageTitle
        )})`,
        pos.from,
        pos.to
      );
    } else {
      editor.replaceRange(
        `![${imageAlt.trim()}](${imageSrc.trim()})`,
        pos.from,
        pos.to
      );
    }
    props.onClose();
  }, [imageElement, editor, marker, props, imageAlt, imageSrc, imageTitle]);

  useEffect(() => {
    if (imageElement && marker && editor) {
      setImageSrc(imageElement.getAttribute("data-src") || "");
      setImageTitle(imageElement.title || "");
      setImageAlt(imageElement.alt || "");
    }
  }, [imageElement, marker, editor]);

  if (!editor || !marker || !imageElement) {
    return null;
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} style={{ zIndex: 3001 }}>
      <DialogTitle>{t("edit-image-dialog/title")}</DialogTitle>
      <DialogContent style={{ width: "400px", maxWidth: "100%" }}>
        <Box className={clsx(classes.imageWrapper)}>
          <img
            className={clsx(classes.imagePreview)}
            src={resolveNoteImageSrc(props.note, imageSrc)}
            alt={imageAlt}
            title={imageTitle}
          ></img>{" "}
        </Box>
        <TextField
          autoFocus={true}
          value={imageSrc}
          helperText={t("edit-image-dialog/image-url")}
          fullWidth={true}
          onChange={(event) => setImageSrc(event.target.value)}
        ></TextField>
        <TextField
          autoFocus={true}
          value={imageTitle}
          helperText={t("edit-image-dialog/image-title")}
          fullWidth={true}
          onChange={(event) => setImageTitle(event.target.value)}
        ></TextField>
        <TextField
          autoFocus={true}
          value={imageAlt}
          helperText={t("edit-image-dialog/image-alt-text")}
          fullWidth={true}
          onChange={(event) => setImageAlt(event.target.value)}
        ></TextField>
      </DialogContent>
      <DialogActions>
        <Button variant={"contained"} color={"primary"} onClick={updateImage}>
          {t("general/update")}
        </Button>
        <Button variant={"contained"} color={"secondary"} onClick={deleteImage}>
          {t("general/Delete")}
        </Button>
        <Button onClick={props.onClose}> {t("general/cancel")}</Button>
      </DialogActions>
    </Dialog>
  );
}
