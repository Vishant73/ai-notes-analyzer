import { useActor } from "@caffeineai/core-infrastructure";
import { type ExternalBlob, createActor } from "../backend";

async function noopUpload(
  _file: ExternalBlob,
): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array();
}

async function noopDownload(_file: Uint8Array): Promise<ExternalBlob> {
  throw new Error("File download not supported");
}

export function useBackend() {
  return useActor((canisterId, uploadFile, downloadFile, options) =>
    createActor(
      canisterId,
      uploadFile ?? noopUpload,
      downloadFile ?? noopDownload,
      options,
    ),
  );
}
