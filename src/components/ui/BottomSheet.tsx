import { Sheet } from "@silk-hq/components";
import "./BottomSheet.css";

interface BottomSheetProps {
    trigger?: React.ReactNode;
    title?: string;
    description?: string;
    children: React.ReactNode;
}

const BottomSheet = ({
    trigger = "Open Bottom Sheet",
    title = "Bottom Sheet",
    description,
    children
}: BottomSheetProps) => (
    <Sheet.Root license="commercial">
        <Sheet.Trigger asChild>
            {typeof trigger === 'string' ? <button>{trigger}</button> : trigger}
        </Sheet.Trigger>
        <Sheet.Portal>
            <Sheet.View 
                className="BottomSheet-view" 
                nativeEdgeSwipePrevention={true}
            >
                <Sheet.Backdrop 
                    className="BottomSheet-backdrop"
                    themeColorDimming="auto"
                    travelAnimation={{
                        opacity: ({ progress }) => Math.min(progress * 0.6, 0.6),
                        backdropFilter: ({ progress }) => `blur(${progress * 12}px)`
                    }}
                />
                <Sheet.Content className="BottomSheet-content">
                    <Sheet.BleedingBackground className="BottomSheet-bleedingBackground" />

                    {/* Header with drag handle */}
                    <div className="BottomSheet-header">
                        <div className="BottomSheet-dragHandle" />
                        <h2 className="BottomSheet-title">{title}</h2>
                        {description && (
                            <p className="BottomSheet-description">{description}</p>
                        )}
                    </div>

                    {/* Scrollable content */}
                    <div className="BottomSheet-scrollableContent">
                        {children}
                    </div>
                </Sheet.Content>
            </Sheet.View>
        </Sheet.Portal>
    </Sheet.Root>
);

export { BottomSheet };