import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Download, LogOut } from "lucide-react";
import type { QuestionnaireResponse } from "@shared/schema";

export default function Dashboard() {
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [_, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/login');
      return;
    }

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');

    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const response = await fetch('/api/user/responses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch responses');
      }

      const data = await response.json();
      setResponses(data);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/login');
  };

  const handleExport = async () => {
    // Create CSV content
    const csvContent = responses.map(response => ({
      'Personal Journey - Childhood': response.personalJourney?.childhood || '',
      'Personal Journey - Immigration': response.personalJourney?.immigration || '',
      'Personal Journey - Challenges': response.personalJourney?.challenges || '',
      'Personal Journey - Family Recipes': response.personalJourney?.familyRecipes || '',
      'Personal Journey - Influences': response.personalJourney?.influences || '',
      'Personal Journey - Customs': response.personalJourney?.customs || '',
      'Culinary Heritage - Signature Dishes': response.culinaryHeritage?.signatureDishes || '',
      'Culinary Heritage - Ingredients': response.culinaryHeritage?.ingredients || '',
      'Culinary Heritage - Techniques': response.culinaryHeritage?.techniques || '',
      'Culinary Heritage - Recipe Evolution': response.culinaryHeritage?.recipeEvolution || '',
      'Culinary Heritage - Fusion': response.culinaryHeritage?.fusion || '',
      'Culinary Heritage - Menu Philosophy': response.culinaryHeritage?.menuPhilosophy || '',
      'Business Development - Inspiration': response.businessDevelopment?.inspiration || '',
      'Business Development - Timeline': response.businessDevelopment?.timeline || '',
      'Business Development - Vision': response.businessDevelopment?.vision || '',
      'Business Development - Challenges': response.businessDevelopment?.challenges || '',
      'Business Development - Achievements': response.businessDevelopment?.achievements || '',
      'Business Development - Aspirations': response.businessDevelopment?.aspirations || '',
      'Community Connections - Customers': response.communityConnections?.customers || '',
      'Community Connections - Local Business': response.communityConnections?.localBusiness || '',
      'Community Connections - Events': response.communityConnections?.events || '',
      'Community Connections - Economy': response.communityConnections?.economy || '',
      'Community Connections - Jamaican Community': response.communityConnections?.jamaicanCommunity || '',
      'Language': response.language,
      'Last Saved': new Date(response.lastSaved).toLocaleString(),
    }));

    // Convert to CSV
    const headers = Object.keys(csvContent[0]);
    const csvRows = [
      headers.join(','),
      ...csvContent.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ];
    const csvString = csvRows.join('\n');

    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stories_export_${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#006400]">
            {isAdmin ? 'Admin Dashboard' : 'Your Stories Dashboard'}
          </h1>
          <div className="flex gap-4">
            {isAdmin && (
              <Button
                onClick={handleExport}
                className="bg-[#009B3A] hover:bg-[#006400]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Stories
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {responses.map((response, index) => (
            <motion.div
              key={response.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">
                    Story #{response.id}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(response.lastSaved).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Personal Journey */}
                    <div>
                      <h3 className="font-semibold mb-2">Personal Journey</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {response.personalJourney?.childhood || 'No content'}
                      </p>
                    </div>
                    {/* Culinary Heritage */}
                    <div>
                      <h3 className="font-semibold mb-2">Culinary Heritage</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {response.culinaryHeritage?.signatureDishes || 'No content'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}