import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from '@/hooks/use-toast';
import { transcribeAudio } from '@/lib/openai';

interface VoiceRecorderProps {
  language: "en" | "patois";
  onTranscription: (text: string) => void;
}

export function VoiceRecorder({ language, onTranscription }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);

          if (audioElement.current) {
            audioElement.current.src = url;
          }

          // Transcribe the audio
          console.log('Starting transcription of recording...');
          const transcribedText = await transcribeAudio(audioBlob);
          console.log('Received transcription:', transcribedText);

          if (transcribedText) {
            onTranscription(transcribedText);
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
            title: language === "en" ? "Transcription failed" : "Transcription nuh work",
            description: language === "en" ? 
              "Please try recording again" : 
              "Try record it one more time",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
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

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (!audioElement.current) return;

    if (isPlaying) {
      audioElement.current.pause();
    } else {
      audioElement.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-4">
      <audio 
        ref={audioElement} 
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {!isRecording ? (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={startRecording}
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
            variant="destructive"
          >
            <Square className="w-4 h-4 mr-2" />
            {language === "en" ? "Stop Recording" : "Stop Di Recording"}
          </Button>
        </motion.div>
      )}

      {audioUrl && !isRecording && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            onClick={togglePlayback}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {language === "en" ? "Play Recording" : "Play Di Recording"}
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
  );
}