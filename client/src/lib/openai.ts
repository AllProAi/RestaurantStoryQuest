export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('Starting transcription process...');
    console.log('Audio blob info:', {
      type: audioBlob.type,
      size: audioBlob.size
    });

    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Transcription API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const data = await response.json();
    console.log('Transcription API response:', data);

    if (!data.text) {
      console.error('No transcription text in response:', data);
      throw new Error('No transcription text received');
    }

    return data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}