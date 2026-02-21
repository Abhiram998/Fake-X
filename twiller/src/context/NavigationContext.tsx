"use client";
import React, { createContext, useContext, useState } from "react";

type NavigationContextType = {
    currentPage: string;
    navigate: (page: string) => void;
};

const NavigationContext = createContext<NavigationContextType>({
    currentPage: "home",
    navigate: () => { },
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [currentPage, setCurrentPage] = useState("home");
    return (
        <NavigationContext.Provider
            value={{ currentPage, navigate: setCurrentPage }}
        >
            {children}
        </NavigationContext.Provider>
    );
};
