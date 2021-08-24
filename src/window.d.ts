import Store from "./interfaces/store";

declare global { 
    interface Window {
        store: Store
    }
}