/// <reference types="vite/client" />

// Declare image modules for TypeScript
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}
```

### **Step 2: Verify File Location**

Make sure your logo file is actually at:
```;
client / src / assets / mainlogo.png;
