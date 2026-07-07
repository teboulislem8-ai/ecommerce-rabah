"use client";

import { useState, useMemo, useEffect } from "react";

import { Progress } from "@/components/ui/progress";
import { useGetProductReviews, useCreateReview, useCurrentProfile, useUpdateCurrentProfile } from "@/hooks/queries";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductType, ReviewType } from "@/types";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ReviewedCard } from "./reviewed-card";
import { useTranslations } from "next-intl";

type ProductDetailsClientProps = {
  product: ProductType;
};

export function ReviewTab({ product }: ProductDetailsClientProps) {
  const { user } = useAuth();
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nickname, setNickname] = useState("");

  const { data: profile } = useCurrentProfile();
  const updateProfileMutation = useUpdateCurrentProfile();

  useEffect(() => {
    if (profile?.username && !nickname) {
      setNickname(profile.username);
    }
  }, [profile?.username]);

  const { data: reviewsData } = useGetProductReviews(product.product_id);

  const createReviewMutation = useCreateReview();

  // Ensure reviews is always an array (handle null/undefined) with stable reference
  const reviews = useMemo(() => reviewsData ?? [], [reviewsData]);

  // Check if current user has already reviewed
  const userReview = useMemo(() => {
    if (!user) return null;
    return (
      reviews.find((review: ReviewType) => review.user_id === user.id) || null
    );
  }, [reviews, user]);

  // Calculate real rating distribution from actual reviews
  const ratingDistribution = useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++;
      }
    });

    const total = reviews.length || 1;

    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      percentage: Math.round(
        (distribution[stars as keyof typeof distribution] / total) * 100,
      ),
      count: distribution[stars as keyof typeof distribution],
    }));
  }, [reviews]);

  // Calculate review stats from actual reviews
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    );
  }, [reviews]);

  const reviewCount = reviews.length;

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("الرجاء تسجيل الدخول");
      return;
    }

    if (!nickname.trim()) {
      toast.error("الرجاء كتابة اسم مستعار");
      return;
    }

    if (rating === 0) {
      toast.error("الرجاء اختيار تقييم");
      return;
    }

    if (!comment.trim()) {
      toast.error("الرجاء كتابة تعليق");
      return;
    }

    setIsSubmitting(true);
    try {
      if (nickname.trim() !== profile?.username) {
        await updateProfileMutation.mutateAsync({ username: nickname.trim() });
      }

      await createReviewMutation.mutateAsync({
        productId: product.product_id,
        rating,
        comment: comment.trim(),
      });

      toast.success("تم نشر التقييم بنجاح");
      setRating(0);
      setComment("");
      setHoveredRating(0);
      setShowReviewForm(false);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card>
        <CardContent className="p-6">
            <div className="mb-6 text-center">
            <div className="mb-2 text-4xl font-bold">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </div>
            {averageRating > 0 && RenderStars(averageRating)}
            <p className="text-muted-foreground mt-2 text-sm">
              {t("basedOnReviews", { count: reviewCount })}
            </p>
          </div>

          {reviewCount > 0 ? (
            <div className="space-y-3">
              {ratingDistribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <span className="w-6 text-sm">{item.stars}★</span>
                  <Progress value={item.percentage} className="flex-1" />
                  <span className="text-muted-foreground w-10 text-sm">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center text-sm">
              {t("noReviewsYet")}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4 lg:col-span-2">
        {/* Add Review Button */}
        {user && !userReview && !showReviewForm && (
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={() => setShowReviewForm(true)}
                className="w-full cursor-pointer sm:w-auto"
              >
                {t("writeAReview")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Review Form */}
        {user && !userReview && showReviewForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("writeAReview")}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReviewForm(false);
                    setRating(0);
                    setComment("");
                    setHoveredRating(0);
                  }}
                  className="cursor-pointer"
                >
                  {tc("cancel")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">{t("yourRating")}</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">الاسم المستعار</label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="اكتب اسمك المستعار"
                  className="h-9 text-sm"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t("yourReview")}
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("reviewPlaceholder")}
                  className="min-h-[100px]"
                  maxLength={500}
                />
                <div className="text-muted-foreground mt-1 text-sm">
                  {comment.length}/500 حرف
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReview}
                  disabled={!comment.trim() || rating === 0 || isSubmitting}
                  className="cursor-pointer"
                >
                  {isSubmitting ? tc("saving") : t("submitReview")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false);
                    setRating(0);
                    setComment("");
                    setHoveredRating(0);
                  }}
                  className="cursor-pointer"
                >
                  {tc("cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {user && userReview && (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm">
                {t("alreadyReviewed")}
              </p>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm">
                الرجاء تسجيل الدخول لكتابة تقييم
              </p>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <ReviewedCard productId={product.product_id} />
      </div>
    </div>
  );
}

export function RenderStars(rating: number, size: "sm" | "md" = "md") {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}
