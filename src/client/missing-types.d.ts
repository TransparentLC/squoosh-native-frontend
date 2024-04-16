/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/// <reference path="../../missing-types.d.ts" />
/// <reference path="../shared/prerendered-app/Intro/missing-types.d.ts" />

interface Navigator {
  readonly standalone: boolean;
}

declare module 'add-css:*' {}

declare module 'preact/debug' {}

declare const codecs: ['avif', 'jxl', 'MozJPEG', 'oxiPNG', 'webP', 'jpegli'];
declare const metrics: ['dssim', 'butteraugli', 'ssimulacra2'];

declare const pywebview: {
  api: {
    hookDnD: () => Promise<void>,
    fileDialog: (kwargs: {
      dialog_type?: 10 | 20 | 30, // OPEN_DIALOG | FOLDER_DIALOG | SAVE_DIALOG
      allow_multiple?: boolean,
      directory?: string,
      save_filename?: string,
      file_types?: string[], // "Description (*.ext1;*.ext2...)" or "All files (*.*)"
    }) => Promise<string[] | string | null>,
    readFile: (file: string, size?: number) => Promise<Uint8Array>,
    writeFile: (file: string, data: Uint8Array) => Promise<Uint8Array>,
    checkCodec: () => Promise<Record<string, string | null>>,
    checkMetric: () => Promise<Record<string, string | null>>,
    compressImage: (image: ImageData, encoderState: import('src/client/lazy-app/feature-meta/index').EncoderState) => Promise<Uint8Array>,
    calculateMetrics: (original: ImageData, distorted: ImageData) => Promise<{[K in typeof metrics[number]]?: string;}>,
  },
  dnd: {
    callbacks: Set<(e: DragEvent) => void>,
  },
};

interface Window {
  pywebview: typeof pywebview,
  msgpack: {
    encode: typeof import('@msgpack/msgpack').encode,
    decode: typeof import('@msgpack/msgpack').decode,
  },
  showSnack: (message: string, options?: {timeout?: number, actions?: string[]}) => Promise<string>,
  codecInfo: {
    [K in typeof codecs[number]]?: string;
  },
  metricInfo: {
    [K in typeof metrics[number]]?: boolean;
  },
}

interface File {
  pywebviewFullPath?: string,
}
