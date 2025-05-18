import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { VoiceService, type VoiceCommand } from '@/utils/voiceService';
import { toast } from '@/components/ui/use-toast';

interface VoiceCommandButtonProps {
  commands: VoiceCommand[];
  onStatusChange?: (status: string) => void;
  className?: string;
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  commands,
  onStatusChange,
  className = '',
}) => {
  const [voiceService] = useState(() => new VoiceService());
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.75);

  useEffect(() => {
    voiceService.registerCommands(commands);
  }, [commands, voiceService]);

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      handleStatusChange('Stopped');
    } else {
      voiceService.startListening(handleStatusChange);
      setIsListening(true);
    }
  }, [isListening, voiceService, handleStatusChange]);

  const handleLanguageChange = useCallback((value: string) => {
    setSelectedLanguage(value);
    voiceService.setLanguage(value);
    toast({
      title: "Language Changed",
      description: `Voice commands now set to ${value}`,
    });
  }, [voiceService]);

  const handleConfidenceChange = useCallback((value: number[]) => {
    const newThreshold = value[0];
    setConfidenceThreshold(newThreshold);
    voiceService.setConfidenceThreshold(newThreshold);
    toast({
      title: "Confidence Threshold Updated",
      description: `Set to ${(newThreshold * 100).toFixed(0)}%`,
    });
  }, [voiceService]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={toggleListening}
        className="relative"
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {isListening && (
          <span className="absolute -top-1 -right-1 h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </Button>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Command Settings</DialogTitle>
            <DialogDescription>
              Configure your voice command preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {voiceService.getSupportedLanguages().map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Confidence Threshold: {(confidenceThreshold * 100).toFixed(0)}%</Label>
              <Slider
                value={[confidenceThreshold]}
                onValueChange={handleConfidenceChange}
                min={0.5}
                max={0.95}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <Label>Available Commands</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {commands.map((cmd, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{cmd.command}</span>
                    {cmd.aliases && (
                      <span className="text-muted-foreground ml-2">
                        ({cmd.aliases.join(', ')})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {status && (
        <span className="text-sm text-muted-foreground animate-fade-in">
          {status}
        </span>
      )}
    </div>
  );
};

export default VoiceCommandButton; 