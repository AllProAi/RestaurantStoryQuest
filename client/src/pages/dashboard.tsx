import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Play, Pause, RotateCcw, Trash2, Edit } from "lucide-react";
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#006400]">
            Your Story Responses
          </h1>
          <div className="flex gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Responses
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
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
          {responses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No responses found. Start sharing your story to see them here.
              </CardContent>
            </Card>
          ) : (
            responses.map((response) => {
              const question = questions.find(q => q.id === response.questionId);
              return (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                      <div>
                        <h2 className="text-xl font-semibold">
                          Question {response.questionId}:
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {question?.text}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editResponse(response.questionId)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Response
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Written Response:</h3>
                          <p className="text-gray-700">{response.textResponse}</p>
                        </div>

                        {response.audioUrl && response.transcriptions && response.transcriptions.length > 0 && (
                          <div>
                            <h3 className="font-medium mb-2">Transcriptions:</h3>
                            <div className="space-y-2">
                              {response.transcriptions.map((text, index) => {
                                const uniqueAudioId = `${response.id}_${index}`;
                                return (
                                  <div key={index} className="p-3 bg-gray-50 rounded relative">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="text-sm font-medium text-gray-500">Recording {index + 1}:</span>
                                        <p className="mt-1 text-gray-700">{text}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handlePlayAudio(uniqueAudioId)}
                                          variant="outline"
                                          size="sm"
                                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        >
                                          {playingAudio === uniqueAudioId ? (
                                            <Pause className="w-4 h-4" />
                                          ) : (
                                            <Play className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                    <audio 
                                      id={uniqueAudioId}
                                      src={response.audioUrl}
                                      className="hidden"
                                      onEnded={() => setPlayingAudio(null)}
                                    />
                                    <AnimatePresence>
                                      {playingAudio === uniqueAudioId && (
                                        <motion.div
                                          initial={{ y: 20, opacity: 0 }}
                                          animate={{ y: 0, opacity: 1 }}
                                          exit={{ y: 20, opacity: 0 }}
                                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                          className="absolute bottom-0 right-0 transform translate-y-full"
                                          style={{ marginTop: '5px', marginRight: '8px', marginBottom: '8px' }}
                                        >
                                          <Button
                                            onClick={() => {
                                              const audio = document.getElementById(uniqueAudioId) as HTMLAudioElement;
                                              if (audio) {
                                                audio.currentTime = 0;
                                                audio.pause();
                                                setPlayingAudio(null);
                                              }
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                          >
                                            <RotateCcw className="w-4 h-4" />
                                          </Button>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}