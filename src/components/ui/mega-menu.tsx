"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    ChevronDownIcon,
    PaletteIcon,
    CodeIcon,
    DatabaseIcon,
    ShieldIcon,
    ZapIcon,
    SmartphoneIcon,
    BookOpenIcon,
    GraduationCapIcon,
    RocketIcon,
    SettingsIcon,
    UsersIcon,
    TrendingUpIcon
} from "lucide-react";

interface MegaMenuProps {
    trigger: string;
    tabs: {
        id: string;
        label: string;
        content: {
            title: string;
            description: string;
            items: {
                icon: React.ReactNode;
                title: string;
                description: string;
                badge?: string;
            }[];
        };
    }[];
}

export function MegaMenu({ trigger, tabs }: MegaMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

    const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                {trigger}
                <ChevronDownIcon className="h-4 w-4" />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-[600px] bg-background border rounded-lg shadow-xl z-50"
                        onMouseEnter={() => setIsOpen(true)}
                        onMouseLeave={() => setIsOpen(false)}
                    >
                        <div className="flex">
                            {/* Tabs */}
                            <div className="w-48 border-r bg-muted/30 p-4">
                                <div className="space-y-1">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                activeTab === tab.id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-accent hover:text-accent-foreground"
                                            )}
                                            onMouseEnter={() => setActiveTab(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {activeContent && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold">{activeContent.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{activeContent.description}</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {activeContent.items.map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                                                        >
                                                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                {item.icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-medium text-sm">{item.title}</h4>
                                                                    {item.badge && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {item.badge}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                                    {item.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}