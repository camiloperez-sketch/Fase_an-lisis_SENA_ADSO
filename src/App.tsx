import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  RotateCcw,
  Languages,
  Layout
} from 'lucide-react';
import { generateExamQuestions, type QuizQuestion } from './services/examService';

export default function App() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 is intro
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [isFinished, setIsFinished] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const getExplanation = async () => {
    if (!currentQ) return;
    setExplaining(true);
    setExplanation(null);
    try {
      const response = await fetch("/api/explain-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.text,
          options: currentQ.options,
          correctAnswer: currentQ.correctAnswer,
          category: currentQ.category
        })
      });
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (e) {
      console.error("Agent error", e);
      setExplanation("Vaya, parece que mi conexión falló. ¡Pero tú puedes hacerlo!");
    } finally {
      setExplaining(false);
    }
  };

  useEffect(() => {
    setExplanation(null); // Reset explanation when moving questions
  }, [currentIndex]);

  const startQuiz = async () => {
    setLoading(true);
    setErrorMsg(null);
    setQuestions([]); // Clear existing
    try {
      const data = await generateExamQuestions();
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
        setCurrentIndex(0);
        setAnswers({});
        setTimeLeft(3600);
        setIsFinished(false);
      } else {
        console.error("Empty data received:", data);
        setErrorMsg("El servidor no devolvió preguntas. Por favor, revisa los Logs de tu función en Netlify.");
        setCurrentIndex(-1); // Force back to intro
      }
    } catch (error) {
      console.error("Error generating quiz", error);
      setErrorMsg("Error de conexión. Asegúrate de haber configurado GEMINI_API_KEY en Netlify.");
      setCurrentIndex(-1); // Force back to intro
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [questions[currentIndex].id]: option });
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timer: number;
    if (currentIndex >= 0 && !isFinished && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    if (timeLeft === 0 && !isFinished && currentIndex >= 0) {
      setIsFinished(true);
    }
    return () => clearInterval(timer);
  }, [currentIndex, isFinished, timeLeft]);

  if (isFinished) {
    const score = questions.reduce((acc, q) => (answers[q.id] === q.correctAnswer ? acc + 1 : acc), 0);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-900">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200"
        >
          <div className="bg-indigo-600 p-10 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
            >
              <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-4xl font-bold mb-2">Simulacro Finalizado</h1>
            <p className="text-indigo-100 font-medium">Revisa tus resultados detallados</p>
          </div>
          
          <div className="p-10">
            <div className="flex justify-between items-center mb-10 bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <div className="text-center flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">Puntaje</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-slate-800">{score}</span>
                  <span className="text-xl text-slate-400 font-bold">/ {questions.length}</span>
                </div>
              </div>
              <div className="text-center border-l border-slate-200 pl-10 flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">Efectividad</p>
                <p className="text-5xl font-black text-indigo-600">{Math.round((score / (questions.length || 1)) * 100)}%</p>
              </div>
            </div>

            <div className="space-y-6 mb-10">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Layout className="w-5 h-5 text-indigo-600" />
                Desglose de Resultados
              </h2>
              <div className="max-h-64 overflow-y-auto pr-4 custom-scrollbar space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl bg-white hover:border-slate-300 transition-all shadow-sm">
                    <div className={`mt-1 p-1.5 rounded-lg ${answers[q.id] === q.correctAnswer ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {answers[q.id] === q.correctAnswer ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight">Q{idx + 1}: {q.text}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <p className="text-xs font-semibold">
                          Tu respuesta: <span className={answers[q.id] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}>{answers[q.id] || '(Sin responder)'}</span>
                        </p>
                        {answers[q.id] !== q.correctAnswer && (
                           <p className="text-xs font-semibold text-slate-400">
                             Correcta: <span className="text-indigo-600 font-bold">{q.correctAnswer}</span>
                           </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={startQuiz}
              className="w-full py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-100 transform active:scale-[0.98]"
            >
              <RotateCcw className="w-5 h-5" />
              Nuevo Intento Dinámico
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (currentIndex === -1) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans text-slate-900">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full"
        >
          <div className="bg-white p-12 md:p-16 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-200 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] text-indigo-900">
              <Languages className="w-64 h-64" />
            </div>
            
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl mx-auto mb-10 flex items-center justify-center text-white shadow-2xl shadow-indigo-200 transform rotate-3">
              <Languages className="w-10 h-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">EXAM SIMULATOR B1</h1>
            
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {errorMsg}
              </motion.div>
            )}

            <p className="text-lg text-slate-500 mb-12 leading-relaxed max-w-sm mx-auto font-medium">
              Practica con preguntas generadas en tiempo real para el Módulo de Certificación de Idiomas.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-12 text-left">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
                <Layout className="w-6 h-6 text-indigo-600" />
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Total Preguntas</span>
                <span className="text-2xl font-black text-slate-800">20</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
                <Clock className="w-6 h-6 text-indigo-600" />
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Tiempo Límite</span>
                <span className="text-2xl font-black text-slate-800">60 Min</span>
              </div>
            </div>
            
            <button 
              onClick={startQuiz}
              disabled={loading}
              className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-indigo-200 group"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generando...
                </div>
              ) : (
                <>
                  Iniciar Intento
                  <ChevronRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="mt-8 text-xs text-slate-400 font-bold uppercase tracking-widest">Currículo Oficial Nivel Intermedio B1</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const GrammarAgent = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] mt-8 relative group"
    >
      <div className="absolute -top-3 -left-3 bg-white p-2 rounded-full shadow-sm border border-indigo-100">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Languages className="w-4 h-4 text-white" />
        </div>
      </div>
      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
        Grammar Agent
        {explaining && <span className="flex gap-1 h-1 items-end"><span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></span><span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-75"></span><span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-150"></span></span>}
      </h4>
      <div className="text-sm text-indigo-900 leading-relaxed font-medium">
        {explaining ? "Analizando la regla..." : (explanation || "¿Necesitas ayuda con esta regla de tercera persona?")}
      </div>
      {!explanation && !explaining && (
        <button 
          onClick={getExplanation}
          className="mt-4 text-[10px] font-black text-white bg-indigo-600 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2"
        >
          Pedir Explicación
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600 p-2.5 rounded-xl">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 leading-tight">Simulador B1</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Módulo de Certificación</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="hidden md:flex items-center space-x-3">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest text-[10px]">Tiempo restante:</span>
            <div className={`px-4 py-1.5 rounded-lg border font-mono text-xl font-black flex items-center gap-2 ${
              timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
          <button 
            onClick={finishQuiz}
            className="bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 transform active:scale-95"
          >
            Terminar Intento
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6 relative">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-80 flex flex-col space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Layout className="w-4 h-4 text-indigo-600" />
              Navegación
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered = !!answers[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 w-10 flex items-center justify-center rounded-xl font-bold text-xs transition-all border ${
                      isCurrent 
                        ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100 scale-110 z-10' 
                        : isAnswered 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Estado de carga</span>
                <span>{Math.round((Object.keys(answers).length / questions.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  className="bg-indigo-600 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-indigo-900/10">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Sección Actual</p>
              <h3 className="text-xl font-bold mt-2 truncate uppercase">{currentQ?.category}</h3>
              <p className="text-xs mt-3 text-indigo-200/80 leading-relaxed">
                {currentQ?.category === 'reading' 
                  ? 'Analiza cuidadosamente el texto antes de responder las preguntas de verdadero o falso.'
                  : 'Asegúrate de conjugar correctamente los verbos según el sujeto de la oración.'}
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
        </aside>

        {/* Question Area */}
        <section className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-8 md:p-12 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center space-x-3 mb-10">
              <span className="px-4 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-widest">
                PREGUNTA {currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1}
              </span>
              <span className="h-px flex-1 bg-slate-100"></span>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-12"
              >
                {currentQ?.category === 'reading' && (
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-10">
                    <div className="flex items-center gap-3 mb-6">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Texto de Referencia</h4>
                    </div>
                    <p className="text-lg text-slate-600 font-serif italic leading-relaxed">
                      {currentQ.readingContext}
                    </p>
                  </div>
                )}

                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                  {currentQ?.text}
                </h2>

                <div className="space-y-4 max-w-3xl">
                  {currentQ?.options.map((option, idx) => {
                    const isSelected = answers[currentQ.id] === option;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(option)}
                        className={`w-full flex items-center p-6 rounded-2xl border-2 transition-all cursor-pointer group text-left ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                            : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mr-5 transition-colors ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={`text-lg font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {currentQ?.category !== 'reading' && <GrammarAgent />}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="bg-slate-50 p-6 md:px-12 flex justify-between border-t border-slate-200">
            <button 
              onClick={prevQuestion}
              disabled={currentIndex === 0}
              className="flex items-center text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-900 transition-colors disabled:opacity-0"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Pregunta Anterior
            </button>
            <button 
              onClick={nextQuestion}
              disabled={!answers[currentQ?.id]}
              className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center shadow-lg group ${
                currentIndex < questions.length - 1
                  ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              } disabled:opacity-50 disabled:grayscale`}
            >
              {currentIndex < questions.length - 1 ? 'Siguiente Pregunta' : 'Terminar Examen'}
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </footer>
        </section>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

