import type { UserManagerSettings } from 'oidc-client-ts';

import type { MobileWindowParams } from './mobile-window-params.model';

/**
 * The ExtendedUserManagerSettings class
 * @public
 */
export interface ExtendedUserManagerSettings extends UserManagerSettings, MobileWindowParams
{
    mobileScheme?: string;
    retrieveUserSession?: boolean;
}