import { sys } from 'cc';

/**
 * 平台类型
 */
export type Platform = 'web' | 'android' | 'ios' | 'unknown';

/**
 * 原生桥接 - 封装跨平台功能（复制、分享等）
 */
export class NativeBridge {
    /**
     * 获取当前平台
     */
    static getPlatform(): Platform {
        if (sys.isBrowser) {
            return 'web';
        }
        if (sys.isNative) {
            if (sys.os === sys.OS.ANDROID) {
                return 'android';
            }
            if (sys.os === sys.OS.IOS) {
                return 'ios';
            }
        }
        return 'unknown';
    }

    /**
     * 复制文本到剪贴板
     * @param text 要复制的文本
     * @returns 是否成功
     */
    static async copyToClipboard(text: string): Promise<boolean> {
        const platform = this.getPlatform();

        try {
            switch (platform) {
                case 'web':
                    return await this.webCopyToClipboard(text);
                case 'android':
                    return this.androidCopyToClipboard(text);
                case 'ios':
                    return this.iosCopyToClipboard(text);
                default:
                    console.warn('[NativeBridge] 不支持的平台');
                    return false;
            }
        } catch (error) {
            console.error('[NativeBridge] 复制失败:', error);
            return false;
        }
    }

    /**
     * 分享内容
     * @param title 分享标题
     * @param text 分享文本
     * @param url 分享链接（可选）
     * @returns 是否成功
     */
    static async share(title: string, text: string, url?: string): Promise<boolean> {
        const platform = this.getPlatform();

        try {
            switch (platform) {
                case 'web':
                    return await this.webShare(title, text, url);
                case 'android':
                    return this.androidShare(title, text, url);
                case 'ios':
                    return this.iosShare(title, text, url);
                default:
                    console.warn('[NativeBridge] 不支持的平台');
                    return false;
            }
        } catch (error) {
            console.error('[NativeBridge] 分享失败:', error);
            return false;
        }
    }

    /**
     * 检查是否支持原生分享
     */
    static canShare(): boolean {
        const platform = this.getPlatform();
        
        if (platform === 'web') {
            return typeof navigator !== 'undefined' && 'share' in navigator;
        }
        
        // 原生平台通常都支持系统分享
        return platform === 'android' || platform === 'ios';
    }

    // ============ Web 平台实现 ============

    private static async webCopyToClipboard(text: string): Promise<boolean> {
        if (typeof navigator === 'undefined') return false;

        // 优先使用 Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // 降级方案：使用 execCommand
        return this.fallbackCopyToClipboard(text);
    }

    private static fallbackCopyToClipboard(text: string): boolean {
        if (typeof document === 'undefined') return false;

        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (err) {
            document.body.removeChild(textArea);
            return false;
        }
    }

    private static async webShare(title: string, text: string, url?: string): Promise<boolean> {
        if (typeof navigator === 'undefined') return false;

        // 使用 Web Share API
        if (navigator.share) {
            const shareData: ShareData = { title, text };
            if (url) shareData.url = url;

            await navigator.share(shareData);
            return true;
        }

        // 降级方案：复制到剪贴板
        const shareText = url ? `${text}\n${url}` : text;
        const copied = await this.webCopyToClipboard(shareText);
        if (copied) {
            console.log('[NativeBridge] 已复制到剪贴板，请手动分享');
        }
        return copied;
    }

    // ============ Android 平台实现 ============

    private static androidCopyToClipboard(text: string): boolean {
        // 调用 Android 原生方法
        // 需要在 Android 端实现 JsbBridge 或使用 jsb.reflection
        try {
            if (typeof jsb !== 'undefined' && jsb.reflection) {
                jsb.reflection.callStaticMethod(
                    'com/game/utils/ClipboardHelper',
                    'copyToClipboard',
                    '(Ljava/lang/String;)V',
                    text
                );
                return true;
            }
        } catch (e) {
            console.warn('[NativeBridge] Android 复制功能未实现原生桥接');
        }
        return false;
    }

    private static androidShare(title: string, text: string, url?: string): boolean {
        // 调用 Android 系统分享
        try {
            if (typeof jsb !== 'undefined' && jsb.reflection) {
                const shareText = url ? `${text}\n${url}` : text;
                jsb.reflection.callStaticMethod(
                    'com/game/utils/ShareHelper',
                    'share',
                    '(Ljava/lang/String;Ljava/lang/String;)V',
                    title,
                    shareText
                );
                return true;
            }
        } catch (e) {
            console.warn('[NativeBridge] Android 分享功能未实现原生桥接');
        }
        return false;
    }

    // ============ iOS 平台实现 ============

    private static iosCopyToClipboard(text: string): boolean {
        // 调用 iOS 原生方法
        try {
            if (typeof jsb !== 'undefined' && jsb.reflection) {
                jsb.reflection.callStaticMethod(
                    'ClipboardHelper',
                    'copyToClipboard:',
                    text
                );
                return true;
            }
        } catch (e) {
            console.warn('[NativeBridge] iOS 复制功能未实现原生桥接');
        }
        return false;
    }

    private static iosShare(title: string, text: string, url?: string): boolean {
        // 调用 iOS 系统分享
        try {
            if (typeof jsb !== 'undefined' && jsb.reflection) {
                const shareText = url ? `${text}\n${url}` : text;
                jsb.reflection.callStaticMethod(
                    'ShareHelper',
                    'shareWithTitle:text:',
                    title,
                    shareText
                );
                return true;
            }
        } catch (e) {
            console.warn('[NativeBridge] iOS 分享功能未实现原生桥接');
        }
        return false;
    }
}

// 声明 jsb 全局变量（Cocos 原生环境）
declare const jsb: {
    reflection?: {
        callStaticMethod(className: string, methodName: string, ...args: any[]): any;
    };
};
