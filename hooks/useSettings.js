"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ExecutionMode } from "@/lib/config";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [executionMode, setExecutionMode] = useState(ExecutionMode.CLIENT);

  useEffect(() => {
    const saved = localStorage.getItem("layers_execution_mode");
    if (saved && Object.values(ExecutionMode).includes(saved)) {
      setExecutionMode(saved);
    }
  }, []);

  const updateExecutionMode = (mode) => {
    setExecutionMode(mode);
    localStorage.setItem("layers_execution_mode", mode);
  };

  return (
    <SettingsContext.Provider value={{ executionMode, updateExecutionMode }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
