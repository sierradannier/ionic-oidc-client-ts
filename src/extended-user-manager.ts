import type {
    CreateSigninRequestArgs, ExtraSignoutRequestArgs, RedirectParams, SigninPopupArgs,
    IFrameWindowParams, SigninRedirectArgs, SignoutPopupArgs, SignoutRedirectArgs, 
    SignoutSilentArgs, UseRefreshTokenArgs, UserManagerSettings,
    ExtraSigninRequestArgs
} from 'oidc-client-ts';
import {
    User, UserManager
} from 'oidc-client-ts';

import { MobileNavigator } from './mobile/mobile-navigator';
import type { MobileWindowParams } from './models/mobile-window-params.model';
import type { ExtendedUserManagerSettings } from './models/extended-user-manager-settings.model';

/**
 * The SigninMobileArgs class
 * @public
 */
export type SigninMobileArgs = MobileWindowParams & ExtraSigninRequestArgs;

/**
 * The SignoutMobileArgs class
 * @public
 */
export type SignoutMobileArgs = MobileWindowParams & ExtraSignoutRequestArgs;

/**
 * Extended UserManager class that adds helpers and mobile capabilities
 * (ex: signinMobile, signoutMobile, MobileNavigator, MobileWindow)
 * @public
 */
export class ExtendedUserManager extends UserManager {
    private _mobileNavigator!: MobileNavigator;

    constructor(
        public libSettings: ExtendedUserManagerSettings
    ) {
        super({
            ...libSettings
        } as UserManagerSettings);

        this._mobileNavigator = new MobileNavigator();
    }

    public async signinMobile(args: SigninMobileArgs = {}): Promise<User | null> {
        const logger = this._logger.create('signinMobile');

        const {
            mobileWindowToolbarColor,
            mobileWindowPresentationStyle,
            mobileWindowWidth,
            mobileWindowHeight,
            ...requestArgs
        } = args;

        const params: MobileWindowParams = {
            mobileWindowToolbarColor: mobileWindowToolbarColor ?? this.libSettings.mobileWindowToolbarColor,
            mobileWindowPresentationStyle: mobileWindowPresentationStyle ?? this.libSettings.mobileWindowPresentationStyle,
            mobileWindowWidth: mobileWindowWidth ?? this.libSettings.mobileWindowWidth,
            mobileWindowHeight: mobileWindowHeight ?? this.libSettings.mobileWindowHeight
        };

        const handle = this._mobileNavigator.prepare(this.settings.redirect_uri, params);

        const user = await this._signin({
            request_type: 'si:m',
            redirect_uri: this.settings.redirect_uri,
            ...requestArgs
        }, handle);
        
        if (user) {
            if (user.profile?.sub) {
                logger.info("success, signed in subject", user.profile.sub);
            }
            else {
                logger.info("no subject");
            }
        }

        return user;
    }

    public async signoutMobile(args: SignoutMobileArgs = {}): Promise<void> {
        const logger = this._logger.create("signoutMobile");

        const {
            mobileWindowToolbarColor,
            mobileWindowPresentationStyle,
            mobileWindowWidth,
            mobileWindowHeight,
            ...requestArgs
        } = args;

        const params: MobileWindowParams = {
            mobileWindowToolbarColor: mobileWindowToolbarColor ?? this.libSettings.mobileWindowToolbarColor,
            mobileWindowPresentationStyle: mobileWindowPresentationStyle ?? this.libSettings.mobileWindowPresentationStyle,
            mobileWindowWidth: mobileWindowWidth ?? this.libSettings.mobileWindowWidth,
            mobileWindowHeight: mobileWindowHeight ?? this.libSettings.mobileWindowHeight
        };

        const handle = await this._mobileNavigator.prepare(this.settings.post_logout_redirect_uri as string, params);

        await this._signout({
            request_type: "so:m",
            post_logout_redirect_uri: this.settings.post_logout_redirect_uri,
            ...requestArgs,
        }, handle);
        
        logger.info("success");
    }
}