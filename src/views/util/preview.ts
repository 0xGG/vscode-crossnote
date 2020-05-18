import { Note } from "../../lib/note";
import { SelectedSection, CrossnoteSectionType } from "../../lib/section";
import { Message, MessageAction } from "../../lib/message";
import { vscode, resolveNoteImageSrc, setSelectedSection } from "../util/util";

export function openURL(url: string, note: Note) {
  if (!note) {
    return;
  }
  const message: Message = {
    action: MessageAction.OpenURL,
    data: {
      note,
      url: decodeURIComponent(url),
    },
  };
  vscode.postMessage(message);
}

export function postprocessPreview(
  previewElement: HTMLElement,
  note: Note,
  isPresentationCallback?: (isPresentation: boolean) => void
) {
  if (!previewElement) {
    return;
  }
  const handleLinksClickEvent = (preview: HTMLElement) => {
    // Handle link click event
    const links = preview.getElementsByTagName("A");
    for (let i = 0; i < links.length; i++) {
      const link = links[i] as HTMLAnchorElement;
      link.onclick = (event) => {
        event.preventDefault();
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
          openURL(link.getAttribute("href"), note);
        }
      };
    }
  };
  const resolveImages = async (preview: HTMLElement) => {
    const images = preview.getElementsByTagName("IMG");
    for (let i = 0; i < images.length; i++) {
      const image = images[i] as HTMLImageElement;
      const imageSrc = image.getAttribute("src");
      image.setAttribute(
        "src",
        resolveNoteImageSrc(note, decodeURIComponent(imageSrc))
      );
    }
  };

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
    if (isPresentationCallback) {
      isPresentationCallback(true);
    }
  } else {
    // normal
    // previewElement.style.maxWidth = `${EditorPreviewMaxWidth}px`;
    previewElement.style.height = "100%";
    previewElement.style.overflow = "hidden !important";
    handleLinksClickEvent(previewElement);
    resolveImages(previewElement);
    if (isPresentationCallback) {
      isPresentationCallback(false);
    }
  }
}
