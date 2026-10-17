import { useState } from "react";

// Keeps browser-only preferences in sync with localStorage.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch (error) {
      console.warn(`Could not read localStorage key "${key}".`, error);
      return initialValue;
    }
  });

  const updateValue = (nextValue) => {
    setValue((current) => {
      const resolved = typeof nextValue === "function" ? nextValue(current) : nextValue;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch (error) {
        console.warn(`Could not save localStorage key "${key}".`, error);
      }
      return resolved;
    });
  };
  return [value, updateValue];
}
