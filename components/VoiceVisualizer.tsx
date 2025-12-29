
import React from 'react';
import { SessionStatus } from '../types';

interface VoiceVisualizerProps {
  status: SessionStatus;
  isAiSpeaking: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ status, isAiSpeaking }) => {
  const isActive = status === SessionStatus.ACTIVE;
  
  return (
    <div className="flex flex-col items-center justify-center space-y-8 h-64">
      <div className="relative">
        {/* Pulsing rings when active or AI is speaking */}
        {(isActive || isAiSpeaking) && (
          <>
            <div className={`absolute -inset-8 rounded-full border-2 border-indigo-500/30 pulse-animation`} />
            <div className={`absolute -inset-16 rounded-full border-2 border-indigo-400/20 pulse-animation`} style={{ animationDelay: '0.5s' }} />
          </>
        )}
        
        {/* Main Mic Circle */}
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
          isActive 
            ? isAiSpeaking 
              ? 'bg-emerald-500 shadow-emerald-500/20 scale-110' 
              : 'bg-indigo-600 shadow-indigo-600/20' 
            : 'bg-slate-800'
        }`}>
          {status === SessionStatus.CONNECTING ? (
            <i className="fas fa-circle-notch fa-spin text-3xl text-white"></i>
          ) : (
            <i className={`fas ${isAiSpeaking ? 'fa-volume-high' : 'fa-microphone'} text-3xl text-white transition-transform ${isActive ? 'scale-125' : ''}`}></i>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-xl font-semibold text-white tracking-wide">
          {status === SessionStatus.IDLE && "Ready to Start"}
          {status === SessionStatus.CONNECTING && "Establishing Connection..."}
          {status === SessionStatus.ACTIVE && (isAiSpeaking ? "Linguist is speaking..." : "Listening...")}
        </p>
        <p className="text-slate-400 text-sm mt-1">
          {status === SessionStatus.ACTIVE ? "Speak naturally to practice your skills" : "Choose a language and start your session"}
        </p>
      </div>
    </div>
  );
};

export default VoiceVisualizer;
