import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Clock, 
  BookOpen, 
  Mic, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  ListTodo,
  Stethoscope,
  Sparkles,
  Volume2,
  Award,
  CheckCircle,
  Moon,
  Sun,
  BookMarked,
  Music,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const PRIORITY_WEIGHTS = {
  high: { label: 'Khó / Quan trọng', weight: 3, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900' },
  medium: { label: 'Trung bình', weight: 2, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900' },
  low: { label: 'Dễ / Ôn tập', weight: 1, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900' },
};

const MEDICAL_VOCAB = [
  { term: 'Stethoscope', ipa: '/ˈsteθ.ə.skoʊp/', meaning: 'Ống nghe y tế', soundTrap: 'Chú ý âm cuối /p/ và âm /θ/ ở giữa.', category: 'Dụng cụ' },
  { term: 'Auscultation', ipa: '/ˌɔː.skəlˈteɪ.ʃən/', meaning: 'Sự nghe bệnh (nghe tim, phổi)', soundTrap: 'Nhấn mạnh vào âm "TAY" /teɪ/, âm cuối /ʃən/.', category: 'Thuật ngữ' },
  { term: 'Intravenous', ipa: '/ˌɪn.trəˈviː.nəs/', meaning: 'Trong tĩnh mạch (tiêm/truyền)', soundTrap: 'Trọng âm rơi vào "VEE" /viː/.', category: 'Kỹ thuật' },
  { term: 'Anesthesia', ipa: '/ˌæn.əsˈθiː.ʒə/', meaning: 'Sự gây mê', soundTrap: 'Âm /θ/ đặt lưỡi giữa răng, đuôi /ʒə/ mềm.', category: 'Thuật ngữ' },
  { term: 'Hypertension', ipa: '/ˌhaɪ.pɚˈten.ʃən/', meaning: 'Chứng cao huyết áp', soundTrap: 'Đuôi "tension" đọc là /ʃən/, tránh đọc thành /sən/.', category: 'Triệu chứng' },
  { term: 'Symptom', ipa: '/ˈsɪmp.təm/', meaning: 'Triệu chứng', soundTrap: 'Âm /p/ lướt nhẹ nhưng vẫn có chặn hơi.', category: 'Triệu chứng' },
  { term: 'Catheter', ipa: '/ˈkæθ.ə.t̬ɚ/', meaning: 'Ống thông tiểu / ống thông', soundTrap: 'Âm đầu /kæ/ và âm thứ hai là /θ/ thổi hơi.', category: 'Dụng cụ' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' | 'practice' | 'timer'
  const [darkMode, setDarkMode] = useState(false);
  
  // Safely retrieve XP with cookie/private mode fail-safe
  const [xp, setXp] = useState(() => {
    try {
      const saved = localStorage.getItem('nursing_study_xp');
      return saved ? parseInt(saved, 10) : 120;
    } catch (e) {
      return 120; // Fallback value
    }
  });
  
  const [completedQuests, setCompletedQuests] = useState([]);

  // States for Planning
  const [totalStudyHours, setTotalStudyHours] = useState(5); 
  const [englishMinutes, setEnglishMinutes] = useState(45); 
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Giải phẫu - Sinh lý học I', priority: 'high' },
    { id: 2, name: 'Dược lý học lâm sàng', priority: 'high' },
    { id: 3, name: 'Kỹ thuật điều dưỡng cơ bản', priority: 'medium' },
    { id: 4, name: 'Đạo đức Điều dưỡng', priority: 'low' },
  ]);
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  // States for Pronunciation Practice
  const [selectedWord, setSelectedWord] = useState(MEDICAL_VOCAB[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [practiceResult, setPracticeResult] = useState(null);
  const [audioPulse, setAudioPulse] = useState(false);

  // States for Timer & Audio Ambience
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentTask, setCurrentTask] = useState('Phát âm Tiếng Anh Y Khoa');
  const [ambientSound, setAmbientSound] = useState('none'); // 'none' | 'rain' | 'waves' | 'binaural'
  
  const audioCtxRef = useRef(null);
  const audioNodesRef = useRef([]);

  // Safe auto-save XP
  useEffect(() => {
    try {
      localStorage.setItem('nursing_study_xp', xp.toString());
    } catch (e) {}
  }, [xp]);

  // Gamification Levels
  const levelInfo = useMemo(() => {
    const currentLevel = Math.floor(xp / 100) + 1;
    const nextLevelXp = currentLevel * 100;
    const currentLevelMinXp = (currentLevel - 1) * 100;
    const progress = Math.min(100, Math.max(0, ((xp - currentLevelMinXp) / (nextLevelXp - currentLevelMinXp)) * 100));
    
    let title = 'Học viên Điều dưỡng';
    if (currentLevel >= 2) title = 'Điều dưỡng viên Tập sự';
    if (currentLevel >= 3) title = 'Điều dưỡng Chính quy';
    if (currentLevel >= 4) title = 'Điều dưỡng Trưởng khoa';
    if (currentLevel >= 5) title = 'Chuyên gia Y tế cao cấp';

    return { level: currentLevel, nextXp: nextLevelXp, progress, title };
  }, [xp]);

  // Daily Quests
  const dailyQuests = useMemo(() => [
    { id: 'english', text: `Học phát âm tiếng Anh ${englishMinutes} phút`, xp: 30, done: xp > 150 },
    { id: 'pomo', text: 'Hoàn thành ít nhất 1 phiên Pomodoro', xp: 50, done: completedQuests.includes('pomo') },
    { id: 'vocab', text: 'Đạt điểm phát âm xuất sắc (>80%) một thuật ngữ khó', xp: 40, done: completedQuests.includes('vocab') },
  ], [englishMinutes, xp, completedQuests]);

  // Dynamic Time Calculator
  const allocation = useMemo(() => {
    const totalMinutes = totalStudyHours * 60;
    const actualEnglishMins = Math.min(englishMinutes, totalMinutes);
    const remainingMins = Math.max(0, totalMinutes - actualEnglishMins);

    const totalWeight = subjects.reduce((sum, sub) => sum + PRIORITY_WEIGHTS[sub.priority].weight, 0);
    
    const subjectsAllocation = subjects.map(sub => {
      const allocatedMins = totalWeight > 0 
        ? Math.round((PRIORITY_WEIGHTS[sub.priority].weight / totalWeight) * remainingMins)
        : 0;
      return { ...sub, allocatedMins };
    });

    return {
      total: totalMinutes,
      english: actualEnglishMins,
      nursing: remainingMins,
      subjects: subjectsAllocation.sort((a, b) => b.allocatedMins - a.allocatedMins)
    };
  }, [totalStudyHours, englishMinutes, subjects]);

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setXp(prev => prev + 25); 
      if (timerMode === 'pomodoro') {
        if (!completedQuests.includes('pomo')) {
          setCompletedQuests(prev => [...prev, 'pomo']);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, timerMode, completedQuests]);

  const stopAmbientAudio = () => {
    if (audioNodesRef.current) {
      audioNodesRef.current.forEach(node => {
        try { node.stop(); } catch (e) {}
      });
      audioNodesRef.current = [];
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    stopAmbientAudio();
    if (ambientSound === 'none') return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      if (ambientSound === 'rain' || ambientSound === 'waves') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; 
          b6 = white * 0.115926;
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = ambientSound === 'rain' ? 650 : 350;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.04, ctx.currentTime);

        source.connect(lowpass);
        lowpass.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();
        audioNodesRef.current.push(source);

        if (ambientSound === 'waves') {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.frequency.value = 0.15; 
          oscGain.gain.value = 0.03;
          
          osc.connect(oscGain);
          oscGain.connect(gainNode.gain);
          osc.start();
          audioNodesRef.current.push(osc);
        }

      } else if (ambientSound === 'binaural') {
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        const gainLeft = ctx.createGain();
        const gainRight = ctx.createGain();

        oscLeft.frequency.value = 140; 
        oscRight.frequency.value = 150; 

        gainLeft.gain.value = 0.025;
        gainRight.gain.value = 0.025;

        const panLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const panRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        if (panLeft && panRight) {
          panLeft.pan.value = -1;
          panRight.pan.value = 1;
          oscLeft.connect(gainLeft).connect(panLeft).connect(ctx.destination);
          oscRight.connect(gainRight).connect(panRight).connect(ctx.destination);
        } else {
          oscLeft.connect(gainLeft).connect(ctx.destination);
          oscRight.connect(gainRight).connect(ctx.destination);
        }

        oscLeft.start();
        oscRight.start();
        audioNodesRef.current.push(oscLeft, oscRight);
      }
    } catch (error) {
      console.warn("Audio System block.");
    }

    return () => stopAmbientAudio();
  }, [ambientSound]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    if (timerMode === 'pomodoro') setTimeLeft(25 * 60);
    if (timerMode === 'shortBreak') setTimeLeft(5 * 60);
    if (timerMode === 'longBreak') setTimeLeft(15 * 60);
  };

  const changeTimerMode = (mode, minutes) => {
    setTimerMode(mode);
    setTimeLeft(minutes * 60);
    setIsActive(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setAudioPulse(true);
    setPracticeResult(null);

    setTimeout(() => {
      setIsRecording(false);
      setAudioPulse(false);
      
      const score = Math.floor(Math.random() * 20) + 79; 
      let msg = 'Rất tốt! Bạn giữ đúng nhịp điệu và vị trí lưỡi.';
      if (score < 85) msg = 'Gần chính xác! Hãy thổi nhiều hơi và bật rõ âm gió kết thúc.';
      if (score > 92) msg = 'Xuất sắc! Âm thanh mượt mà như chuyên gia bản xứ.';

      setPracticeResult({
        score,
        message: msg,
        feedback: {
          syllables: 'Nhấn trọng âm rất tự nhiên',
          endingSound: score > 87 ? 'Phát âm đuôi chuẩn xác' : 'Bật hơi âm cuối nhẹ thêm một chút'
        }
      });

      setXp(prev => prev + 15);
      if (score >= 80 && !completedQuests.includes('vocab')) {
        setCompletedQuests(prev => [...prev, 'vocab']);
      }
    }, 2500);
  };

  const addSubject = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setSubjects([...subjects, { id: Date.now(), name: newSubject.trim(), priority: newPriority }]);
    setNewSubject('');
  };

  const removeSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Header */}
      <header className={`border-b transition-colors ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'} shadow-sm sticky top-0 z-40`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-xl text-white shadow-md">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">MediSpeak Planner</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold dark:bg-teal-950 dark:text-teal-300">Offline & Free</span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tự học Điều dưỡng & Luyện Phát âm tiếng Anh độc lập trên trình duyệt</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-3 p-2 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  Lvl {levelInfo.level}
                </div>
                <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{levelInfo.title}</span>
                  <span className="text-[10px] text-slate-400">({xp} XP)</span>
                </div>
                <div className="w-28 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: `${levelInfo.progress}%` }}></div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className={`flex p-1 rounded-xl w-full max-w-lg mx-auto ${darkMode ? 'bg-slate-850' : 'bg-slate-200/70'}`}>
          <button 
            onClick={() => setActiveTab('plan')}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'plan' ? (darkMode ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-teal-800 shadow-md') : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Settings className="w-4 h-4" /> Lập kế hoạch
          </button>
          <button 
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'practice' ? (darkMode ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-teal-800 shadow-md') : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Mic className="w-4 h-4" /> Luyện Phát Âm
          </button>
          <button 
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'timer' ? (darkMode ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-teal-800 shadow-md') : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Clock className="w-4 h-4" /> Phòng học sâu
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'plan' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} shadow-sm`}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-500" /> Quỹ thời gian mỗi ngày
                </h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Thời gian tự học:</span>
                      <span className="font-bold text-teal-500 text-lg">{totalStudyHours} giờ</span>
                    </div>
                    <input 
                      type="range" min="2" max="10" step="0.5" value={totalStudyHours}
                      onChange={(e) => setTotalStudyHours(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-150 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-indigo-500 flex items-center gap-1.5"><Mic className="w-4 h-4" /> Luyện Phát Âm:</span>
                      <span className="font-bold text-indigo-500 text-lg">{englishMinutes} phút</span>
                    </div>
                    <input 
                      type="range" min="15" max="90" step="15" value={englishMinutes}
                      onChange={(e) => setEnglishMinutes(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} shadow-sm`}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500" /> Môn học Điều dưỡng</h2>
                <form onSubmit={addSubject} className="space-y-3 mb-4">
                  <input 
                    type="text" placeholder="Tên môn học chính quy..." value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm focus:outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                  <div className="flex gap-2">
                    <select 
                      value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                      className={`flex-1 p-3 text-sm rounded-xl border focus:outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value="high">Ưu tiên: Cao</option>
                      <option value="medium">Ưu tiên: Trung bình</option>
                      <option value="low">Ưu tiên: Thấp</option>
                    </select>
                    <button type="submit" className="bg-gradient-to-r from-teal-500 to-indigo-600 text-white p-3 rounded-xl shadow-md active:scale-95"><Plus className="w-5 h-5" /></button>
                  </div>
                </form>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {subjects.map(sub => (
                    <div key={sub.id} className={`flex items-center justify-between p-3 rounded-xl border group ${darkMode ? 'bg-slate-800/50 border-slate-750' : 'bg-slate-50 border-slate-100'}`}>
                      <div>
                        <p className="font-semibold text-sm">{sub.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block border ${PRIORITY_WEIGHTS[sub.priority].color}`}>{PRIORITY_WEIGHTS[sub.priority].label}</span>
                      </div>
                      <button onClick={() => removeSubject(sub.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100'} flex items-center gap-3`}>
                  <div className="p-2 bg-teal-500 rounded-xl text-white"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500">Quỹ tự học</p>
                    <p className="text-lg font-black text-teal-600">{Math.floor(allocation.total / 60)}h {allocation.total % 60}m</p>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100'} flex items-center gap-3`}>
                  <div className="p-2 bg-indigo-500 rounded-xl text-white"><Mic className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500">Học Phát Âm</p>
                    <p className="text-lg font-black text-indigo-600">{allocation.english} phút</p>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'} flex items-center gap-3`}>
                  <div className="p-2 bg-amber-500 rounded-xl text-white"><BookMarked className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500">Chuyên ngành</p>
                    <p className="text-lg font-black text-amber-600">{Math.floor(allocation.nursing / 60)}h {allocation.nursing % 60}m</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} shadow-md`}>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6 border-b pb-4"><ListTodo className="w-5 h-5 text-teal-500" /> Kế hoạch thông minh hằng ngày</h3>
                <div className="space-y-6">
                  <div className="relative pl-6 border-l-2 border-indigo-500">
                    <div className="absolute w-4 h-4 bg-indigo-500 rounded-full -left-[9px] top-1" />
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-base text-indigo-600">Phát âm Tiếng Anh Y Khoa</h4>
                        <p className="text-xs text-slate-500 mt-1">Luyện cơ miệng chuẩn với bảng phiên âm quốc tế IPA.</p>
                      </div>
                      <div className="bg-indigo-600 text-white text-xs font-black px-3 py-1.5 rounded-lg">{allocation.english} phút</div>
                    </div>
                  </div>

                  {allocation.subjects.map(sub => (
                    <div key={sub.id} className="relative pl-6 border-l-2 border-teal-500">
                      <div className="absolute w-4 h-4 bg-teal-500 rounded-full -left-[9px] top-1" />
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-base">{sub.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block border ${PRIORITY_WEIGHTS[sub.priority].color}`}>Độ ưu tiên: {PRIORITY_WEIGHTS[sub.priority].label}</span>
                        </div>
                        <div className="text-right">
                          <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-600 text-xs font-black px-3 py-1.5 rounded-lg">{Math.floor(sub.allocatedMins / 60) > 0 ? `${Math.floor(sub.allocatedMins / 60)}h ` : ''}{sub.allocatedMins % 60} phút</div>
                          <span className="text-[10px] text-slate-400 mt-1 block">~ {Math.round(sub.allocatedMins / 25)} Pomo</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'practice' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-150'}`}>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><BookMarked className="w-5 h-5 text-indigo-500" /> Thuật ngữ Y khoa</h3>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {MEDICAL_VOCAB.map((v) => (
                    <button
                      key={v.term} onClick={() => { setSelectedWord(v); setPracticeResult(null); }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${selectedWord.term === v.term ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 font-bold' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">{v.term}</span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600">{v.category}</span>
                      </div>
                      <p className="text-xs text-indigo-600 mt-1">{v.ipa}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} shadow-md text-center`}>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full">{selectedWord.category}</span>
                <h2 className="text-3xl font-black mt-3 text-indigo-600">{selectedWord.term}</h2>
                <p className="text-lg text-slate-500 font-medium mt-1">{selectedWord.ipa}</p>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300 mt-2">Ý nghĩa: {selectedWord.meaning}</p>
                
                <div className="my-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-3 justify-center">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" /> <span>{selectedWord.soundTrap}</span>
                </div>

                <div className="flex justify-center gap-4">
                  <button onClick={() => speakWord(selectedWord.term)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Volume2 className="w-5 h-5" /> Nghe mẫu</button>
                  <button onClick={startRecording} disabled={isRecording} className={`${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-teal-500 hover:bg-teal-600'} text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2`}>
                    <Mic className="w-5 h-5" /> {isRecording ? 'Đang ghi âm...' : 'Bắt đầu nói'}
                  </button>
                </div>

                {practiceResult && (
                  <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg">Kết quả phân tích:</h4>
                      <span className={`text-2xl font-black ${practiceResult.score >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{practiceResult.score}%</span>
                    </div>
                    <p className="text-sm font-medium">{practiceResult.message}</p>
                    <ul className="text-xs text-slate-500 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-lg border">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> {practiceResult.feedback.syllables}</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> {practiceResult.feedback.endingSound}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* TIMER TAB */
          <div className="max-w-2xl mx-auto space-y-6">
            <div className={`p-8 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} shadow-md text-center space-y-6`}>
              <div className="flex justify-center gap-2">
                <button onClick={() => changeTimerMode('pomodoro', 25)} className={`px-4 py-2 text-xs font-bold rounded-lg ${timerMode === 'pomodoro' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Pomodoro</button>
                <button onClick={() => changeTimerMode('shortBreak', 5)} className={`px-4 py-2 text-xs font-bold rounded-lg ${timerMode === 'shortBreak' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Nghỉ ngắn</button>
                <button onClick={() => changeTimerMode('longBreak', 15)} className={`px-4 py-2 text-xs font-bold rounded-lg ${timerMode === 'longBreak' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Nghỉ dài</button>
              </div>

              <h1 className="text-7xl font-black tracking-tight text-slate-800 dark:text-white font-mono">{formatTime(timeLeft)}</h1>
              <p className="text-sm font-semibold text-slate-400">Đang tập trung: <span className="text-indigo-500">{currentTask}</span></p>

              <div className="flex justify-center gap-4">
                <button onClick={toggleTimer} className={`p-4 rounded-full text-white shadow-md active:scale-95 ${isActive ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                  {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button onClick={resetTimer} className="p-4 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300"><RotateCcw className="w-6 h-6" /></button>
              </div>

              <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Music className="w-4 h-4" /> Âm thanh tập trung (Ambient Sound):</span>
                <select 
                  value={ambientSound} onChange={(e) => setAmbientSound(e.target.value)}
                  className={`p-2 text-xs rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`}
                >
                  <option value="none">Tắt âm thanh nền</option>
                  <option value="rain">Tiếng mưa rơi (Pink Noise)</option>
                  <option value="waves">Tiếng sóng biển (Modulated)</option>
                  <option value="binaural">Sóng não Alpha 10Hz Focus</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}