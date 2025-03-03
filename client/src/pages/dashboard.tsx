import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Download, LogOut, Play, Pause } from "lucide-react";
import type { Response } from "@shared/schema";

export default function Dashboard() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [_, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/login');
      return;
    }

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
    console.log('User role:', user.role);

    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      console.log('Fetching responses...');
      const response = await fetch('/api/user/responses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch responses');
      }

      const data = await response.json();
      console.log('Fetched responses:', data);
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

  const handlePlayAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      const audio = document.getElementById(audioUrl) as HTMLAudioElement;
      audio?.pause();
    } else {
      // Stop any currently playing audio
      if (playingAudio) {
        const currentAudio = document.getElementById(playingAudio) as HTMLAudioElement;
        currentAudio?.pause();
      }
      setPlayingAudio(audioUrl);
      const audio = document.getElementById(audioUrl) as HTMLAudioElement;
      audio?.play();
    }
  };

  const handleExportCSV = async () => {
    // Create CSV content
    const csvContent = responses.map(response => ({
      'Text Response': response.textResponse || '',
      'Audio URL': response.audioUrl || '',
      'Transcription': response.transcription || '',
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

  const handleExportMarkdown = () => {
    let markdownContent = `# Jamaican Spicy Bar and Grill Stories Export\n\n`;
    markdownContent += `Generated on: ${new Date().toLocaleString()}\n\n`;

    responses.forEach((response, responseIndex) => {
      markdownContent += `## Response #${responseIndex + 1}\n\n`;
      markdownContent += `- Text Response: ${response.textResponse || "*No response provided*" }\n`;
      markdownContent += `- Audio URL: ${response.audioUrl || "*No audio provided*" }\n`;
      markdownContent += `- Transcription: ${response.transcription || "*No transcription provided*" }\n\n`;
      markdownContent += `---\n\n`;
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stories_export_${new Date().toISOString()}.md`;
    link.click();
  };


  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#006400]">
            {isAdmin ? 'Admin Dashboard' : 'Your Story Responses'}
          </h1>
          {isAdmin && (
            <>
              <Button
                onClick={handleExportMarkdown}
                className="bg-[#009B3A] hover:bg-[#006400]"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as Markdown
              </Button>
              <Button
                onClick={handleExportCSV}
                className="bg-[#009B3A] hover:bg-[#006400]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
            </>
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

        <div className="grid gap-6">
          {responses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No responses found. Start sharing your story to see them here.
              </CardContent>
            </Card>
          ) : (
            responses.map((response, index) => (
              <motion.div
                key={response.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">
                      Response #{response.id}
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Text Response */}
                      <div>
                        <h3 className="font-medium mb-2">Written Response:</h3>
                        <p className="text-gray-700">{response.textResponse}</p>
                      </div>

                      {/* Audio Recording */}
                      {response.audioUrl && (
                        <div>
                          <h3 className="font-medium mb-2">Audio Recording:</h3>
                          <audio id={response.audioUrl} src={response.audioUrl} className="hidden" />
                          <Button
                            onClick={() => handlePlayAudio(response.audioUrl!)}
                            variant="outline"
                            size="sm"
                          >
                            {playingAudio === response.audioUrl ? (
                              <><Pause className="w-4 h-4 mr-2" /> Pause</>
                            ) : (
                              <><Play className="w-4 h-4 mr-2" /> Play Recording</>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Transcription */}
                      {response.transcription && (
                        <div>
                          <h3 className="font-medium mb-2">Transcription:</h3>
                          <p className="text-gray-700">{response.transcription}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}