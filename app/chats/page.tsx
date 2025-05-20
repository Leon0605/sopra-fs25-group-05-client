"use client";

import useLocalStorage from "@/hooks/useLocalStorage";
import ChatSummary from "@/components/ChatSummary";
import Navbar from "@/components/Navbar";

export default function ChatPage() {
    return (
        <>
            <Navbar />
            <div>
                <div>
                    <ChatSummary/>
                    <div>
                        {/* default */}
                    </div>
                </div>
            </div>
        </>
    );
}