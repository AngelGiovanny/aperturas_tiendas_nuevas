import React from 'react';
import Navbar from "./Navbar";

interface LayoutProps {
    children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-auto">
                <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
                    <div className="h-full w-full animate-in">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Layout