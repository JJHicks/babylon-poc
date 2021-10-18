import * as msal from "@azure/msal-browser";

export class AuthManager{
    private _msalInstance: msal.PublicClientApplication;
    private static _instance: AuthManager;

    private constructor(){

        this._msalInstance = new msal.PublicClientApplication(msalConfig);
    }

    static getInstance(){
        if(!AuthManager._instance){
            AuthManager._instance = new AuthManager();
        }
        return AuthManager._instance;
    }

    public async logIn(){

        const accounts = this._msalInstance.getAllAccounts();

        if (accounts.length > 0) {
            this._msalInstance.setActiveAccount(accounts[0]);
        }

        this._msalInstance.addEventCallback((event: any) => {
            // set active account after redirect
            if (event.eventType === msal.EventType.LOGIN_SUCCESS && event.payload.account) {
                const account = event.payload.account;
                this._msalInstance.setActiveAccount(account);
            } else if (event.eventType === msal.EventType.LOGIN_FAILURE) {
                window.location.reload();
            }
        });

        // console.log("get active account", this._msalInstance.getActiveAccount());

        return this._msalInstance.handleRedirectPromise().then((tokenResponse) => {
            // If the tokenResponse !== null, then you are coming back from a successful authentication redirect. 
            const account = this._msalInstance.getActiveAccount();
            if(!account){                
                this._msalInstance.loginRedirect();
            }

            document.querySelectorAll(".logged-in-username").forEach(el => el.textContent = `Logged in as: ${account.name}`);

            return account;

        }).catch((error) => {
            console.error(error);
        });

    };

    public logOut(){
        this._msalInstance.logoutRedirect();
    }
}

const msalConfig = {
    auth: {
        clientId: "7c8b993f-bc45-4d3b-b219-97d5aff1dd22",
        authority: "https://uamcfarlandbridgeb2c.b2clogin.com/uamcfarlandbridgeb2c.onmicrosoft.com/B2C_1_sign_in_flow",
        knownAuthorities: ["uamcfarlandbridgeb2c.b2clogin.com"],
        // redirectUri: "http://localhost:8080", // You must register this URI on Azure Portal/App Registration. Defaults to "window.location.href".
    },
    cache: {
        cacheLocation: "sessionStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
        storeAuthStateInCookie: false, // If you wish to store cache items in cookies as well as browser cache, set this to "true".
    },
    system: {
        loggerOptions: {
          loggerCallback: (level: number, message: string, containsPii: boolean) => {
            if (containsPii) {
              return;
            }
            switch (level) {
              case msal.LogLevel.Error:
                console.error(message);
                return;
              case msal.LogLevel.Info:
                console.info(message);
                return;
              case msal.LogLevel.Verbose:
                console.debug(message);
                return;
              case msal.LogLevel.Warning:
                console.warn(message);
                return;
            }
          }
        }
    }
};

