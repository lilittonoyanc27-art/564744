/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  QUESTIONS_DATA,
  GRAMMAR_GUIDE,
  Question,
  Option,
} from './data.ts';
import {
  Volume2,
  VolumeX,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Users,
  PhoneCall,
  Scissors,
  ArrowRight,
  RotateCcw,
  Languages,
  Eye,
  EyeOff,
  Mic,
  Square,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  BarChart2,
  MessageSquare,
} from 'lucide-react';

// Millionaire Ladder Values (20 levels)
const PRIZE_LADDER = [
  { level: 20, value: '1.000.000 €', milestone: true },
  { level: 19, value: '500.000 €', milestone: false },
  { level: 18, value: '250.000 €', milestone: false },
  { level: 17, value: '125.000 €', milestone: false },
  { level: 16, value: '64.000 €', milestone: false },
  { level: 15, value: '32.000 €', milestone: false },
  { level: 14, value: '16.000 €', milestone: true }, // Milestone Parte 3
  { level: 13, value: '8.000 €', milestone: false },
  { level: 12, value: '4.000 €', milestone: false },
  { level: 11, value: '2.000 €', milestone: false },
  { level: 10, value: '1.000 €', milestone: true },  // Milestone Parte 2
  { level: 9, value: '800 €', milestone: false },
  { level: 8, value: '600 €', milestone: false },
  { level: 7, value: '400 €', milestone: false },
  { level: 6, value: '300 €', milestone: false },
  { level: 5, value: '200 €', milestone: true },    // Milestone Parte 1
  { level: 4, value: '100 €', milestone: false },
  { level: 3, value: '50 €', milestone: false },
  { level: 2, value: '25 €', milestone: false },
  { level: 1, value: '10 €', milestone: false },
];

export default function App() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  
  // Translation reveal tracking
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [revealedOptions, setRevealedOptions] = useState<Record<string, boolean>>({});
  const [showAllTranslations, setShowAllTranslations] = useState<boolean>(false);

  // Lifelines state
  const [used5050, setUsed5050] = useState<boolean>(false);
  const [hiddenOptions, setHiddenOptions] = useState<Record<number, ('A' | 'B' | 'C' | 'D')[]>>({});
  const [showAudienceModal, setShowAudienceModal] = useState<boolean>(false);
  const [usedAudience, setUsedAudience] = useState<boolean>(false);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [usedPhone, setUsedPhone] = useState<boolean>(false);

  // General Modals
  const [showAnswersModal, setShowAnswersModal] = useState<boolean>(false);
  const [showGrammarModal, setShowGrammarModal] = useState<boolean>(false);
  const [showLadderModal, setShowLadderModal] = useState<boolean>(false);

  // Sound effects enabled toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Speech Text-to-Speech
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Voice recording for speaking practice
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Audio Context for synthetic Millionaire sound effects
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentQ = QUESTIONS_DATA[currentIdx];
  const userChoiceKey = selectedAnswers[currentQ.id];
  const isAnswered = userChoiceKey !== undefined;
  const isChoiceCorrect = isAnswered && userChoiceKey === currentQ.logicalAnswerKey;

  // Cleanup on question change
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    resetRecording();
  }, [currentIdx]);

  const resetRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setAudioUrl(null);
  };

  // Synthetic sound effects generator (no external mp3 files needed)
  const playSoundEffect = (type: 'select' | 'correct' | 'wrong' | 'lifeline') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'select') {
        // Dramatic low ping
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'correct') {
        // Glorious triumphant chord
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.15); // C#
        osc.frequency.setValueAtTime(659.25, now + 0.3); // E
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
      } else if (type === 'wrong') {
        // Friendly low tension tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'lifeline') {
        // Shimmer
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  // Text-To-Speech (Native Spanish Voice)
  const speakSpanish = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.92;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) {
      utterance.voice = esVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Voice recording for oral practice
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Lifeline: 50:50 (Removes 2 humorous choices)
  const handleUse5050 = () => {
    if (used5050 || isAnswered) return;
    playSoundEffect('lifeline');
    setUsed5050(true);

    const incorrectOptions = currentQ.options.filter(o => !o.isCorrect).map(o => o.key);
    // Shuffle and pick 2 to hide
    const shuffled = [...incorrectOptions].sort(() => 0.5 - Math.random());
    const toHide = shuffled.slice(0, 2);

    setHiddenOptions(prev => ({
      ...prev,
      [currentQ.id]: toHide,
    }));
  };

  // Lifeline: Audience Poll
  const handleUseAudience = () => {
    if (usedAudience || isAnswered) return;
    playSoundEffect('lifeline');
    setUsedAudience(true);
    setShowAudienceModal(true);
  };

  // Lifeline: Phone a Friend
  const handleUsePhone = () => {
    if (usedPhone || isAnswered) return;
    playSoundEffect('lifeline');
    setUsedPhone(true);
    setShowPhoneModal(true);
  };

  // Translations
  const toggleQuestionTranslation = (qId: number) => {
    setRevealedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const toggleOptionTranslation = (qId: number, optKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const key = `${qId}_${optKey}`;
    setRevealedOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // User chooses an option
  const handleSelectOption = (opt: Option) => {
    if (isAnswered) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: opt.key
    }));

    // Auto reveal translation of selected option
    setRevealedOptions(prev => ({
      ...prev,
      [`${currentQ.id}_${opt.key}`]: true
    }));

    if (opt.isCorrect) {
      playSoundEffect('correct');
    } else {
      playSoundEffect('wrong');
    }
  };

  // Navigation
  const handleNext = () => {
    if (currentIdx < QUESTIONS_DATA.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setRevealedQuestions({});
    setRevealedOptions({});
    setUsed5050(false);
    setUsedAudience(false);
    setUsedPhone(false);
    setHiddenOptions({});
  };

  // Statistics
  const answeredCount = Object.keys(selectedAnswers).length;
  const logicalCount = Object.entries(selectedAnswers).filter(([qId, chosenKey]) => {
    const q = QUESTIONS_DATA.find(item => item.id === Number(qId));
    return q && q.logicalAnswerKey === chosenKey;
  }).length;
  const humorCount = answeredCount - logicalCount;

  // Active question prize level
  const currentPrize = PRIZE_LADDER.find(p => p.level === currentQ.id)?.value || '10 €';

  const isQuestionTranslationVisible = showAllTranslations || isAnswered || !!revealedQuestions[currentQ.id];
  const qHiddenList = hiddenOptions[currentQ.id] || [];

  return (
    <div className="millionaire-bg min-h-screen flex flex-col text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      
      {/* TOP TV SHOW STUDIO HEADER */}
      <header className="relative z-30 border-b border-blue-900/60 bg-[#050C1D]/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Millionaire Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-amber-400/90 bg-radial from-blue-900 to-[#050B18] flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.35)] shrink-0">
              <span className="text-amber-300 font-black text-sm md:text-base font-serif">
                ?
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">
                  QUIÉN QUIERE SER MILLONARIO
                </span>
                <span className="hidden sm:inline text-xs text-blue-400 font-medium">
                  · Ո՞վ է ուզում դառնալ միլիոնատեր
                </span>
              </div>
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight">
                ¿Qué habrías hecho tú? (A2–B1)
              </h1>
            </div>
          </div>

          {/* Quick Controls & Lifelines Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Audio Sfx Toggle */}
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              title={soundEnabled ? "Անջատել ձայնային էֆեկտները" : "Միացնել ձայնային էֆեկտները"}
              className="p-2 rounded-lg border border-blue-900/80 bg-blue-950/60 text-blue-300 hover:text-white hover:border-blue-700 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Armenian Translation Toggle Button */}
            <button
              onClick={() => setShowAllTranslations(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showAllTranslations
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'bg-blue-950/60 border-blue-900 text-slate-300 hover:border-blue-700 hover:text-white'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {showAllTranslations ? 'Հայերենը՝ բաց' : 'Հայերեն թարգմանություն'}
              </span>
              <span className="sm:hidden">Հայերեն</span>
            </button>

            {/* Grammar Modal */}
            <button
              onClick={() => setShowGrammarModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-900 bg-blue-950/60 text-slate-300 hover:border-blue-700 hover:text-white transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Քերականություն</span>
            </button>

            {/* Answers Sheet */}
            <button
              onClick={() => setShowAnswersModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-900 bg-blue-950/60 text-slate-300 hover:border-blue-700 hover:text-white transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Պատասխաններ</span>
            </button>

            {/* Prize Ladder Mobile Trigger */}
            <button
              onClick={() => setShowLadderModal(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.3)]"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{currentPrize}</span>
            </button>
          </div>
        </div>
      </header>

      {/* THREE CLASSIC LIFELINES (COMODINES / ՕԳՆՈՒԹՅՈՒՆՆԵՐ) */}
      <div className="bg-[#071126] border-b border-blue-900/50 py-2.5 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-blue-400 font-bold hidden sm:inline">
              COMODINES / ՕԳՆՈՒԹՅՈՒՆՆԵՐ:
            </span>

            {/* 50:50 Lifeline */}
            <button
              onClick={handleUse5050}
              disabled={used5050 || isAnswered}
              title="50:50 — Հեռացնում է երկու հումորային տարբերակ"
              className={`relative px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                used5050 
                  ? 'bg-slate-900/80 border-slate-700 text-slate-500 line-through cursor-not-allowed' 
                  : isAnswered
                  ? 'bg-blue-950/40 border-blue-900 text-blue-400/50 cursor-not-allowed'
                  : 'bg-radial from-blue-800 to-blue-950 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:scale-105'
              }`}
            >
              50 : 50
            </button>

            {/* Audience Poll Lifeline */}
            <button
              onClick={handleUseAudience}
              disabled={usedAudience || isAnswered}
              title="Դահլիճի օգնություն — Հանդիսատեսի քվեարկություն"
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                usedAudience 
                  ? 'bg-slate-900/80 border-slate-700 text-slate-500 line-through cursor-not-allowed' 
                  : isAnswered
                  ? 'bg-blue-950/40 border-blue-900 text-blue-400/50 cursor-not-allowed'
                  : 'bg-radial from-blue-800 to-blue-950 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:scale-105'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Público / Դահլիճ</span>
            </button>

            {/* Phone a Friend / Teacher Tip */}
            <button
              onClick={handleUsePhone}
              disabled={usedPhone || isAnswered}
              title="Զանգ ընկերոջը — Ուսուցչի խորհուրդը"
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                usedPhone 
                  ? 'bg-slate-900/80 border-slate-700 text-slate-500 line-through cursor-not-allowed' 
                  : isAnswered
                  ? 'bg-blue-950/40 border-blue-900 text-blue-400/50 cursor-not-allowed'
                  : 'bg-radial from-blue-800 to-blue-950 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:scale-105'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Llamada / Զանգ</span>
            </button>
          </div>

          {/* Current Part & Value */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-400 font-bold tracking-wide">
              {currentQ.partTitleEs.toUpperCase()}
            </span>
            <span className="text-slate-400 hidden md:inline">
              · {currentQ.partTitleHy}
            </span>
          </div>

        </div>
      </div>

      {/* MAIN GAME STAGE & SIDEBAR LADDER */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 lg:p-8 flex gap-6 items-start">
        
        {/* LEFT / CENTER: THE MAIN MILLIONAIRE STAGE */}
        <div className="flex-1 w-full flex flex-col gap-6">

          {/* QUESTION STAGE */}
          <div className="relative flex flex-col items-center">
            
            {/* Horizontal metallic connector lines (classic Who Wants to Be a Millionaire style) */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent -translate-y-1/2 z-0 pointer-events-none" />

            {/* Central Hexagonal Question Lozenge */}
            <div className="relative z-10 w-full max-w-4xl bg-gradient-to-b from-[#0B1530] via-[#091128] to-[#050C1F] border-2 border-cyan-400/70 shadow-[0_0_25px_rgba(6,182,212,0.2)] rounded-2xl md:rounded-3xl p-5 md:p-7 text-center">
              
              {/* Question Level & Audio Trigger */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-blue-900/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-bold text-amber-400 tracking-wider">
                    PREGUNTA {currentQ.id} / 20
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-cyan-500/30">
                    {currentPrize}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Pronounce in Spanish */}
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speakSpanish(currentQ.questionEs)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-cyan-500/40 bg-blue-950/70 text-cyan-200 hover:bg-cyan-900/40 transition-colors"
                    title="Լսել իսպաներեն հարցը"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Լսել</span>
                  </button>

                  {/* Toggle Armenian Translation */}
                  <button
                    onClick={() => toggleQuestionTranslation(currentQ.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-cyan-500/40 bg-blue-950/70 text-cyan-200 hover:bg-cyan-900/40 transition-colors"
                    title="Ցույց տալ հայերենը"
                  >
                    {isQuestionTranslationVisible ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Թաքցնել</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Թարգմանել</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SPANISH QUESTION TEXT (Clickable to reveal translation!) */}
              <div
                onClick={() => toggleQuestionTranslation(currentQ.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleQuestionTranslation(currentQ.id); }}
                className="cursor-pointer group py-3 px-2 rounded-xl transition-all hover:bg-blue-900/20"
                title="Սեղմիր իսպաներեն տեքստին՝ հայերեն թարգմանությունը բացելու համար"
              >
                <p className="text-base sm:text-lg md:text-xl font-bold text-white leading-relaxed group-hover:text-amber-200 transition-colors">
                  {currentQ.questionEs}
                </p>
              </div>

              {/* REVEALABLE ARMENIAN TRANSLATION */}
              {isQuestionTranslationVisible && (
                <div className="mt-3 pt-3 border-t border-blue-900/60 bg-blue-950/80 rounded-xl p-3 text-slate-200 text-left flex items-start gap-2.5 border border-amber-400/30 animate-fadeIn">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 shrink-0 uppercase tracking-wider">
                    Հայերեն
                  </span>
                  <p className="text-xs sm:text-sm md:text-base leading-relaxed text-slate-100">
                    {currentQ.questionHy}
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* 4 ANSWER CHOICES (A, B, C, D) IN 2x2 MILLIONAIRE LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4 relative">
            {currentQ.options.map((opt) => {
              const isSelected = userChoiceKey === opt.key;
              const isOptCorrect = opt.isCorrect;
              const isHiddenBy5050 = qHiddenList.includes(opt.key);
              const optionKeyString = `${currentQ.id}_${opt.key}`;
              const isOptTranslationVisible = showAllTranslations || isAnswered || !!revealedOptions[optionKeyString];

              if (isHiddenBy5050) {
                return (
                  <div
                    key={opt.key}
                    className="h-20 rounded-2xl border border-blue-950/40 bg-black/30 opacity-20 pointer-events-none flex items-center justify-center text-xs text-slate-600 font-mono"
                  >
                    [ 50 : 50 ]
                  </div>
                );
              }

              // Visual states in classic Millionaire style
              let containerStyle = 'bg-gradient-to-r from-[#07132B] via-[#091B3D] to-[#07132B] border-cyan-500/50 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] text-slate-100';
              let letterStyle = 'text-amber-400 font-black';

              if (isAnswered) {
                if (isOptCorrect) {
                  // Intense glowing green for correct logical answer
                  containerStyle = 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] text-white';
                  letterStyle = 'text-emerald-300 font-black';
                } else if (isSelected && !isOptCorrect) {
                  // Intense glowing amber/crimson for humorous answer
                  containerStyle = 'bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-white';
                  letterStyle = 'text-amber-300 font-black';
                } else {
                  containerStyle = 'bg-[#040A18]/80 border-blue-950/60 opacity-60 text-slate-400';
                  letterStyle = 'text-slate-500';
                }
              }

              return (
                <div
                  key={opt.key}
                  onClick={() => handleSelectOption(opt)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectOption(opt); }}
                  className={`group relative rounded-2xl border-2 p-3.5 sm:p-4 cursor-pointer transition-all duration-200 text-left ${containerStyle}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Golden Millionaire Letter Label: A:, B:, C:, D: */}
                    <span className={`text-base sm:text-lg tracking-wider shrink-0 select-none ${letterStyle}`}>
                      {opt.key}:
                    </span>

                    {/* Spanish & Armenian Text */}
                    <div className="flex-1">
                      
                      {/* Spanish sentence */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm sm:text-base font-semibold group-hover:text-amber-200 transition-colors leading-snug">
                          {opt.textEs}
                        </p>

                        {/* Pronunciation icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSpanish(opt.textEs);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-amber-400 transition-colors shrink-0"
                          title="Լսել արտասանությունը"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Armenian Translation (revealed upon click or when answered) */}
                      {isOptTranslationVisible ? (
                        <div className="mt-2 text-xs sm:text-sm text-cyan-200 pl-2.5 border-l-2 border-amber-400/80 animate-fadeIn font-medium">
                          {opt.textHy}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => toggleOptionTranslation(currentQ.id, opt.key, e)}
                          className="mt-1 text-[11px] text-blue-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
                        >
                          <Languages className="w-3 h-3 text-amber-400" />
                          <span>Սեղմիր թարգմանության համար</span>
                        </button>
                      )}

                      {/* Post-selection comment */}
                      {isAnswered && (
                        <div className="mt-2.5 pt-2 border-t border-white/10 text-xs">
                          {isOptCorrect ? (
                            <span className="font-bold text-emerald-300 block">
                              ✓ Տրամաբանական տարբերակ
                            </span>
                          ) : (
                            <span className="font-bold text-amber-300 block">
                              ★ Հումորային տարբերակ
                            </span>
                          )}
                          <p className="text-slate-200 mt-0.5">{opt.commentEs}</p>
                          <p className="text-slate-400 text-[11px]">{opt.commentHy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* GAME CONTINUATION & HOST QUESTION (Shown when answered) */}
          {isAnswered && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              
              {/* Host Verdict & Logic Explanation */}
              <div className={`rounded-2xl border-2 p-5 ${
                isChoiceCorrect 
                  ? 'bg-gradient-to-r from-[#062418] to-[#0A3D2A] border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
                  : 'bg-gradient-to-r from-[#2B1B07] to-[#452A0A] border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              }`}>
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/40 border border-white/20">
                      {isChoiceCorrect ? '¡Respuesta Lógica Correcta!' : 'Opción Divertida Elegida'}
                    </span>
                    <span className="text-xs text-slate-300">
                      · Խաղը շարունակվում է
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-300">
                    Մակարդակ {currentQ.id} / 20
                  </span>
                </div>

                <p className="text-sm md:text-base font-semibold text-white">
                  {currentQ.explanationEs}
                </p>
                <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
                  {currentQ.explanationHy}
                </p>
              </div>

              {/* HOST SPEAKING CHALLENGE (Pregunta del presentador) */}
              <div className="bg-gradient-to-b from-[#091533] to-[#050C1F] rounded-2xl border-2 border-blue-800 p-5 shadow-lg">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-900/80 border border-amber-400/60 flex items-center justify-center text-amber-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                        Pregunta del Presentador · Հաղորդավարի հարցը
                      </h4>
                      <p className="text-xs text-slate-400">
                        Խոսիր իսպաներենով՝ հիմնավորիր քո ընտրությունը
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => speakSpanish(currentQ.speakingPrompt.questionEs)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-950 border border-cyan-400/50 text-cyan-200 hover:bg-blue-900 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Լսել հարցը</span>
                  </button>
                </div>

                {/* Prompt box */}
                <div className="bg-[#030914] rounded-xl p-3.5 border border-cyan-500/40 mb-3.5">
                  <p className="text-base md:text-lg font-bold text-amber-300">
                    {currentQ.speakingPrompt.questionEs}
                  </p>
                  <p className="text-xs md:text-sm text-slate-300 mt-0.5">
                    {currentQ.speakingPrompt.questionHy}
                  </p>
                </div>

                {/* Sentence starters */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-xs font-semibold text-slate-300">
                    Պատասխանի կաղապարներ (սեղմիր արտասանությունը լսելու համար).
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentQ.speakingPrompt.starterPhrases.map((phrase, idx) => (
                      <button
                        key={idx}
                        onClick={() => speakSpanish(phrase.es)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-950/70 border border-blue-900 text-slate-200 hover:border-amber-400 hover:text-amber-200 transition-colors group"
                      >
                        <Volume2 className="w-3 h-3 text-amber-400" />
                        <span className="font-semibold">{phrase.es}</span>
                        <span className="text-slate-400 text-[11px]">({phrase.hy})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice recorder for speaking */}
                <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-blue-900/60">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-600/70 hover:bg-rose-900 transition-colors shadow-xs"
                    >
                      <Mic className="w-4 h-4 text-rose-400" />
                      <span>Ձայնագրել պատասխանդ</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white animate-pulse transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      <span>Կանգնեցնել ձայնագրությունը ({recordingSeconds} վրկ)</span>
                    </button>
                  )}

                  {audioUrl && !isRecording && (
                    <div className="flex items-center gap-2 bg-blue-950/90 rounded-xl px-3 py-1 border border-cyan-500/40">
                      <span className="text-xs text-cyan-200">Քո ձայնը՝</span>
                      <audio src={audioUrl} controls className="h-6 w-48" />
                    </div>
                  )}
                </div>
              </div>

              {/* NAVIGATION BUTTONS: CONTINUE / NEXT QUESTION */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    currentIdx === 0
                      ? 'opacity-30 cursor-not-allowed bg-blue-950/40 border-blue-900 text-slate-500'
                      : 'bg-blue-950/70 border-blue-800 text-slate-200 hover:border-cyan-400'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Նախորդ հարցը</span>
                </button>

                {currentIdx < QUESTIONS_DATA.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02]"
                  >
                    <span>Հաջորդ հարցը (Continuar)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAnswersModal(true)}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  >
                    <span>Ավարտել և տեսնել արդյունքը</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          )}

          {/* SKIPPING CONTROLS WHEN NOT YET ANSWERED */}
          {!isAnswered && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                  currentIdx === 0
                    ? 'opacity-30 cursor-not-allowed bg-blue-950/40 border-blue-900 text-slate-500'
                    : 'bg-blue-950/70 border-blue-800 text-slate-200 hover:border-cyan-400'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Նախորդը</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIdx === QUESTIONS_DATA.length - 1}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                  currentIdx === QUESTIONS_DATA.length - 1
                    ? 'opacity-30 cursor-not-allowed bg-blue-950/40 border-blue-900 text-slate-500'
                    : 'bg-blue-950/70 border-blue-800 text-slate-200 hover:border-cyan-400'
                }`}
              >
                <span>Բաց թողնել</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* RIGHT DESKTOP SIDEBAR: CLASSIC MILLIONAIRE MONEY / LEVEL TREE */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-gradient-to-b from-[#081229] via-[#050C1F] to-[#040918] border-2 border-blue-900/80 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-blue-900/60 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              ÁRBOL DE PREGUNTAS
            </span>
            <span className="text-xs text-slate-400">
              {answeredCount} / 20
            </span>
          </div>

          {/* 20 Levels Ladder */}
          <div className="flex flex-col gap-1 overflow-y-auto">
            {PRIZE_LADDER.map((item) => {
              const qIdx = item.level - 1;
              const isCurrent = qIdx === currentIdx;
              const userAns = selectedAnswers[item.level];
              const isLogical = userAns && userAns === QUESTIONS_DATA[qIdx].logicalAnswerKey;
              const isHumorous = userAns && userAns !== QUESTIONS_DATA[qIdx].logicalAnswerKey;

              let rowStyle = 'text-slate-400 hover:text-white hover:bg-blue-950/50';
              let numColor = 'text-slate-500';

              if (item.milestone) {
                rowStyle = 'text-white font-bold bg-blue-950/30';
                numColor = 'text-amber-400 font-bold';
              }

              if (isLogical) {
                rowStyle = 'text-emerald-300 font-bold bg-emerald-950/40 border-l-2 border-emerald-400';
              } else if (isHumorous) {
                rowStyle = 'text-amber-300 font-medium bg-amber-950/30 border-l-2 border-amber-400';
              }

              if (isCurrent) {
                rowStyle = 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-[1.02]';
                numColor = 'text-slate-950 font-black';
              }

              return (
                <button
                  key={item.level}
                  onClick={() => setCurrentIdx(qIdx)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all text-left ${rowStyle}`}
                >
                  <span className={`font-mono text-[11px] ${numColor}`}>
                    {item.level.toString().padStart(2, '0')}
                  </span>

                  <span className="font-mono tracking-wider">
                    {item.value}
                  </span>

                  <span className="text-[10px]">
                    {isCurrent ? '▶' : isLogical ? '✓' : isHumorous ? '★' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stats Bar */}
          <div className="mt-4 pt-3 border-t border-blue-900/60 flex items-center justify-around text-center text-xs">
            <div>
              <p className="text-slate-400 text-[10px]">Տրամաբանական</p>
              <p className="font-bold text-emerald-400">{logicalCount}</p>
            </div>
            <div className="w-px h-6 bg-blue-900" />
            <div>
              <p className="text-slate-400 text-[10px]">Հումորային</p>
              <p className="font-bold text-amber-400">{humorCount}</p>
            </div>
            <div className="w-px h-6 bg-blue-900" />
            <div>
              <button
                onClick={handleRestart}
                className="text-slate-400 hover:text-white transition-colors"
                title="Վերսկսել"
              >
                <RotateCcw className="w-4 h-4 mx-auto" />
              </button>
            </div>
          </div>
        </aside>

      </div>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-blue-950 bg-[#030814] py-3.5 px-4 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            «Ո՞վ է ուզում դառնալ միլիոնատեր» · Իսպաներենի խոսակցական վիկտորինա
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRestart}
              className="hover:text-amber-300 transition-colors inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Վերսկսել խաղը</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setShowAnswersModal(true)}
              className="hover:text-amber-300 transition-colors"
            >
              Ճիշտ պատասխաններ
            </button>
          </div>
        </div>
      </footer>

      {/* ================= MODALS ================= */}

      {/* 1. AUDIENCE POLL LIFELINE MODAL */}
      {showAudienceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#081229] border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Público / Դահլիճի քվեարկություն</span>
              </h3>
              <button
                onClick={() => setShowAudienceModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-3 mb-4">
              Դահլիճի 100 ներկաների քվեարկության արդյունքները.
            </p>

            {/* Simulated Audience Percentages */}
            <div className="space-y-3 font-mono text-xs">
              {currentQ.options.map((opt) => {
                const isCorrect = opt.isCorrect;
                // Logical answer gets high audience vote (68% - 78%)
                const percentage = isCorrect ? 74 : (opt.key === 'A' ? 11 : opt.key === 'B' ? 8 : 7);

                return (
                  <div key={opt.key} className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-amber-400">{opt.key}: {opt.textEs.substring(0, 30)}...</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-blue-950 rounded-full overflow-hidden border border-blue-900">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isCorrect ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowAudienceModal(false)}
              className="w-full mt-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-colors"
            >
              Շարունակել խաղը
            </button>
          </div>
        </div>
      )}

      {/* 2. PHONE A FRIEND LIFELINE MODAL */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#081229] border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-amber-400" />
                <span>Llamada al Profesor / Ուսուցչի զանգը</span>
              </h3>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 bg-blue-950/80 rounded-xl p-4 border border-blue-800 text-sm space-y-2">
              <p className="text-amber-300 font-semibold">
                — ¡Hola! Te escucho con atención...
              </p>
              <p className="text-slate-200">
                «En esta situación de condicional pasado, la opción más sensata y lógica es la <strong>{currentQ.logicalAnswerKey}</strong>. Las otras tres opciones son muy divertidas pero un poco absurdas para la vida real.»
              </p>
              <p className="text-slate-400 text-xs italic pt-1 border-t border-blue-900">
                «Այս անցյալի պայմանական իրավիճակում ամենախելամիտ տարբերակն է {currentQ.logicalAnswerKey}-ն։ Մյուսները զվարճալի են, բայց իրական կյանքում քիչ տրամաբանական։»
              </p>
            </div>

            <button
              onClick={() => setShowPhoneModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-colors"
            >
              Շնորհակալություն, շարունակել
            </button>
          </div>
        </div>
      )}

      {/* 3. PRIZE LADDER MOBILE MODAL */}
      {showLadderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#081229] border-2 border-blue-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                Árbol de Preguntas (1-20)
              </h3>
              <button
                onClick={() => setShowLadderModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 overflow-y-auto space-y-1">
              {PRIZE_LADDER.map((item) => {
                const qIdx = item.level - 1;
                const isCurrent = qIdx === currentIdx;
                const userAns = selectedAnswers[item.level];
                const isLogical = userAns && userAns === QUESTIONS_DATA[qIdx].logicalAnswerKey;

                return (
                  <button
                    key={item.level}
                    onClick={() => {
                      setCurrentIdx(qIdx);
                      setShowLadderModal(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : isLogical
                        ? 'bg-emerald-950/60 text-emerald-300'
                        : item.milestone
                        ? 'text-white font-bold bg-blue-950/50'
                        : 'text-slate-400 hover:bg-blue-950/30'
                    }`}
                  >
                    <span>{item.level}. {item.value}</span>
                    <span>{isCurrent ? '▶' : isLogical ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowLadderModal(false)}
              className="mt-2 py-2 rounded-xl bg-blue-950 text-slate-200 text-xs font-semibold"
            >
              Փակել
            </button>
          </div>
        </div>
      )}

      {/* 4. FULL ANSWER SHEET MODAL */}
      {showAnswersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#081229] border-2 border-amber-400 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-100 animate-fadeIn">
            <div className="p-5 border-b border-blue-900 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>RESPUESTAS — ՃԻՇՏ ՊԱՏԱՍԽԱՆՆԵՐ</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Բոլոր 20 հարցերի տրամաբանական ճիշտ տարբերակները
                </p>
              </div>
              <button
                onClick={() => setShowAnswersModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 divide-y divide-blue-950">
              
              {/* Score breakdown */}
              <div className="bg-blue-950/60 rounded-xl p-4 border border-blue-900 flex items-center justify-around text-center mb-3">
                <div>
                  <p className="text-xs text-slate-400">Տրամաբանական</p>
                  <p className="text-xl font-bold text-emerald-400">{logicalCount} / 20</p>
                </div>
                <div className="h-8 w-px bg-blue-900" />
                <div>
                  <p className="text-xs text-slate-400">Հումորային</p>
                  <p className="text-xl font-bold text-amber-400">{humorCount} / 20</p>
                </div>
                <div className="h-8 w-px bg-blue-900" />
                <div>
                  <p className="text-xs text-slate-400">Պատասխանված</p>
                  <p className="text-xl font-bold text-white">{answeredCount} / 20</p>
                </div>
              </div>

              {/* All questions list */}
              {QUESTIONS_DATA.map((q) => {
                const correctOpt = q.options.find(o => o.isCorrect);
                const userAns = selectedAnswers[q.id];
                const userIsCorrect = userAns === q.logicalAnswerKey;

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(q.id - 1);
                      setShowAnswersModal(false);
                    }}
                    className="pt-3 pb-2 rounded-xl p-2 hover:bg-blue-950/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-amber-400">
                        {q.id}. {q.partTitleEs}
                      </span>
                      {userAns && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          userIsCorrect ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-amber-950 text-amber-300 border border-amber-600'
                        }`}>
                          Ընտրված՝ {userAns} {userIsCorrect ? '✓' : '(Հումոր)'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 mb-1.5 font-medium">
                      {q.questionEs}
                    </p>

                    <div className="bg-emerald-950/50 border border-emerald-700/60 rounded-lg p-2 text-xs">
                      <p className="font-bold text-emerald-300">
                        {q.logicalAnswerKey}) {correctOpt?.textEs}
                      </p>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        — {correctOpt?.textHy}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>

            <div className="p-4 border-t border-blue-900 flex justify-end">
              <button
                onClick={() => setShowAnswersModal(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 uppercase tracking-wider"
              >
                Փակել
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. GRAMMAR MODAL */}
      {showGrammarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#081229] border-2 border-blue-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span>Քերականական կանոններ (A2–B1)</span>
              </h3>
              <button
                onClick={() => setShowGrammarModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-blue-950/80 rounded-xl p-3.5 border border-cyan-500/40">
                <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider block mb-1">
                  Կառուցվածքի բանաձև
                </span>
                <p className="font-mono text-sm font-bold text-amber-300">
                  {GRAMMAR_GUIDE.formula}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">Նշանակությունը.</h4>
                <p className="text-slate-300 leading-relaxed">
                  {GRAMMAR_GUIDE.explanationHy}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-blue-900">
                <h4 className="font-bold text-white">Օրինակներ.</h4>
                {GRAMMAR_GUIDE.examples.map((ex, idx) => (
                  <div key={idx} className="bg-black/40 rounded-lg p-2 border border-blue-900/60">
                    <p className="font-semibold text-amber-200">{ex.es}</p>
                    <p className="text-slate-400 text-[11px]">{ex.hy}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowGrammarModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-800"
            >
              Պարզ է
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
