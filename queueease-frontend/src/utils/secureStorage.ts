interface StorageItem {
    value: any;
    expiry: number;
}

export const secureStorage = {
    // Set item with expiration (default 1 day)
    setItem: (key: string, value: any, expiryHours: number = 24) => {
        const now = new Date();
        const item: StorageItem = {
            value,
            expiry: now.getTime() + (expiryHours * 60 * 60 * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    // Get item if not expired
    getItem: (key: string) => {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        try {
            const item: StorageItem = JSON.parse(itemStr);
            const now = new Date();
            
            // Check if expired
            if (now.getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch (e) {
            // For backwards compatibility, if item isn't in the correct format
            return itemStr;
        }
    },
    
    // Remove item
    removeItem: (key: string) => {
        localStorage.removeItem(key);
    },
    
    // Clear all items
    clear: () => {
        localStorage.clear();
    }
};