import { toast } from '@/components/ui/use-toast';

interface VoiceCommand {
  command: string;
  action: () => void;
  aliases?: string[];
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private commands: VoiceCommand[] = [];
  private onStatusCallback: ((status: string) => void) | null = null;
  private confidenceThreshold: number = 0.75;
  private processingDelay: number = 500;
  private processingTimeout: NodeJS.Timeout | null = null;
  private lastProcessedText: string = '';
  private listeningStartTime: number = 0;
  private maxListeningDuration: number = 30000;
  private stabilityThreshold: number = 2;
  private consecutiveStableResults: number = 0;
  private previousRecognitionResult: string = '';

  constructor() {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      console.error('Speech recognition not supported in this browser');
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.error('Speech synthesis not supported in this browser');
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 5;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.onStatusCallback?.('Listening...');
      this.lastProcessedText = '';
      this.previousRecognitionResult = '';
      this.consecutiveStableResults = 0;
      this.listeningStartTime = Date.now();

      // Auto-stop after max duration
      setTimeout(() => {
        if (this.isListening && Date.now() - this.listeningStartTime >= this.maxListeningDuration) {
          this.onStatusCallback?.('Max listening duration reached');
          this.stopListening();
        }
      }, this.maxListeningDuration);
    };

    this.recognition.onresult = (event) => {
      if (this.processingTimeout) {
        clearTimeout(this.processingTimeout);
        this.processingTimeout = null;
      }

      let interimTranscript = '';
      let finalTranscript = '';
      let highestConfidenceResult = { text: '', confidence: 0 };

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          for (let j = 0; j < result.length; j++) {
            const alternative = result[j];
            if (alternative.confidence > highestConfidenceResult.confidence) {
              highestConfidenceResult = {
                text: alternative.transcript,
                confidence: alternative.confidence
              };
            }
          }
          if (highestConfidenceResult.confidence >= this.confidenceThreshold) {
            finalTranscript += highestConfidenceResult.text;
          }
        } else {
          const confidence = result[0].confidence;
          if (confidence >= this.confidenceThreshold) {
            interimTranscript += result[0].transcript;
          }
        }
      }

      if (finalTranscript) {
        this.processingTimeout = setTimeout(() => {
          this.processCommand(finalTranscript);
        }, this.processingDelay);
      } else if (interimTranscript) {
        const processedInterim = this.processTranscript(interimTranscript);
        if (processedInterim === this.previousRecognitionResult) {
          this.consecutiveStableResults++;
          if (this.consecutiveStableResults >= this.stabilityThreshold) {
            this.processCommand(processedInterim);
          }
        } else {
          this.consecutiveStableResults = 0;
          this.previousRecognitionResult = processedInterim;
        }
      }
    };

    this.recognition.onerror = (event) => {
      let errorMessage = 'An error occurred';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please ensure a microphone is installed.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
        case 'not-allowed':
          errorMessage = 'Permission to use microphone was denied.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service is not allowed.';
          break;
        case 'bad-grammar':
          errorMessage = 'Grammar error occurred.';
          break;
        case 'language-not-supported':
          errorMessage = 'Language not supported.';
          break;
      }

      toast({
        title: "Voice Command Error",
        description: errorMessage,
        variant: "destructive",
      });

      this.stopListening();
    };

    this.recognition.onend = () => {
      if (this.isListening && Date.now() - this.listeningStartTime < this.maxListeningDuration) {
        try {
          this.recognition?.start();
          this.onStatusCallback?.('Continuing to listen...');
        } catch (error) {
          console.error('Error restarting speech recognition:', error);
          this.isListening = false;
          this.onStatusCallback?.('Stopped');
        }
      } else {
        this.isListening = false;
        this.onStatusCallback?.('Stopped');
      }
    };
  }

  private processTranscript(text: string): string {
    return text.toLowerCase().trim();
  }

  private processCommand(text: string) {
    const normalizedText = this.processTranscript(text);
    
    for (const command of this.commands) {
      const commandMatch = command.command.toLowerCase();
      const aliasMatch = command.aliases?.some(alias => 
        normalizedText.includes(alias.toLowerCase())
      );

      if (normalizedText.includes(commandMatch) || aliasMatch) {
        this.onStatusCallback?.('Executing: ' + command.command);
        command.action();
        this.speak('Command executed: ' + command.command);
        return;
      }
    }

    this.onStatusCallback?.('Command not recognized: ' + text);
    this.speak('Command not recognized');
  }

  public registerCommands(commands: VoiceCommand[]) {
    this.commands = commands;
  }

  public startListening(onStatus?: (status: string) => void) {
    if (!this.recognition || this.isListening) return;
    
    this.isListening = true;
    this.onStatusCallback = onStatus;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Voice Command Error",
        description: "Failed to start speech recognition. Please try again.",
        variant: "destructive",
      });
      this.stopListening();
    }
  }

  public stopListening() {
    if (!this.recognition || !this.isListening) return;
    
    this.isListening = false;
    
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
    
    this.onStatusCallback?.('Processing final results...');
    
    setTimeout(() => {
      this.onStatusCallback = null;
    }, this.processingDelay + 100);
  }

  public speak(text: string) {
    if (!this.synthesis) return;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    this.synthesis.speak(utterance);
  }

  public isActive(): boolean {
    return this.isListening;
  }

  public setConfidenceThreshold(threshold: number) {
    this.confidenceThreshold = threshold;
  }

  public getSupportedLanguages(): string[] {
    return [
      'en-US', // English (US)
      'en-GB', // English (UK)
      'es-ES', // Spanish
      'fr-FR', // French
      'de-DE', // German
      'it-IT', // Italian
      'pt-BR', // Portuguese (Brazil)
      'ja-JP', // Japanese
      'ko-KR', // Korean
      'zh-CN', // Chinese (Simplified)
    ];
  }

  public setLanguage(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }
}

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export { VoiceService, type VoiceCommand }; 