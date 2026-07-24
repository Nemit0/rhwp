import {
  SAVE_FORMAT_DETAILS,
  type FilePickerType,
  type SaveFormat,
} from './save-format.ts';

export interface FileSystemWritableFileStreamLike {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

/** File System Access 권한 상태 (queryPermission/requestPermission 반환). */
export type FileSystemPermissionState = 'granted' | 'denied' | 'prompt';

export interface FileSystemFileHandleLike {
  kind?: 'file';
  name: string;
  filePath?: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStreamLike>;
  isSameEntry?(other: FileSystemFileHandleLike): Promise<boolean>;
  queryPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemPermissionState>;
  requestPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemPermissionState>;
}

export interface ElectronFileResult {
  filePath: string;
  fileName: string;
  data: number[];
}

export interface ElectronFileApi {
  openFile(): Promise<ElectronFileResult | null>;
  readFile(filePath: string): Promise<ElectronFileResult>;
  saveFile(filePath: string, data: Uint8Array): Promise<boolean>;
  saveFileAs(
    suggestedName: string,
    data: Uint8Array,
  ): Promise<Pick<ElectronFileResult, 'filePath' | 'fileName'> | null>;
}

export interface FileSystemWindowLike {
  electronAPI?: ElectronFileApi;
  showOpenFilePicker?: (options?: {
    excludeAcceptAllOption?: boolean;
    multiple?: boolean;
    types?: FilePickerType[];
  }) => Promise<FileSystemFileHandleLike[]>;
  showSaveFilePicker?: (options?: {
    excludeAcceptAllOption?: boolean;
    suggestedName?: string;
    types?: FilePickerType[];
  }) => Promise<FileSystemFileHandleLike>;
}

export interface FileHandleReadResult {
  name: string;
  bytes: Uint8Array;
}

export interface SaveDocumentOptions {
  blob: Blob;
  suggestedName: string;
  currentHandle: FileSystemFileHandleLike | null;
  windowLike: FileSystemWindowLike;
  /** [Task #833] true 시 currentHandle 무시 + 항상 showSaveFilePicker 호출 (다른 이름으로 저장). */
  forceSaveAs: boolean;
  /** 저장 picker와 확장자 검증을 결정하는 단일 출력 포맷. */
  saveFormat: SaveFormat;
}

export interface SaveDocumentResult {
  method: 'current-handle' | 'save-picker' | 'fallback';
  handle: FileSystemFileHandleLike | null;
  fileName: string;
}

export const HWP_DOCUMENT_ACCEPT: Record<string, string[]> = {
  'application/x-hwp': ['.hwp'],
  'application/hwp+zip': ['.hwpx'],
  'application/xml': ['.hml'],
  'text/xml': ['.hml'],
};

const HWP_OPEN_PICKER_TYPES: FilePickerType[] = [{
  description: 'HWP/HWPX/HML 문서',
  accept: HWP_DOCUMENT_ACCEPT,
}];

function pickerTypesForFormat(format: SaveFormat): FilePickerType[] {
  return [SAVE_FORMAT_DETAILS[format].pickerType];
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function isSupportedDocumentFileName(fileName: string): boolean {
  return /\.(hwp|hwpx|hml)$/i.test(fileName.trim());
}

export function canUseOpenFilePicker(windowLike: FileSystemWindowLike): boolean {
  return Boolean(windowLike.electronAPI) || typeof windowLike.showOpenFilePicker === 'function';
}

export function createElectronFileHandle(
  electronAPI: ElectronFileApi,
  result: Pick<ElectronFileResult, 'filePath' | 'fileName'>,
): FileSystemFileHandleLike {
  return {
    kind: 'file',
    name: result.fileName,
    filePath: result.filePath,
    async getFile() {
      const file = await electronAPI.readFile(result.filePath);
      return new File(
        [new Uint8Array(file.data) as unknown as BlobPart],
        file.fileName,
        { type: 'application/octet-stream' },
      );
    },
    async createWritable() {
      return {
        async write(blob) {
          await electronAPI.saveFile(
            result.filePath,
            new Uint8Array(await blob.arrayBuffer()),
          );
        },
        async close() {},
      };
    },
    async isSameEntry(other) {
      return other.filePath === result.filePath;
    },
    async queryPermission() {
      return 'granted';
    },
    async requestPermission() {
      return 'granted';
    },
  };
}

async function writeBlobToHandle(handle: FileSystemFileHandleLike, blob: Blob): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function expectedSaveExtension(saveFormat: SaveFormat): '.hml' | '.hwp' | '.hwpx' {
  return SAVE_FORMAT_DETAILS[saveFormat].extension;
}

async function assertValidSaveHandle(
  handle: FileSystemFileHandleLike,
  expectedExtension: '.hml' | '.hwp' | '.hwpx',
  originalHandle: FileSystemFileHandleLike | null,
): Promise<void> {
  if (originalHandle) {
    const isOriginal = handle === originalHandle
      || await handle.isSameEntry?.(originalHandle) === true;
    if (isOriginal) {
      throw new Error('HML 원본 파일은 저장 대상으로 선택할 수 없습니다.');
    }
  }

  if (!handle.name.toLowerCase().endsWith(expectedExtension)) {
    throw new Error(`${expectedExtension} 확장자를 가진 파일을 선택해야 합니다.`);
  }
}

export async function pickOpenFileHandle(windowLike: FileSystemWindowLike): Promise<FileSystemFileHandleLike | null> {
  if (!canUseOpenFilePicker(windowLike)) return null;

  if (windowLike.electronAPI) {
    const result = await windowLike.electronAPI.openFile();
    return result ? createElectronFileHandle(windowLike.electronAPI, result) : null;
  }

  try {
    const handles = await windowLike.showOpenFilePicker!({
      excludeAcceptAllOption: true,
      multiple: false,
      types: HWP_OPEN_PICKER_TYPES,
    });
    return handles[0] ?? null;
  } catch (error) {
    if (isAbortError(error)) return null;
    throw error;
  }
}

export async function readFileFromHandle(handle: FileSystemFileHandleLike): Promise<FileHandleReadResult> {
  const file = await handle.getFile();
  return {
    name: file.name,
    bytes: new Uint8Array(await file.arrayBuffer()),
  };
}

export async function saveDocumentToFileSystem(options: SaveDocumentOptions): Promise<SaveDocumentResult> {
  const { blob, suggestedName, currentHandle, windowLike, forceSaveAs, saveFormat } = options;

  // 저장 picker 형식을 출력 포맷에 맞춘다 (HML/HWP/HWPX).
  const pickerTypes = pickerTypesForFormat(saveFormat);

  // [Task #833] forceSaveAs 시 currentHandle 우회 → 항상 picker (다른 이름으로 저장).
  if (currentHandle && !forceSaveAs) {
    await assertValidSaveHandle(
      currentHandle,
      expectedSaveExtension(saveFormat),
      null,
    );
    await writeBlobToHandle(currentHandle, blob);
    return {
      method: 'current-handle',
      handle: currentHandle,
      fileName: currentHandle.name,
    };
  }

  if (windowLike.electronAPI) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const result = await windowLike.electronAPI.saveFileAs(suggestedName, bytes);
    if (!result) throw new DOMException('cancelled', 'AbortError');
    const handle = createElectronFileHandle(windowLike.electronAPI, result);
    await assertValidSaveHandle(
      handle,
      expectedSaveExtension(saveFormat),
      forceSaveAs ? currentHandle : null,
    );
    return {
      method: 'save-picker',
      handle,
      fileName: handle.name,
    };
  }

  if (windowLike.showSaveFilePicker) {
    const handle = await windowLike.showSaveFilePicker({
      excludeAcceptAllOption: true,
      suggestedName,
      types: pickerTypes,
    });
    await assertValidSaveHandle(
      handle,
      expectedSaveExtension(saveFormat),
      forceSaveAs ? currentHandle : null,
    );
    await writeBlobToHandle(handle, blob);
    return {
      method: 'save-picker',
      handle,
      fileName: handle.name,
    };
  }

  return {
    method: 'fallback',
    handle: null,
    fileName: suggestedName,
  };
}
