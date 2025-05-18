// Web Speech API type declarations
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

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onStatusCallback: ((status: string) => void) | null = null;
  private finalTranscript: string = '';
  private interimTranscript: string = '';
  private lastProcessedText: string = '';
  private confidenceThreshold: number = 0.75;
  private processingDelay: number = 500; // Increased for better finalization
  private processingTimeout: NodeJS.Timeout | null = null;
  private lastResultTimestamp: number = 0;
  private listeningStartTime: number = 0;
  private maxListeningDuration: number = 30000;
  private stabilityThreshold: number = 2;
  private consecutiveStableResults: number = 0;
  private previousRecognitionResult: string = '';
  private commonPhraseCorrections: Record<string, string> = {
    'create a new conversation': 'new conversation',
    'make a new conversation': 'new conversation',
    'start a new conversation': 'new conversation',
    'start new conversation': 'new conversation',
    'change the theme': 'change theme',
    'toggle the theme': 'change theme',
    'switch to dark mode': 'dark mode',
    'switch to light mode': 'light mode',
    'enable self destruct': 'self destruct',
    'turn on self destruct': 'self destruct',
    'enable sequential thinking': 'sequential thinking',
    'turn on sequential thinking': 'sequential thinking'
  };
  private mode: 'dictation' | 'command' = 'dictation';

  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      console.error('Speech recognition not supported in this browser');
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
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.lastProcessedText = '';
      this.previousRecognitionResult = '';
      this.consecutiveStableResults = 0;
      this.listeningStartTime = Date.now();
      
      // Automatically stop extended listening sessions
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
      this.lastResultTimestamp = Date.now();
      let interimTranscript = '';
      let finalTranscript = '';
      let highestConfidenceResult = {text: '', confidence: 0};
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
      // --- Dictation mode: only submit on final ---
      if (this.mode === 'dictation') {
        if (finalTranscript) {
          this.processingTimeout = setTimeout(() => {
            const processedText = this.processTranscript(finalTranscript);
            this.handleProcessedText(processedText);
          }, this.processingDelay);
        }
      } else { // Command mode: allow stable interim
        if (finalTranscript) {
          this.processingTimeout = setTimeout(() => {
            const processedText = this.processTranscript(finalTranscript);
            this.handleProcessedText(processedText);
          }, this.processingDelay);
        } else if (interimTranscript) {
          const processedInterim = this.processTranscript(interimTranscript);
          if (processedInterim === this.previousRecognitionResult) {
            this.consecutiveStableResults++;
            if (this.consecutiveStableResults >= this.stabilityThreshold) {
              this.handleProcessedText(processedInterim);
            }
          } else {
            this.consecutiveStableResults = 0;
            this.previousRecognitionResult = processedInterim;
          }
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

      this.onErrorCallback?.(errorMessage);
      console.error('Speech recognition error:', errorMessage);
      this.stopListening();
    };
    this.recognition.onend = () => {
      // Auto-restart if we're still listening and within time limits
      if (this.isListening && 
          Date.now() - this.listeningStartTime < this.maxListeningDuration) {
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

  private handleProcessedText(processedText: string) {
    if (processedText && processedText !== this.lastProcessedText) {
      this.lastProcessedText = processedText;
      this.onResultCallback?.(processedText);
      
      // If this is a standard command, auto-stop listening
      const isCommand = Object.values(this.commonPhraseCorrections)
        .some(command => processedText.toLowerCase().includes(command.toLowerCase()));
      
      if (isCommand) {
        this.onStatusCallback?.('Command detected');
        setTimeout(() => this.stopListening(), 500);
      }
    }
  }

  private processTranscript(text: string): string {
    if (!text.trim()) return '';
    
    // Convert to lowercase for processing
    let processedText = text.toLowerCase().trim();
    
    // Apply common phrase corrections (must be done before other processing)
    for (const [phrase, correction] of Object.entries(this.commonPhraseCorrections)) {
      if (processedText.includes(phrase)) {
        processedText = processedText.replace(phrase, correction);
      }
    }
    
    // Split into words, preserving punctuation
    const words = processedText.match(/\b[\w']+\b|[.,!?;:]/g) || [];
    const uniqueWords: string[] = [];
    
    // Remove repeated consecutive words
    for (let i = 0; i < words.length; i++) {
      const currentWord = words[i].toLowerCase();
      const nextWord = i < words.length - 1 ? words[i + 1].toLowerCase() : '';
      
      // Skip consecutive duplicates
      if (currentWord !== nextWord) {
        uniqueWords.push(words[i]);
      }
    }
    
    // Join words back into text
    processedText = uniqueWords.join(' ');
    
    // Fix spacing around punctuation
    processedText = processedText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s*([.,!?;:])\s*/g, '$1 ') // Add space after punctuation
      .replace(/\s+([.,!?;:])/g, '$1') // Remove space before punctuation
      .trim();
    
    // Fix common recognition patterns/errors
    processedText = processedText
      // Remove filler words
      .replace(/\b(um|uh|er|ah|like|you know|i mean)\b\s*/gi, '')
      // Fix common word pairs that get duplicated
      .replace(/\b(the|a|an|to|of|for|in|on|by|with|from|at|it|is|was|are|were|be|been|being)\s+\1\b/gi, '$1')
      // Fix repeated short phrases
      .replace(/\b(\w+\s+\w+)\s+\1\b/gi, '$1')
      // Fix common command patterns
      .replace(/\bexplain\s+explain\b/gi, 'explain')
      .replace(/\btell\s+me\s+tell\s+me\b/gi, 'tell me')
      .replace(/\bwhat\s+is\s+what\s+is\b/gi, 'what is')
      .replace(/\bhow\s+to\s+how\s+to\b/gi, 'how to');

    // Capitalize first letter of sentences
    processedText = processedText.replace(/(^\s*|[.!?]\s+)([a-z])/g, 
      (match, p1, p2) => p1 + p2.toUpperCase());
    
    return processedText;
  }

  public startListening(
    onResult: (text: string) => void,
    onError?: (error: string) => void,
    onStatus?: (status: string) => void
  ) {
    if (!this.recognition || this.isListening) return;
    
    this.isListening = true;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStatusCallback = onStatus;
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.lastProcessedText = '';
    this.previousRecognitionResult = '';
    this.consecutiveStableResults = 0;
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.onErrorCallback?.('Failed to start speech recognition');
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
    
    // Allow final result processing to complete before clearing callbacks
    setTimeout(() => {
      this.onResultCallback = null;
      this.onErrorCallback = null;
      this.onStatusCallback = null;
    }, this.processingDelay + 100);
  }

  public isActive(): boolean {
    return this.isListening;
  }

  public setConfidenceThreshold(threshold: number) {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
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

  public setMode(mode: 'dictation' | 'command') {
    this.mode = mode;
  }
}

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
} 