import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@material-ui/core";
import { useTranslation } from "react-i18next";
import { Note } from "../../lib/note";
import { vscode } from "../util/util";
import { MessageAction } from "../../lib/message";
import slash from "slash";

interface Props {
  open: boolean;
  onClose: () => void;
  note: Note;
}

export default function ChangeFilePathDialog(props: Props) {
  const note = props.note;
  const [inputEl, setInputEl] = useState<HTMLInputElement>(null);
  const [newFilePath, setNewFilePath] = useState<string>(
    (note && note.filePath) || ""
  );
  const { t } = useTranslation();

  const changeFilePath = useCallback(
    (newFilePath: string) => {
      if (!note) {
        return;
      }
      (async () => {
        newFilePath = newFilePath.replace(/^\/+/, "");
        if (!newFilePath.endsWith(".md")) {
          newFilePath = newFilePath + ".md";
        }
        newFilePath = slash(newFilePath);
        if (note.filePath !== newFilePath) {
          vscode.postMessage({
            action: MessageAction.ChangeNoteFilePath,
            data: {
              note,
              newFilePath: newFilePath,
            },
          });
        }
        props.onClose();
      })();
    },
    [note, props.onClose, props]
  );

  useEffect(() => {
    return () => {
      setInputEl(null);
    };
  }, []);

  useEffect(() => {
    if (note) {
      setNewFilePath(note.filePath);
    }
  }, [note, props.open]);

  useEffect(() => {
    if (!inputEl) {
      return;
    }
    inputEl.focus();
    if (inputEl.setSelectionRange) {
      const start = inputEl.value.lastIndexOf("/") + 1;
      let end = inputEl.value.lastIndexOf(".md");
      if (end < 0) {
        end = inputEl.value.length;
      }
      inputEl.setSelectionRange(start, end);
    }
  }, [inputEl]);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{t("general/change-file-path")}</DialogTitle>
      <DialogContent style={{ width: "400px", maxWidth: "100%" }}>
        <TextField
          value={newFilePath}
          autoFocus={true}
          onChange={(event) => setNewFilePath(event.target.value)}
          onKeyUp={(event) => {
            if (event.which === 13) {
              changeFilePath(newFilePath);
            }
          }}
          inputRef={(input: HTMLInputElement) => {
            setInputEl(input);
          }}
          fullWidth={true}
        ></TextField>
      </DialogContent>
      <DialogActions>
        <Button
          variant={"contained"}
          color={"primary"}
          onClick={() => changeFilePath(newFilePath)}
        >
          {t("general/Save")}
        </Button>
        <Button onClick={props.onClose}>{t("general/cancel")}</Button>
      </DialogActions>
    </Dialog>
  );
}
