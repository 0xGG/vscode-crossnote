import React, { useState, useEffect, useCallback } from "react";
import LazyLoad from "react-lazyload";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import clsx from "clsx";
import { Box, Typography, Button } from "@material-ui/core";
import NoteCard from "./NoteCard";
import { useTranslation } from "react-i18next";
import useInterval from "@use-it/interval";
import { CloudDownloadOutline } from "mdi-material-ui";
import Noty from "noty";
import { Skeleton } from "@material-ui/lab";
import { Note, getHeaderFromMarkdown } from "../../lib/note";
import { SelectedSection } from "../../lib/section";
import { Message, MessageAction } from "../../lib/message";
import { vscode } from "../util/util";

export enum OrderBy {
  CreatedAt = "CreatedAt",
  ModifiedAt = "ModifiedAt",
  Title = "Title",
}

export enum OrderDirection {
  ASC = "ASC",
  DESC = "DESC",
}

const lazyLoadPlaceholderHeight = 92;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    notesList: {
      position: "relative",
      flex: "1",
      overflowY: "auto",
      paddingBottom: theme.spacing(12),
      backgroundColor: theme.palette.background.default,
      marginTop: "3px",
    },
    updatePanel: {
      padding: theme.spacing(2),
      textAlign: "center",
      borderBottom: "1px solid #ededed",
    },
  })
);

interface Props {
  searchValue: string;
  notes: Note[];
  orderBy: OrderBy;
  orderDirection: OrderDirection;
  selectedNote: Note;
  setSelectedNote: (note: Note) => void;
}

export default function Notes(props: Props) {
  const classes = useStyles(props);
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesListElement, setNotesListElement] = useState<HTMLElement>(null);
  const [forceUpdate, setForceUpdate] = useState<number>(Date.now());
  const searchValue = props.searchValue;
  const orderBy = props.orderBy;
  const orderDirection = props.orderDirection;
  const selectedNote = props.selectedNote;
  const setSelectedNote = props.setSelectedNote;

  useEffect(() => {
    const pinned: Note[] = [];
    const unpinned: Note[] = [];
    props.notes.forEach((note) => {
      if (searchValue.trim().length) {
        const regexp = new RegExp(
          "(" +
            searchValue
              .trim()
              .split(/\s+/g)
              .map((s) => s.replace(/[.!@#$%^&*()_+\-=[\]]/g, (x) => `\\${x}`)) // escape special regexp characters
              .join("|") +
            ")",
          "i"
        );

        if (note.markdown.match(regexp) || note.filePath.match(regexp)) {
          if (note.config.pinned) {
            pinned.push(note);
          } else {
            unpinned.push(note);
          }
        }
      } else {
        if (note.config.pinned) {
          pinned.push(note);
        } else {
          unpinned.push(note);
        }
      }
    });

    const sort = (notes: Note[]) => {
      if (orderBy === OrderBy.ModifiedAt) {
        if (orderDirection === OrderDirection.DESC) {
          notes.sort(
            (a, b) =>
              b.config.modifiedAt.getTime() - a.config.modifiedAt.getTime()
          );
        } else {
          notes.sort(
            (a, b) =>
              a.config.modifiedAt.getTime() - b.config.modifiedAt.getTime()
          );
        }
      } else if (orderBy === OrderBy.CreatedAt) {
        if (orderDirection === OrderDirection.DESC) {
          notes.sort(
            (a, b) =>
              b.config.createdAt.getTime() - a.config.createdAt.getTime()
          );
        } else {
          notes.sort(
            (a, b) =>
              a.config.createdAt.getTime() - b.config.createdAt.getTime()
          );
        }
      } else if (orderBy === OrderBy.Title) {
        if (orderDirection === OrderDirection.DESC) {
          notes.sort((a, b) =>
            (
              (b.config.encryption && b.config.encryption.title) ||
              getHeaderFromMarkdown(b.markdown)
            ).localeCompare(
              (a.config.encryption && a.config.encryption.title) ||
                getHeaderFromMarkdown(a.markdown)
            )
          );
        } else {
          notes.sort((a, b) =>
            (
              (a.config.encryption && a.config.encryption.title) ||
              getHeaderFromMarkdown(a.markdown)
            ).localeCompare(
              (b.config.encryption && b.config.encryption.title) ||
                getHeaderFromMarkdown(b.markdown)
            )
          );
        }
      }
      return notes;
    };

    setNotes([...sort(pinned), ...sort(unpinned)]);
  }, [props.notes, searchValue, orderBy, orderDirection]);

  useEffect(() => {
    if (
      notes &&
      notes.length > 0 &&
      (!selectedNote || selectedNote.notebookPath !== notes[0].notebookPath)
    ) {
      setSelectedNote(notes[0]);
    }
  }, [notes, selectedNote]);

  useEffect(() => {
    if (selectedNote) {
      const message: Message = {
        action: MessageAction.OpenNoteIfNoNoteSelected,
        data: selectedNote,
      };
      vscode.postMessage(message);
    }
  }, [selectedNote]);

  /*
  useEffect(() => {
    if (notesListElement) {
      const keyDownHandler = (event: KeyboardEvent) => {
        const selectedNote = crossnoteContainer.selectedNote;
        if (!selectedNote || !notes.length) {
          return;
        }
        const currentIndex = notes.findIndex(
          (n) => n.filePath === selectedNote.filePath
        );
        if (currentIndex < 0) {
          crossnoteContainer.setSelectedNote(notes[0]);
        } else if (event.which === 40) {
          // Up
          if (currentIndex >= 0 && currentIndex < notes.length - 1) {
            crossnoteContainer.setSelectedNote(notes[currentIndex + 1]);
          }
        } else if (event.which === 38) {
          // Down
          if (currentIndex > 0 && currentIndex < notes.length) {
            crossnoteContainer.setSelectedNote(notes[currentIndex - 1]);
          }
        }
      };
      notesListElement.addEventListener("keydown", keyDownHandler);
      return () => {
        notesListElement.removeEventListener("keydown", keyDownHandler);
      };
    }
  }, [notesListElement, notes, crossnoteContainer.selectedNote]);
  */

  useEffect(() => {
    if (notesListElement) {
      // Hack: fix note cards not displaying bug when searchValue is not empty
      const hack = () => {
        const initialHeight = notesListElement.style.height;
        const initialFlex = notesListElement.style.flex;
        notesListElement.style.flex = "initial";
        notesListElement.style.height = "10px";
        notesListElement.scrollTop += 1;
        notesListElement.scrollTop -= 1;
        notesListElement.style.height = initialHeight;
        notesListElement.style.flex = initialFlex;
      };
      window.addEventListener("resize", hack);
      hack();
      return () => {
        window.removeEventListener("resize", hack);
      };
    }
  }, [notes, notesListElement]);

  /*
  useInterval(() => {
    if (crossnoteContainer.needsToRefreshNotes) {
      crossnoteContainer.setNeedsToRefreshNotes(false);
      setForceUpdate(Date.now());
    }
  }, 15000);
  */

  return (
    <div
      className={clsx(classes.notesList)}
      ref={(element: HTMLElement) => {
        setNotesListElement(element);
      }}
    >
      {/*crossnoteContainer.selectedNotebook &&
        crossnoteContainer.selectedNotebook.localSha !==
          crossnoteContainer.selectedNotebook.remoteSha && (
          <Box className={clsx(classes.updatePanel)}>
            <Typography style={{ marginBottom: "8px" }}>
              {"🔔  " + t("general/notebook-updates-found")}
            </Typography>
            <Button
              color={"primary"}
              variant={"outlined"}
              onClick={pullNotebook}
              disabled={
                crossnoteContainer.isPullingNotebook ||
                crossnoteContainer.isPushingNotebook
              }
            >
              <CloudDownloadOutline
                style={{ marginRight: "8px" }}
              ></CloudDownloadOutline>
              {t("general/update-the-notebook")}
            </Button>
          </Box>
            )*/}
      {(notes || []).map((note) => {
        return (
          <LazyLoad
            key={"lazy-load-note-card-" + note.filePath}
            placeholder={
              <Box
                style={{
                  textAlign: "center",
                  height: `${lazyLoadPlaceholderHeight}px`,
                  paddingTop: "16px",
                  paddingBottom: "16px",
                  boxSizing: "border-box",
                }}
              >
                <Skeleton />
                <Skeleton animation={false} />
                <Skeleton animation="wave" />
              </Box>
            }
            height={lazyLoadPlaceholderHeight}
            overflow={true}
            once={true}
            scrollContainer={notesListElement}
            resize={true}
          >
            <NoteCard
              key={"note-card-" + note.filePath}
              note={note}
              selectedNote={selectedNote}
              setSelectedNote={setSelectedNote}
            ></NoteCard>
          </LazyLoad>
        );
      })}
      {
        /*crossnoteContainer.initialized &&
        !crossnoteContainer.isLoadingNotebook &&*/
        notes.length === 0 && (
          <Typography
            style={{
              textAlign: "center",
              marginTop: "32px",
            }}
            variant={"body2"}
          >
            {"🧐 " + t("general/no-notes-found")}
          </Typography>
        )
      }
    </div>
  );
}
