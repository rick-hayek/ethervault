import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';

function uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = '';
    const len = arr.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
        const chunk = arr.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk as any);
    }
    return btoa(binary);
}

async function writeUniqueFile(options: {
    path: string;
    data: string;
    directory: Directory;
    encoding?: Encoding;
    recursive?: boolean;
}): Promise<string> {
    let currentPath = options.path;
    let attempts = 0;
    const maxAttempts = 100;

    const lastSlashIndex = options.path.lastIndexOf('/');
    const folderPath = lastSlashIndex !== -1 ? options.path.substring(0, lastSlashIndex + 1) : '';
    const fullFilename = lastSlashIndex !== -1 ? options.path.substring(lastSlashIndex + 1) : options.path;

    const dotIndex = fullFilename.lastIndexOf('.');
    let base = fullFilename;
    let ext = '';
    if (dotIndex !== -1) {
        base = fullFilename.substring(0, dotIndex);
        ext = fullFilename.substring(dotIndex);
    }

    while (attempts < maxAttempts) {
        try {
            await Filesystem.writeFile({
                ...options,
                path: currentPath
            });
            const slashIdx = currentPath.lastIndexOf('/');
            return slashIdx !== -1 ? currentPath.substring(slashIdx + 1) : currentPath;
        } catch (e: any) {
            const errorMsg = e.message || '';
            const isPermissionOrConflict = errorMsg.includes('EACCES') || 
                                          errorMsg.includes('Permission denied') || 
                                          errorMsg.includes('already exists') ||
                                          errorMsg.includes('FILE_EXISTS') ||
                                          errorMsg.includes('exists');
            
            if (isPermissionOrConflict && attempts < maxAttempts - 1) {
                attempts++;
                currentPath = `${folderPath}${base} (${attempts})${ext}`;
            } else {
                throw e;
            }
        }
    }
    throw new Error('Could not find a unique filename to write');
}

export const MobileFileService = {
    /**
     * Export content to a file.
     * User requested to stop using Share and use manual directory picking.
     */
    async exportFile(filename: string, content: string): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            return false;
        }
        // Direct fallback to manual save as requested
        return !!(await this.saveAsFile(filename, content));
    },

    /**
     * Save binary content to device storage (Downloads on Android, Documents on iOS)
     */
    async saveBinaryFile(filename: string, data: Uint8Array): Promise<string | false> {
        if (!Capacitor.isNativePlatform()) {
            return false;
        }
        try {
            const base64Data = uint8ArrayToBase64(data);
            const platform = Capacitor.getPlatform();

            if (platform === 'android') {
                // Android: Save to 'Download' folder in External Storage
                return await writeUniqueFile({
                    path: 'Download/' + filename,
                    data: base64Data,
                    directory: Directory.ExternalStorage,
                    recursive: true
                });
            } else {
                // iOS: Save to Documents (accessible via Files app)
                return await writeUniqueFile({
                    path: filename,
                    data: base64Data,
                    directory: Directory.Documents
                });
            }
        } catch (e: any) {
            console.error('[MobileFileService] Save binary failed', e);
            throw new Error(e.message);
        }
    },

    /**
     * Save to Downloads (Android) or Documents (iOS)
     */
    async saveAsFile(filename: string, content: string): Promise<string | false> {
        try {
            const platform = Capacitor.getPlatform();

            if (platform === 'android') {
                // Android: Save to 'Download' folder in External Storage
                return await writeUniqueFile({
                    path: 'Download/' + filename,
                    data: content,
                    directory: Directory.ExternalStorage,
                    encoding: Encoding.UTF8,
                    recursive: true
                });
            } else {
                // iOS: Save to Documents (accessible via Files app)
                return await writeUniqueFile({
                    path: filename,
                    data: content,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8
                });
            }
        } catch (e: any) {
            console.error('[MobileFileService] Save failed', e);
            throw new Error(e.message);
        }
    },

    /**
     * Pick a file using native file picker.
     * @returns File name and string content, or null if cancelled/not native.
     */
    async pickFile(): Promise<{ name: string; content: string } | null> {
        if (!Capacitor.isNativePlatform()) {
            return null;
        }

        try {
            const result = await FilePicker.pickFiles({
                types: ['application/json', 'text/csv'],
                readData: true
            });

            if (!result.files || result.files.length === 0) return null;

            const file = result.files[0];

            // data is base64
            if (!file.data) {
                throw new Error('Could not read file data. Please try again.');
            }

            // Decode base64
            const content = atob(file.data);

            return {
                name: file.name || 'imported_file',
                content: content
            };
        } catch (e: any) {
            // User cancelled
            if (e.message?.includes('canceled') || e.message?.includes('cancelled')) {
                return null;
            }
            console.error('[MobileFileService] Pick failed', e);
            throw new Error(e.message || 'Failed to pick file');
        }
    }
};
