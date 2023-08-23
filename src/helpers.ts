/**
 * The SigninMobileArgs class
 * @public
 */
export class Helpers {
    public static isCordova = (): boolean => !!((window as any).cordova || window.phonegap || window.PhoneGap);

    public static isCapacitor = (): boolean => !!(window.Capacitor?.isNativePlatform());

    public static isNativeMobile = (): boolean => Helpers.isCapacitor() || Helpers.isCordova();

    public static isUrlMatching = (url1: string, url2: string, matchQuery?: boolean): boolean => {
        url1 = url1 || '';
        url2 = url2 || '';
        const uri1 = new URL(url1, 'http://localhost');
        const uri2 = new URL(url2, 'http://localhost');
        if(uri1.origin !== uri2.origin) { return false; }
        if(uri1.pathname.split('/').filter(x => !!x).join('/') !== uri2.pathname.split('/').filter(x => !!x).join('/')){ return false; }
        if(!!matchQuery){
            const url1Query = this.toArray(uri1.searchParams);
            const url2Query = this.toArray(uri2.searchParams);
            if(url1Query.length !== url2Query.length) { return false; }
            if(url1Query.some(x => !url2Query.some(y => x.key === y.key && x.value === y.value))) { return false; }
        }
        return true;
    }

    private static toArray = (urlParams: URLSearchParams) : { key: string, value: string }[] => {
        let result: { key: string, value: string }[] = [];
        const entries = (urlParams as any).entries();
        for(let entry of entries){
            result.push({ key: entry[0], value: entry[1]});
        }
        return result;
    }
}