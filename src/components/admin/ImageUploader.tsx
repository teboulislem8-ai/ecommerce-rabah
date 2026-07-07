"use client";

import { useState, useCallback, useId } from "react";
import Image from "next/image";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { GripVertical, X, Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ImageItem {
  id: string;
  file?: File;
  url?: string;
  previewUrl?: string;
}

interface ImageUploaderProps {
  existingImages?: { url: string }[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  existingImages = [],
  onChange,
  maxImages = 10,
}: ImageUploaderProps) {
  const uniqueId = useId();
  const [items, setItems] = useState<ImageItem[]>(() =>
    existingImages.map((img, i) => ({
      id: `${uniqueId}-existing-${i}`,
      url: img.url,
    })),
  );

  const notifyChange = useCallback(
    (updated: ImageItem[]) => {
      setItems(updated);
      onChange(updated);
    },
    [onChange],
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    notifyChange(reordered);
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxImages - items.length;
    const toAdd = files.slice(0, remaining);

    const newItems = toAdd.map((file) => ({
      id: `${uniqueId}-new-${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    notifyChange([...items, ...newItems]);
    e.target.value = "";
  };

  const handleRemove = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    notifyChange(items.filter((i) => i.id !== id));
  };

  const canAddMore = items.length < maxImages;

  return (
    <div className="space-y-3">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="images" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "flex flex-nowrap gap-3 overflow-x-auto rounded-lg border-2 border-dashed p-4 transition-colors min-h-[120px]",
                snapshot.isDraggingOver
                  ? "border-primary bg-primary/5"
                  : "border-border",
              )}
            >
              {items.length === 0 && (
                <div className="flex w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span>اسحب الصور هنا أو اضغط للإضافة</span>
                </div>
              )}

              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        "group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border transition-shadow",
                        snapshot.isDragging
                          ? "shadow-lg ring-2 ring-primary"
                          : "shadow-sm",
                      )}
                    >
                      <Image
                        src={item.previewUrl || item.url || ""}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />

                      <div
                        {...provided.dragHandleProps}
                        className="absolute top-0 start-0 flex cursor-grab items-center justify-center rounded-br-md bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-white" />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="absolute top-0 end-0 flex cursor-pointer items-center justify-center rounded-bl-md bg-red-500/80 p-1 opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>

                      <span className="absolute bottom-0 end-0 rounded-tl-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </Draggable>
              ))}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {canAddMore && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => document.getElementById(`image-input-${uniqueId}`)?.click()}
          >
            <Plus className="h-4 w-4" />
            إضافة صور
          </Button>
          <span className="text-xs text-muted-foreground">
            {items.length}/{maxImages}
          </span>
        </div>
      )}

      <input
        id={`image-input-${uniqueId}`}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />
    </div>
  );
}
