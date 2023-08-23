import type { PluginListenerHandle } from '@capacitor/core';
import { Logger } from 'oidc-client-ts';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

import { Helpers } from '../helpers';
import type { MobileWindowParams } from '../models/mobile-window-params.model';

const CUSTOM_URL_SCHEME_HANDLER_TIMEOUT = 10 * 1000; // 10s
const CAPACITOR_BROWSER = Browser;

/**
 * @internal
 */
export class MobileWindow implements IWindow {
    private readonly _logger = new Logger('MobileWindow');

    private capacitorAppUrlOpenHandle?: PluginListenerHandle;
    private capacitorBrowserFinishedHandle?: PluginListenerHandle;

    private _window?: WindowProxy | null;

    private originalHandleOpenURL = window.handleOpenURL;

    private timer?: number;
    private navigateLogger?: Logger;
    private _resolve?: (value: NavigateResponse) => void;
    private _reject?: (reason?: unknown) => void;

    constructor(
        public redirectUrl: string,
        public params: MobileWindowParams
    ) {
        if (!Helpers.isCapacitor() && !Helpers.isCordova()) {
            console.error('Please install either `@capacitor/browser` or `cordova` dependency.');
        }

        if (Browser) {
            this._logger.debug('Using `@capacitor/browser` implementation');
        } else{
            this._logger.debug('Using `cordova` implementation');
        }
    }

    public async navigate(params: NavigateParams): Promise<NavigateResponse> {
        this.navigateLogger = this._logger.create('navigate');
        this.navigateLogger.debug('url', params.url);

        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            void this.addCustomUrlSchemeHandler()
                .then(() => {
                    void this.openBrowser(params);
                });
        });
    }

    public async close(): Promise<void> {
        const logger = this._logger.create('close');

        await Browser?.close().catch(err => logger.error(err));
        
        if (this._window) {
            if (!this._window.closed) {
                this._window.close();
            }
        }
        this._window = null;

        logger.debug('success');
    }

    private async cleanup(): Promise<void> {
        const logger = this._logger.create('cleanup');
        window.handleOpenURL = this.originalHandleOpenURL;
        await this.capacitorBrowserFinishedHandle?.remove();
        await this.capacitorAppUrlOpenHandle?.remove();
        clearTimeout(this.timer);
        logger.debug('success');
    }

    private async onError(message: string): Promise<void> {
        this.navigateLogger?.error('error response:', message);
        await this.cleanup();
        await this.close();
        this._reject?.(new Error(message));
    }

    private async onSuccess(url: string): Promise<void> {
        this.navigateLogger?.debug('successful response:', url);
        await this.cleanup();
        await this.close();
        this._resolve?.({ url });
    }

    private async openBrowser(params: NavigateParams): Promise<void> {

        if(Helpers.isCapacitor()){
            this.capacitorBrowserFinishedHandle = await CAPACITOR_BROWSER?.addListener(
                'browserFinished',
                (): void => void this.onError('Capacitor browser closed by user')
            );
    
            await Browser?.open({
                url: params.url,
                toolbarColor: this.params.mobileWindowToolbarColor,
                presentationStyle: this.params.mobileWindowPresentationStyle,
                width: this.params.mobileWindowWidth,
                height: this.params.mobileWindowWidth
            });
        } else if (Helpers.isCordova()){
            this._window = window.open(params.url, '_blank', 'location=yes');
        }

    }

    private async addCustomUrlSchemeHandler(): Promise<void> {
        const logger = this._logger.create('addCustomUrlSchemeHandler');

        // Set a timeout in case no response is received
        this.timer = setTimeout(
            () => void this.onError('Add custom url scheme handler, timed out without a response'),
            CUSTOM_URL_SCHEME_HANDLER_TIMEOUT
        ) as any;

        // Clean-up
        await this.cleanup();

        // Add handler
        if (Helpers.isCapacitor()) {
            logger.debug('listening to Capacitor `appUrlOpen` event');

            this.capacitorAppUrlOpenHandle = await App?.addListener?.(
                'appUrlOpen',
                ({ url }): void => {
                    if (Helpers.isUrlMatching(url, this.redirectUrl)) {
                        void this.onSuccess(url);
                    }
                }
            );
        } else if (Helpers.isCordova()) {
            logger.debug('waiting for Cordova `handleOpenURL` callback');

            window.handleOpenURL = (url: string): void => {
                this.originalHandleOpenURL?.(url);
                if (Helpers.isUrlMatching(url, this.redirectUrl)) {
                    void this.onSuccess(url);
                }
            };
        }

        logger.debug('success');
    }
}