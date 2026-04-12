/* eslint-disable react-refresh/only-export-components */
// Context files intentionally export both a Provider component and a hook.
import React, { createContext, useContext, useState } from "react";

const PremiumContext = createContext({
  isPremium: false,
  setIsPremium: () => {},
  onUpgrade: () => {},
});

export function PremiumProvider({ children, onUpgrade }) {
  const [isPremium, setIsPremiumState] = useState(() => {
    try {
      return localStorage.getItem("skydocket_premium") === "true";
    } catch {
      return false;
    }
  });

  function setIsPremium(value) {
    setIsPremiumState(value);
    try {
      localStorage.setItem("skydocket_premium", String(value));
    } catch {
      // ignore storage errors
    }
  }

  return (
    <PremiumContext.Provider value={{ isPremium, setIsPremium, onUpgrade }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
