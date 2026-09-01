import type { ClientPackKind } from "./types";

export function fileSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "proposal";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function printClientPack(pack: ClientPackKind) {
  document.body.dataset.print = pack;
  const restore = () => {
    delete document.body.dataset.print;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.setTimeout(() => {
    if (document.body.dataset.print === pack) restore();
  }, 60_000);
  window.print();
}
