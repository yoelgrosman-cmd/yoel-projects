import HeroBanner from "@/components/home/HeroBanner";
import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import RLBrandSection from "@/components/home/RLBrandSection";
import BranchesSection from "@/components/home/BranchesSection";

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CategoryGrid />
      <FeaturedProducts />
      <RLBrandSection />
      <BranchesSection />
    </>
  );
}
