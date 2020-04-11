import React, { useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@material-ui/core";
import { useTranslation } from "react-i18next";
import { Note } from "../../lib/note";

interface Props {
  open: boolean;
  onClose: () => void;
  note: Note;
}
export function DeleteDialog(props: Props) {
  const { t } = useTranslation();
  const note = props.note;

  const deleteNote = useCallback((note: Note) => {
    // TODO
  }, []);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{t("delete-file-dialog/title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("delete-file-dialog/subtitle")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          style={{ color: "red" }}
          onClick={() => {
            deleteNote(note);
            props.onClose();
          }}
        >
          {t("general/Delete")}
        </Button>
        <Button onClick={props.onClose}>{t("general/cancel")}</Button>
      </DialogActions>
    </Dialog>
  );
}
