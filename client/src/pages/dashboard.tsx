import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Play, Pause, RotateCcw, Trash2, Edit, ClipboardCheck, PlusCircle } from "lucide-react";
import type { Response, Question } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [_, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentResponse, setCurrentResponse] = useState<Response | null>(null);
  const [audioRef, setAudioRef] = useState<React.RefObject<HTMLAudioElement> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/login');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');

    fetchResponses();
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

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

  const handlePlayAudio = (audioId: string) => {
    if (playingAudio === audioId) {
      const audio = document.getElementById(audioId) as HTMLAudioElement;
      if (audio) {
        audio.pause();
        setPlayingAudio(null);
      }
    } else {
      if (playingAudio) {
        const currentAudio = document.getElementById(playingAudio) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
        }
      }
      const audio = document.getElementById(audioId) as HTMLAudioElement;
      if (audio) {
        audio.play();
        setPlayingAudio(audioId);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmText !== "Delete Forever") {
      toast({
        title: "Incorrect confirmation text",
        description: 'Please type "Delete Forever" to confirm deletion',
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/user/responses', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete responses');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/user/responses'] });

      setResponses([]);
      setShowSecondConfirm(false);
      setDeleteConfirmText("");

      toast({
        title: "All responses deleted",
        description: "Your responses have been permanently deleted",
      });
    } catch (error) {
      console.error('Error deleting responses:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete responses. Please try again.",
        variant: "destructive"
      });
    }
  };

  const editResponse = (questionId: number) => {
    setLocation(`/questionnaire?question=${questionId}`);
  };

  const handleEditResponse = (response: Response) => {
    setCurrentResponse(response);
    editResponse(response.questionId);
  };

  const togglePlayback = (audioUrl: string | null) => {
    if (!audioUrl) return;

    if (playingAudio === audioUrl) {
      const audio = document.getElementById(audioUrl) as HTMLAudioElement;
      if (audio) {
        audio.pause();
        setPlayingAudio(null);
      }
    } else {
      if (playingAudio) {
        const currentAudio = document.getElementById(playingAudio) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
        }
      }
      const audio = document.getElementById(audioUrl) as HTMLAudioElement;
      if (audio) {
        audio.play();
        setPlayingAudio(audioUrl);
      }
    }
  };

  const handleGoToQuestionnaire = () => {
    setLocation('/home');
  };

  const handleDeleteResponse = async (responseId: number) => {
    try {
      const response = await fetch(`/api/responses/${responseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete response');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/user/responses'] });
      setResponses(responses.filter(r => r.id !== responseId));
      toast({ title: 'Response deleted successfully!' });
    } catch (error) {
      console.error('Error deleting response:', error);
      toast({ title: 'Error deleting response', variant: 'destructive' });
    }
  };


  const filteredResponses = responses.filter(response =>
    response.textResponse && response.textResponse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#006400]">
            {isAdmin ? "Admin Dashboard" : "Your Responses"}
          </h1>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search responses..."
              className="w-full sm:w-[200px]"
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Button
              onClick={handleGoToQuestionnaire}
              variant="outline"
              className="w-full sm:w-auto bg-[#009B3A] text-white hover:bg-[#006400]"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Questionnaire
            </Button>

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResponses.map((response) => {
            const question = questions.find(q => q.id === response.questionId);
            return (
              <Card key={response.id} className="overflow-hidden">
                <CardHeader className="bg-amber-50 border-b p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-amber-900">
                      {question?.text || `Question ${response.questionId}`}
                    </h3>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-700"
                        onClick={() => handleEditResponse(response)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => setCurrentResponse(response)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Response</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this response? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteResponse(response.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {response.textResponse || "No text response provided."}
                    </p>
                  </div>

                  {response.audioUrl && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Audio Recording</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 rounded-full"
                          onClick={() => response.audioUrl && togglePlayback(response.audioUrl)}
                        >
                          {playingAudio === response.audioUrl ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {response.transcriptions && Array.isArray(response.transcriptions) && response.transcriptions.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <p><strong>Transcription:</strong></p>
                          <p className="whitespace-pre-wrap">{response.transcriptions[0]}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredResponses.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-lg border">
            <p className="text-gray-500">No responses found.</p>
          </div>
        )}

        {/* Add New Response Button */}
        <div className="flex justify-center mt-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleGoToQuestionnaire}
              className="bg-[#009B3A] hover:bg-[#006400] text-white px-8 py-6 text-lg"
            >
              <ClipboardCheck className="h-5 w-5 mr-3" />
              Continue Questionnaire
            </Button>
          </motion.div>
        </div>

        {/* Audio element for playback */}
        <audio
          ref={audioRef}
          onEnded={() => setPlayingAudio(null)}
          className="hidden"
        />
      </div>

      {/* Floating Action Button for Mobile */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.5
        }}
        className="fixed bottom-6 right-6 md:hidden z-10"
      >
        <Button
          onClick={handleGoToQuestionnaire}
          className="h-16 w-16 rounded-full bg-[#009B3A] hover:bg-[#006400] text-white shadow-lg"
          aria-label="Continue questionnaire"
        >
          <PlusCircle className="h-8 w-8" />
        </Button>
      </motion.div>

      {/* Alert Dialog for confirmation */}
      <AlertDialog>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Responses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all your responses? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowSecondConfirm(false);
              setDeleteConfirmText("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setShowSecondConfirm(true)}
              className="bg-red-500 hover:bg-red-600"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSecondConfirm} onOpenChange={setShowSecondConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Final Confirmation Required</AlertDialogTitle>
            <AlertDialogDescription>
              To permanently delete all responses, please type "Delete Forever" below:
              <Input
                className="mt-4"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'Delete Forever'"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowSecondConfirm(false);
              setDeleteConfirmText("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}