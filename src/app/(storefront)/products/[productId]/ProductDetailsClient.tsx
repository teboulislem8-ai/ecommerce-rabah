"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ProductType } from "@/types";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Minus, Plus, MessageCircle, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { setPendingOrder } from "@/utils/createCODOrder";
import { createOrderAction } from "@/app/actions/order";
import { ReviewTab } from "./_components/review-tab";
import { useAuth } from "@/context/AuthContext";

type ProductDetailsClientProps = {
  product: ProductType;
};

export default function ProductDetailsClient({
  product,
}: ProductDetailsClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const router = useRouter();

  // Get product images from gallery or fall back to single image
  const productImages = product.images?.length
    ? product.images.map((img) => img.url)
    : product.image
      ? [product.image]
      : ["/placeholder-product.jpg"];

  const t = useTranslations();
  const pd = useTranslations("productDetails");

  const handleCODOrder = async () => {
    const total = product.price * quantity;

    if (user) {
      const result = await createOrderAction({
        productId: product.product_id,
        quantity,
        price: Number(product.price),
        total: Number(total),
        title: product.title,
      });

      if (result.success) {
        window.location.href = result.whatsappUrl;
      } else {
        console.error("[order] handleCODOrder failed:", result.details);
        toast.error(result.error);
      }
      return;
    }

    setPendingOrder({
      title: product.title,
      quantity,
      price: product.price,
      total,
      productId: product.product_id,
    });
    router.push("/signup");
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + productImages.length) % productImages.length,
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = product.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ الرابط");
      } catch {
        toast.error("فشل نسخ الرابط");
      }
    }
  };

  return (
    <div className="bg-background min-h-full">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImageIndex}
                  className="relative h-full w-full"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  {product.image ? (
                    <Image
                      src={productImages[selectedImageIndex]}
                      alt={product.title}
                      fill
                      className="object-contain p-4"
                      priority
                    />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center">
                      <span className="text-muted-foreground text-sm">
                        {pd("noImage")}
                      </span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {productImages.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-background/80 absolute top-1/2 start-4 -translate-y-1/2 backdrop-blur-sm"
                    onClick={prevImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-background/80 absolute top-1/2 end-4 -translate-y-1/2 backdrop-blur-sm"
                    onClick={nextImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="icon"
                className="bg-background/80 absolute top-4 end-4 cursor-pointer backdrop-blur-sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <motion.button
                    key={index}
                    className={`aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImageIndex === index
                        ? "border-primary"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      width={100}
                      height={100}
                      className="h-full w-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <motion.h1
                className="text-foreground mb-2 text-3xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {product.title}
              </motion.h1>

              {/* <motion.div
                className="mb-4 flex items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <RenderStars rating={product.rating || 0} size="sm" />
              </motion.div> */}

              <motion.div
                className="mb-6 flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                  <span className="text-foreground text-3xl font-bold">
                  DA {product.price.toFixed(2)}
                </span>
                {product.stock > 0 ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {pd("inStockWithCount", { stock: product.stock })}
                  </Badge>
                ) : (
                  <Badge variant="destructive">{pd("outOfStock")}</Badge>
                )}
              </motion.div>
            </div>

            <motion.p
              className="text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {product.description}
            </motion.p>

            {/* Quantity and Add to Cart */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div>
                <h3 className="mb-3 font-medium">{pd("quantity")}</h3>
                <div className="flex items-center gap-3">
                  <div className="border-border flex items-center rounded-lg border">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[60px] px-4 py-2 text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      className="cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {pd("itemsAvailable", { count: product.stock })}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full cursor-pointer"
                disabled={!product.stock || product.stock === 0}
                onClick={handleCODOrder}
              >
                <MessageCircle className="ms-2 h-4 w-4" />
                {t("product.orderViaWhatsApp")} - DA {(product.price * quantity).toFixed(2)}
              </Button>
            </motion.div>

            {/* Shipping Info */}
            <motion.div
              className="border-border grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
            </motion.div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Tabs defaultValue="description" className="mb-12">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description">{t("product.description")}</TabsTrigger>
              <TabsTrigger value="reviews">{t("product.reviews")}</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {product.description}
                    </p>
                    {product.sku && (
                      <div className="border-border mt-4 border-t pt-4">
                        <p className="text-muted-foreground text-sm">
                          <strong>{pd("sku")}</strong> {product.sku}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
                <ReviewTab product={product} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
