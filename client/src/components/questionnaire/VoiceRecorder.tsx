import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from '@/hooks/use-toast';
import { transcribeAudio } from '@/lib/openai';

interface VoiceRecorderProps {
  language: "en" | "patois";
  onTranscription: (text: string, audioUrl: string) => void;
}

interface Recording {
  url: string;
  transcription: string;
  isPlaying: boolean;
}

export function VoiceRecorder({ language, onTranscription }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showRestartButton, setShowRestartButton] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioElements = useRef<HTMLAudioElement[]>([]);

  const uploadAudio = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload audio');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  };

  const startRecording = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRestartButton(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 2,
          sampleRate: 48000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });

          // Upload the audio file and get a permanent URL
          const permanentUrl = await uploadAudio(audioBlob);
          console.log('Audio uploaded, permanent URL:', permanentUrl);

          // Get transcription
          const transcribedText = await transcribeAudio(audioBlob);
          console.log('Received transcription:', transcribedText);

          if (transcribedText) {
            setRecordings(prev => [...prev, {
              url: permanentUrl,
              transcription: transcribedText,
              isPlaying: false
            }]);

            // Pass both transcription and permanent URL to parent
            onTranscription(transcribedText, permanentUrl);

            toast({
              title: language === "en" ? "Recording transcribed" : "Recording done",
              description: language === "en" ? 
                "Your story has been transcribed" : 
                "Yu story write out now",
            });
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          toast({
            title: language === "en" ? "Recording failed" : "Recording nuh work",
            description: language === "en" ? 
              "Please try recording again" : 
              "Try record it one more time",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
          setShowRestartButton(true);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: language === "en" ? "Microphone access denied" : "Mic nuh work",
        description: language === "en" ? 
          "Please allow microphone access to record your story" : 
          "Yu haffi let wi use di mic fi record yu story",
        variant: "destructive",
      });
    }
  };

  const stopRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setShowRestartButton(true); // Show restart button immediately after stopping
    }
  };

  const togglePlayback = (index: number) => {
    if (!audioElements.current[index]) return;

    const audio = audioElements.current[index];
    const isCurrentlyPlaying = !audio.paused;

    // Pause all other recordings
    audioElements.current.forEach((otherAudio, i) => {
      if (i !== index && !otherAudio.paused) {
        otherAudio.pause();
        setRecordings(prev => prev.map((rec, idx) => 
          idx === i ? { ...rec, isPlaying: false } : rec
        ));
      }
    });

    // Toggle current recording
    if (isCurrentlyPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setRecordings(prev => prev.map((rec, idx) => 
      idx === index ? { ...rec, isPlaying: !isCurrentlyPlaying } : rec
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={startRecording}
              type="button"
              className="bg-red-500 hover:bg-red-600"
              disabled={isProcessing}
            >
              <Mic className="w-4 h-4 mr-2" />
              {language === "en" ? "Record Your Story" : "Record Yu Story"}
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Button
              onClick={stopRecording}
              type="button"
              variant="destructive"
            >
              <Square className="w-4 h-4 mr-2" />
              {language === "en" ? "Stop Recording" : "Stop Di Recording"}
            </Button>
          </motion.div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {language === "en" ? "Processing..." : "Working pon it..."}
          </div>
        )}
      </div>

      {/* Restart Recording Button */}
      <AnimatePresence>
        {showRestartButton && !isRecording && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mt-4 flex justify-center"
          >
            <Button
              onClick={startRecording}
              className="bg-green-500 hover:bg-green-600 shadow-lg"
              size="lg"
              disabled={isProcessing}
            >
              <Mic className="w-5 h-5 mr-2" />
              {language === "en" ? "Start New Recording" : "Start New Recording"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recordings list */}
      <div className="space-y-4">
        {recordings.map((recording, index) => (
          <div key={recording.url} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-4 mb-2">
              <audio 
                ref={el => {
                  if (el) audioElements.current[index] = el;
                }}
                src={recording.url}
                onEnded={() => setRecordings(prev => prev.map((rec, idx) => 
                  idx === index ? { ...rec, isPlaying: false } : rec
                ))}
                className="hidden"
              />
              <Button
                onClick={() => togglePlayback(index)}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                {recording.isPlaying ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {language === "en" ? `Recording ${index + 1}` : `Recording ${index + 1}`}
              </Button>
            </div>

            {/* Transcription display */}
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
              {recording.transcription}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}