import { SpeechRecognitionService } from './speechUtils';

export interface VoiceCommand {
  command: string;
  action: () => void;
  aliases?: string[];
}

export class VoiceCommandService {
  private recognition: SpeechRecognitionService;
  private commands: VoiceCommand[] = [];
  private isListening: boolean = false;
  private onStatusCallback: ((status: string) => void) | null = null;

  constructor() {
    this.recognition = new SpeechRecognitionService();
  }

  public registerCommands(commands: VoiceCommand[]) {
    this.commands = commands;
  }

  public startListening(onStatus?: (status: string) => void) {
    if (this.isListening) return;
    
    this.isListening = true;
    this.onStatusCallback = onStatus;

    this.recognition.startListening(
      (text) => this.processCommand(text),
      (error) => {
        console.error('Voice command error:', error);
        this.onStatusCallback?.('Error: ' + error);
        this.stopListening();
      },
      (status) => this.onStatusCallback?.(status)
    );
  }

  public stopListening() {
    if (!this.isListening) return;
    
    this.isListening = false;
    this.recognition.stopListening();
    this.onStatusCallback = null;
  }

  private processCommand(text: string) {
    const normalizedText = text.toLowerCase().trim();
    
    for (const command of this.commands) {
      const commandMatch = command.command.toLowerCase();
      const aliasMatch = command.aliases?.some(alias => 
        normalizedText.includes(alias.toLowerCase())
      );

      if (normalizedText.includes(commandMatch) || aliasMatch) {
        this.onStatusCallback?.('Executing: ' + command.command);
        command.action();
        return;
      }
    }

    this.onStatusCallback?.('Command not recognized: ' + text);
  }

  public isActive(): boolean {
    return this.isListening;
  }
} 