import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { logger } from './logger';

export const IconService = {
    /**
     * Fetches the favicon for a given URL and returns it as a base64 string.
     * Uses Google's S2 service for reliability.
     */
    fetchIcon: async (urlStr: string): Promise<string | null> => {
        if (!urlStr) return null;

        let domain = '';
        try {
            const url = urlStr.includes('://') ? urlStr : `https://${urlStr}`;
            domain = new URL(url).hostname;
        } catch (e) {
            logger.warn('[IconService] Invalid URL:', urlStr);
            return null;
        }

        const fetchViaIpc = async (targetUrl: string) => {
            if (window.electronAPI?.utils?.fetchIcon) {
                return await window.electronAPI.utils.fetchIcon(targetUrl);
            }
            return null;
        };

        const fetchDirect = async (targetUrl: string) => {
            // Fallback for web (CORS might block this for external sites, but works for same-origin or permissive CORS)
            try {
                if (Capacitor.isNativePlatform()) {
                    const response = await CapacitorHttp.get({
                        url: targetUrl,
                        responseType: 'blob'
                    });
                    if (response.status !== 200 || !response.data) return null;
                    return `data:image/x-icon;base64,${response.data}`;
                } else {
                    const response = await fetch(targetUrl);
                    if (!response.ok) return null;
                    const blob = await response.blob();
                    return new Promise<string | null>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = () => resolve(null);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (e) {
                logger.error('[IconService] fetchDirect error:', e);
                return null;
            }
        };

        const performFetch = async (targetUrl: string) => {
            const ipcResult = await fetchViaIpc(targetUrl);
            if (ipcResult) return ipcResult;
            return await fetchDirect(targetUrl);
        };

        // 1. Try Google S2 (Primary)
        logger.info('[IconService] Strategy 1: Google S2 for', domain);
        const googleUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`;
        const googleIcon = await performFetch(googleUrl);
        if (googleIcon) {
            logger.info('[IconService] Strategy 1 Success');
            return googleIcon;
        }

        // 2. Try Direct /favicon.ico (Fallback)
        logger.info('[IconService] Strategy 2: Direct /favicon.ico for', domain);
        const directUrl = `https://${domain}/favicon.ico`;
        const directIcon = await performFetch(directUrl);
        if (directIcon) {
            logger.info('[IconService] Strategy 2 Success');
            return directIcon;
        }

        // 3. Try Redirect Resolution (Strategy 3)
        // If the domain itself redirects (e.g. gmail.com -> mail.google.com), try the resolved URL
        if (window.electronAPI?.utils?.getRedirectUrl) {
            logger.info('[IconService] Strategy 3: Checking for redirect...');
            try {
                const finalUrl = await window.electronAPI.utils.getRedirectUrl(`https://${domain}`);
                if (finalUrl) {
                    const newDomain = new URL(finalUrl).hostname;
                    if (newDomain && newDomain !== domain) {
                        logger.info('[IconService] Redirect found:', domain, '->', newDomain);

                        // Retry Strategy 1 with new domain
                        const retryGoogleUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${newDomain}&sz=64`;
                        const retryIcon = await performFetch(retryGoogleUrl);
                        if (retryIcon) {
                            logger.info('[IconService] Strategy 3 Success (Google S2 via Redirect)');
                            return retryIcon;
                        }

                        // Retry Strategy 2 with new domain
                        const retryDirectUrl = `https://${newDomain}/favicon.ico`;
                        const retryDirectIcon = await performFetch(retryDirectUrl);
                        if (retryDirectIcon) {
                            logger.info('[IconService] Strategy 3 Success (Direct via Redirect)');
                            return retryDirectIcon;
                        }
                    }
                }
            } catch (e) {
                logger.warn('[IconService] Strategy 3 failed:', e);
            }
        }

        logger.warn('[IconService] All strategies failed for', domain);
        return null;
    }
};
