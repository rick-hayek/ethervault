import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    version: process.versions.electron,
});

console.log('EtherVault Preload Script Loaded');
