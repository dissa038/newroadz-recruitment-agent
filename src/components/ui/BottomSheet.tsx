import { Sheet } from "@silk-hq/components";

interface BottomSheetProps {
    trigger?: React.ReactNode;
    title?: string;
    description?: string;
    children: React.ReactNode;
}

// Styles object - alle CSS in dit bestand
const styles = {
    view: {
        height: 'var(--silk-100-lvh-dvh-pct)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0',
        zIndex: 9998,
    } as React.CSSProperties,
    
    content: {
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '600px',
        height: 'auto',
        maxHeight: '95dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 9999,
    } as React.CSSProperties,
    
    bleedingBackground: {
        borderRadius: '24px 24px 0 0',
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 -10px 25px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)',
        position: 'absolute',
        inset: '0',
        zIndex: 9997,
    } as React.CSSProperties,
    
    header: {
        position: 'relative',
        zIndex: 10000,
        padding: '6px 20px 12px',
        borderBottom: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--card))',
        borderRadius: '24px 24px 0 0',
        flexShrink: 0,
    } as React.CSSProperties,
    
    dragHandle: {
        width: '40px',
        height: '4px',
        backgroundColor: 'hsl(var(--muted-foreground) / 0.3)',
        borderRadius: '2px',
        margin: '0 auto 8px',
        transition: 'background-color 0.2s ease',
        cursor: 'grab',
    } as React.CSSProperties,
    
    title: {
        fontSize: '1.5rem',
        fontWeight: 600,
        margin: '0',
        textAlign: 'center',
        color: 'hsl(var(--foreground))',
    } as React.CSSProperties,
    
    description: {
        fontSize: '0.875rem',
        color: 'hsl(var(--muted-foreground))',
        textAlign: 'center',
        margin: '8px 0 0 0',
        lineHeight: '1.4',
    } as React.CSSProperties,
    
    scrollableContent: {
        position: 'relative',
        zIndex: 10000,
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: 'hsl(var(--card))',
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent',
    } as React.CSSProperties,
    
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 1)',
        zIndex: 9996,
    } as React.CSSProperties,
};

const BottomSheet = ({
    trigger = "Open Bottom Sheet",
    title = "Bottom Sheet",
    description,
    children
}: BottomSheetProps) => (
    <>
        {/* Scrollbar styles - alleen geladen wanneer component gebruikt wordt */}
        <style dangerouslySetInnerHTML={{
            __html: `
                .bottom-sheet-scrollable::-webkit-scrollbar {
                    width: 6px;
                }
                .bottom-sheet-scrollable::-webkit-scrollbar-track {
                    background: transparent;
                }
                .bottom-sheet-scrollable::-webkit-scrollbar-thumb {
                    background: hsl(var(--muted-foreground) / 0.3);
                    border-radius: 3px;
                    transition: background 0.2s ease;
                }
                .bottom-sheet-scrollable::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--muted-foreground) / 0.5);
                }
            `
        }} />
        
        <Sheet.Root license="commercial">
            <Sheet.Trigger asChild>
                {typeof trigger === 'string' ? <button>{trigger}</button> : trigger}
            </Sheet.Trigger>
            <Sheet.Portal>
                <Sheet.View 
                    style={styles.view}
                    nativeEdgeSwipePrevention={true}
                >
                    <Sheet.Backdrop 
                        style={styles.backdrop}
                        themeColorDimming="auto"
                        travelAnimation={{
                            opacity: ({ progress }) => Math.min(progress * 0.6, 0.6),
                            backdropFilter: ({ progress }) => `blur(${progress * 12}px)`
                        }}
                    />
                    <Sheet.Content style={styles.content}>
                        <Sheet.BleedingBackground style={styles.bleedingBackground} />

                        {/* Header with drag handle */}
                        <div style={styles.header}>
                            <div 
                                style={styles.dragHandle}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--muted-foreground) / 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--muted-foreground) / 0.3)';
                                }}
                            />
                            <h2 style={styles.title}>{title}</h2>
                            {description && (
                                <p style={styles.description}>{description}</p>
                            )}
                        </div>

                        {/* Scrollable content */}
                        <div 
                            className="bottom-sheet-scrollable"
                            style={styles.scrollableContent}
                        >
                            {children}
                        </div>
                    </Sheet.Content>
                </Sheet.View>
            </Sheet.Portal>
        </Sheet.Root>
    </>
);

export { BottomSheet };