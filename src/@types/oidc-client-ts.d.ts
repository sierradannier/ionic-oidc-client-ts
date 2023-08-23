/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Required typings that are not publicly exported by oidc-client-ts library
 */

interface NavigateParams {
    url: string;
    nonce?: string;
    state?: string;
    response_mode?: 'query' | 'fragment';
    scriptOrigin?: string;
}

interface NavigateResponse {
    url: string;
}

interface IWindow {
    navigate: (params: NavigateParams) => Promise<NavigateResponse>;
    close: () => void;
}

interface IFrameWindowParams {
    silentRequestTimeoutInSeconds?: number;
}

interface RefreshState {
    data: unknown | undefined;
    refresh_token: string;
    id_token?: string;
    session_state: string | null;
    scope?: string;
    profile: any;
    resource?: string | string[];
}