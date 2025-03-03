import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { 
  Utensils, 
  Phone, 
  CreditCard, 
  Clock, 
  Heart,
  ChefHat,
  Globe,
  Users
} from "lucide-react";

const featureItems = [
  {
    icon: Utensils,
    title: "Online Ordering",
    description: "Order your favorite Jamaican dishes for pickup or delivery"
  },
  {
    icon: Phone,
    title: "Phone Services",
    description: "Call ahead ordering and reservations made easy"
  },
  {
    icon: CreditCard,
    title: "Bill Pay",
    description: "Secure and convenient payment for to-go orders"
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Track your order status and estimated pickup time"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export default function Landing() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-[#006400] mb-6">
            Share Your Jamaican Spicy Bar and Grill Story
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're creating a unique digital experience that celebrates your journey from Jamaica 
            to establishing the Jamaican Spicy Bar and Grill in the US Virgin Islands. Your story will inspire 
            and connect with customers in meaningful ways.
          </p>
        </motion.div>

        {/* Process Cards */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="border-2 border-[#FED100] h-full">
              <CardContent className="p-6 text-center">
                <Heart className="w-12 h-12 text-[#009B3A] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Share Your Story</h3>
                <p className="text-gray-600">
                  Through our culturally-authentic questionnaire, tell us about your journey, 
                  recipes, and traditions.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-2 border-[#FED100] h-full">
              <CardContent className="p-6 text-center">
                <ChefHat className="w-12 h-12 text-[#009B3A] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Showcase Your Cuisine</h3>
                <p className="text-gray-600">
                  We'll create a beautiful website that highlights your authentic 
                  Jamaican dishes and cultural heritage.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-2 border-[#FED100] h-full">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 text-[#009B3A] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Grow Your Business</h3>
                <p className="text-gray-600">
                  Expand your reach with modern ordering and payment systems while 
                  maintaining your authentic charm.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 text-[#006400]">
            Coming Soon to Your Digital Restaurant
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureItems.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index }}
              >
                <feature.icon className="w-12 h-12 text-[#009B3A] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/login">
            <Button 
              size="lg" 
              className="bg-[#009B3A] hover:bg-[#006400] text-white px-8 py-6 text-xl"
            >
              Start Sharing Your Story
            </Button>
          </Link>
          <p className="mt-4 text-gray-600">
            Takes about 30-45 minutes • Save progress anytime • Available in English and Patois
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}