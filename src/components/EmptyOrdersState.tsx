import { Button } from "@/components/ui/button";

interface EmptyOrdersStateProps {
  onBrowseProducts: () => void;
}

export function EmptyOrdersState({ onBrowseProducts }: EmptyOrdersStateProps) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-muted/20 p-8 text-center">
      <div>
        <p className="text-muted-foreground text-base">
          You haven&apos;t placed any orders yet.
        </p>
        <Button className="mt-4 cursor-pointer" onClick={onBrowseProducts}>
          Browse Products
        </Button>
      </div>
    </div>
  );
}
