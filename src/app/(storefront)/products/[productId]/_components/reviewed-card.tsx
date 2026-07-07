"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { useGetProductReviews, useUpdateReview, useDeleteReview } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { RenderStars } from "./review-tab";
import { useAuth } from "@/context/AuthContext";
import { Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

type ReviewedCardProps = {
  productId: string;
};

export function ReviewedCard({ productId }: ReviewedCardProps) {
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
  } = useGetProductReviews(productId);
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoveredRating, setEditHoveredRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  const startEditing = (review: { id: number; rating: number; comment?: string }) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setEditHoveredRating(0);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditRating(0);
    setEditComment("");
    setEditHoveredRating(0);
  };

  const handleUpdate = async (reviewId: number) => {
    if (editRating === 0) {
      toast.error("الرجاء اختيار تقييم");
      return;
    }
    if (!editComment.trim()) {
      toast.error("الرجاء كتابة تعليق");
      return;
    }
    try {
      await updateReviewMutation.mutateAsync({
        id: reviewId,
        rating: editRating,
        comment: editComment.trim(),
      });
      toast.success("تم تحديث التقييم بنجاح");
      cancelEditing();
    } catch {
      toast.error("فشل تحديث التقييم");
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا التقييم؟")) return;
    try {
      await deleteReviewMutation.mutateAsync({ id: reviewId, productId });
      toast.success("تم حذف التقييم بنجاح");
    } catch {
      toast.error("فشل حذف التقييم");
    }
  };

  if (reviewsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reviewsData?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{t("noReviewsYet")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviewsData?.map((review) => {
        const isOwn = user && review.user_id === user.id;
        const isEditing = editingId === review.id;

        return (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <div className="bg-primary/10 flex h-full w-full items-center justify-center">
                    <span className="text-sm font-medium">
                      {review.profile?.username?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                </Avatar>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h4 className="font-medium">
                      {review.profile?.username || tc("na")}
                    </h4>
                    {!isEditing && RenderStars(review.rating, "sm")}
                    {review.created_at && !isEditing && (
                      <span className="text-muted-foreground text-sm">
                        {format(new Date(review.created_at), "yyyy/MM/dd")}
                      </span>
                    )}
                    {isOwn && !isEditing && (
                      <div className="flex gap-1 me-auto">
                        <button
                          type="button"
                          onClick={() => startEditing(review)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer p-1 transition-colors"
                          title={tc("edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(review.id)}
                          className="text-muted-foreground hover:text-red-600 cursor-pointer p-1 transition-colors"
                          title={tc("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                            onMouseEnter={() => setEditHoveredRating(star)}
                            onMouseLeave={() => setEditHoveredRating(0)}
                            className="cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`h-5 w-5 transition-colors ${
                                star <= (editHoveredRating || editRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        className="min-h-[80px]"
                        maxLength={500}
                      />
                      <div className="text-muted-foreground text-xs">
                        {editComment.length}/500 حرف
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(review.id)}
                          disabled={!editComment.trim() || editRating === 0 || updateReviewMutation.isPending}
                          className="cursor-pointer"
                        >
                          {updateReviewMutation.isPending ? tc("saving") : tc("save")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                          className="cursor-pointer"
                        >
                          {tc("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    review.comment && (
                      <p className="text-muted-foreground">{review.comment}</p>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
