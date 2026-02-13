import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import AICanvasDemo from "@/components/canvas/AICanvasDemo";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <AICanvasDemo />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
