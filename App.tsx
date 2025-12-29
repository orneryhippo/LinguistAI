
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SessionStatus, ChatMessage, LANGUAGES, Language } from './types';
import { decode, decodeAudioData, createBlob } from './utils/audioUtils';
import LanguageSettings from './components/LanguageSettings';
import VoiceVisualizer from './components/VoiceVisualizer';
import ChatLog from './components/ChatLog';

const App: React.FC = () => {
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // References for live session and audio
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  // Transcriptions buffers
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    
    if (audioContextsRef.current) {
      audioContextsRef.current.input.close();
      audioContextsRef.current.output.close();
      audioContextsRef.current = null;
    }

    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    
    setStatus(SessionStatus.IDLE);
    setIsAiSpeaking(false);
  }, []);

  const startSession = async () => {
    try {
      setStatus(SessionStatus.CONNECTING);
      
      // Initialize Audio Contexts
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputAudioContext, output: outputAudioContext };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus(SessionStatus.ACTIVE);
            
            // Start recording and sending to API
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Data
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsAiSpeaking(true);
              const { output: outputCtx } = audioContextsRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsAiSpeaking(false);
                }
              };
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            }

            // Turn complete
            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscription.current.trim();
              const aiText = currentOutputTranscription.current.trim();

              if (userText) {
                setChatLog(prev => [...prev, {
                  id: Math.random().toString(36),
                  role: 'user',
                  text: userText,
                  timestamp: new Date()
                }]);
              }
              if (aiText) {
                setChatLog(prev => [...prev, {
                  id: Math.random().toString(36),
                  role: 'ai',
                  text: aiText,
                  timestamp: new Date()
                }]);
              }

              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAiSpeaking(false);
            }
          },
          onerror: (e) => {
            console.error('Session Error:', e);
            setStatus(SessionStatus.ERROR);
            stopSession();
          },
          onclose: () => {
            console.log('Session Closed');
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: `You are a patient, supportive, and friendly language tutor. The user wants to practice ${selectedLanguage.name}. 
          Always speak in ${selectedLanguage.name} but keep your vocabulary appropriate for a language learner. 
          If the user makes a clear mistake, gently correct them after responding to their intent. 
          Encourage them to speak more and ask follow-up questions to keep the conversation going.
          Make the conversation natural and fun!`,
        },
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error('Failed to start session:', err);
      setStatus(SessionStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Linguist AI
          </h1>
          <p className="text-slate-400 text-sm">Real-time Conversational Language Partner</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <LanguageSettings 
            selectedLanguage={selectedLanguage} 
            onLanguageChange={setSelectedLanguage}
            disabled={status !== SessionStatus.IDLE}
          />
          
          <button
            onClick={status === SessionStatus.ACTIVE ? stopSession : startSession}
            disabled={status === SessionStatus.CONNECTING}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg ${
              status === SessionStatus.ACTIVE 
                ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
            }`}
          >
            {status === SessionStatus.ACTIVE ? (
              <>
                <i className="fas fa-stop text-sm"></i>
                <span>End Practice</span>
              </>
            ) : (
              <>
                <i className="fas fa-play text-sm"></i>
                <span>Start Practice</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Visualizer Column */}
        <section className="lg:col-span-7 bg-slate-900/30 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm min-h-[500px] flex flex-col justify-center shadow-xl">
          <VoiceVisualizer status={status} isAiSpeaking={isAiSpeaking} />
          
          {status === SessionStatus.ERROR && (
            <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-3 text-rose-400 animate-pulse">
              <i className="fas fa-circle-exclamation"></i>
              <span>An error occurred with the connection. Please check your microphone and try again.</span>
            </div>
          )}
        </section>

        {/* Chat Log Column */}
        <section className="lg:col-span-5 h-[500px]">
          <ChatLog messages={chatLog} />
        </section>
      </main>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-slate-500 text-xs">
        <p>Powered by Gemini 2.5 Native Audio API • Practice makes perfect</p>
      </footer>
    </div>
  );
};

export default App;
