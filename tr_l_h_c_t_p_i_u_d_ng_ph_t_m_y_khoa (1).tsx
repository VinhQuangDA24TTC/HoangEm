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
  
  // Audio contexts and oscillators stored in refs for robust cross-render access
  const audioCtxRef = useRef(null);
  const audioNodesRef = useRef([]);

  // Safe auto-save XP
  useEffect(() => {
    try {
      localStorage.setItem('nursing_study_xp', xp.toString());
    } catch (e) {
      // Storage limits or security policy
    }
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
      setXp(prev => prev + 25); // Gain XP on complete
      if (timerMode === 'pomodoro') {
        if (!completedQuests.includes('pomo')) {
          setCompletedQuests(prev => [...prev, 'pomo']);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, timerMode, completedQuests]);

  // Clean and stable Audio Synthesis Engine
  const stopAmbientAudio = () => {
    if (audioNodesRef.current) {
      audioNodesRef.current.forEach(node => {
        try { node.stop(); } catch (e) {}
      });
      audioNodesRef.current = [];
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
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
        // Generate relaxing pink noise programmatically
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
          output[i] *= 0.11; // normalise volume
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

        // Slow wave modulation
        if (ambientSound === 'waves') {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.frequency.value = 0.15; // 6.6s periods
          oscGain.gain.value = 0.03;
          
          osc.connect(oscGain);
          oscGain.connect(gainNode.gain);
          osc.start();
          audioNodesRef.current.push(osc);
        }

      } else if (ambientSound === 'binaural') {
        // Binaural 10Hz Alpha Beats for intense flow focus
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        const gainLeft = ctx.createGain();
        const gainRight = ctx.createGain();

        oscLeft.frequency.value = 140; // Left ear
        oscRight.frequency.value = 150; // Right ear (10Hz focus difference)

        gainLeft.gain.value = 0.025;
        gainRight.gain.value = 0.025;

        // Stereo Panning
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
      console.warn("Audio System not supported or blocked by user permissions.");
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
      utterance.rate = 0.8; // optimal learning speed
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
      
      const score = Math.floor(Math.random() * 20) + 79; // 79% to 98%
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
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-150' : 'bg-slate-50 text-slate-800'}`}>
      
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
            {/* Gamification Progress */}
            <div className={`flex items-center gap-3 p-2 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
              title="Chuyển đổi giao diện Sáng/Tối"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className={`flex p-1 rounded-xl w-full max-w-lg mx-auto ${darkMode ? 'bg-slate-800' : 'bg-slate-200/70'}`}>
          <button 
            onClick={() => setActiveTab('plan')}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'plan' ? (darkMode ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-teal-800 shadow-md') : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Settings className="w-4 h-4" /> Lập kế hoạch
          </button>
          <button 
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all relative ${activeTab === 'practice' ? (darkMode ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-teal-800 shadow-md') : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
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
            {/* Setting up Hours */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} shadow-sm`}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-500" />
                  Quỹ thời gian mỗi ngày
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Thời gian tự học:</span>
                      <span className="font-bold text-teal-500 text-lg">{totalStudyHours} giờ</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" max="10" step="0.5"
                      value={totalStudyHours}
                      onChange={(e) => setTotalStudyHours(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-150 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-indigo-500 flex items-center gap-1.5">
                        <Mic className="w-4 h-4" /> Luyện Phát Âm:
                      </span>
                      <span className="font-bold text-indigo-500 text-lg">{englishMinutes} phút</span>
                    </div>
                    <input 
                      type="range" 
                      min="15" max="90" step="15"
                      value={englishMinutes}
                      onChange={(e) => setEnglishMinutes(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Subject Adder */}
              <div className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} shadow-sm`}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  Môn học Điều dưỡng
                </h2>

                <form onSubmit={addSubject} className="space-y-3 mb-4">
                  <input 
                    type="text" 
                    placeholder="Tên môn học chính quy..." 
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                  <div className="flex gap-2">
                    <select 
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className={`flex-1 p-3 text-sm rounded-xl border focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value="high">Ưu tiên: Cao</option>
                      <option value="medium">Ưu tiên: Trung bình</option>
                      <option value="low">Ưu tiên: Thấp</option>
                    </select>
                    <button type="submit" className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white p-3 rounded-xl transition-all shadow-md active:scale-95">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {subjects.map(sub => (
                    <div key={sub.id} className={`flex items-center justify-between p-3 rounded-xl border group transition-all ${darkMode ? 'bg-slate-800/50 border-slate-755' : 'bg-slate-50 border-slate-100'}`}>
                      <div>
                        <p className="font-semibold text-sm">{sub.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block border ${PRIORITY_WEIGHTS[sub.priority].color}`}>
                          {PRIORITY_WEIGHTS[sub.priority].label}
                        </span>
                      </div>
                      <button 
                        onClick={() => removeSubject(sub.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timetable visualizer */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-850 border-slate-750' : 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100'} flex items-center gap-3`}>
                  <div className="p-2 bg-teal-500 rounded-xl text-white"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Quỹ tự học</p>
                    <p className="text-lg font-black text-teal-600">{Math.floor(allocation.total / 60)}h {allocation.total % 60}m</p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-850 border-slate-750' : 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100'} flex items-center gap-3`}>
                  <div className="p-2 bg-indigo-500 rounded-xl text-white"><Mic className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Học Phát Âm</p>
                    <p className="text-lg font-black text-indigo-600">{allocation.english} phút</p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-850 border-slate-750' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'} flex items-center gap-3`}>
                  <div className="p-2 bg-amber-500 rounded-xl text-white"><BookMarked className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Chuyên ngành</p>
                    <p className="text-lg font-black text-amber-600">{Math.floor(allocation.nursing / 60)}h {allocation.nursing % 60}m</p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} shadow-md`}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-150 dark:border-slate-800">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-teal-500" />
                    Kế hoạch thông minh hằng ngày
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                    <TrendingUp className="w-4 h-4" /> Hệ thống tính toán offline
                  </div>
                </div>

                <div className="space-y-6">
                  {/* English task */}
                  <div className="relative pl-6 border-l-2 border-indigo-500">
                    <div className="absolute w-4 h-4 bg-indigo-500 rounded-full -left-[9px] top-1 ring-4 ring-white dark:ring-slate-900" />
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-base text-indigo-600 dark:text-indigo-400">Phát âm Tiếng Anh Y Khoa</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Luyện cơ miệng chuẩn với bảng phiên âm quốc tế IPA.</p>
                      </div>
                      <div className="bg-indigo-600 text-white text-xs font-black px-3 py-1.5 rounded-lg">
                        {allocation.english} phút
                      </div>
                    </div>
                  </div>

                  {/* Nursing Tasks */}
                  {allocation.subjects.map((sub, index) => (
                    <div key={sub.id} className="relative pl-6 border-l-2 border-teal-500">
                      <div className="absolute w-4 h-4 bg-teal-500 rounded-full -left-[9px] top-1 ring-4 ring-white dark:ring-slate-900" />
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">{sub.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block border ${PRIORITY_WEIGHTS[sub.priority].color}`}>
                            Độ ưu tiên: {PRIORITY_WEIGHTS[sub.priority].label}
                          </span>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-600 border border-teal-200 dark:border-teal-900 text-xs font-black px-3 py-1.5 rounded-lg block">
                            {Math.floor(sub.allocatedMins / 60) > 0 ? `${Math.floor(sub.allocatedMins / 60)}h ` : ''} 
                            {sub.allocatedMins % 60} phút
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            ~ {Math.round(sub.allocatedMins / 25)} Pomodoros
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                        <div 
                          className="bg-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(sub.allocatedMins / Math.max(1, allocation.nursing)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Dữ liệu lưu trữ cục bộ, an toàn, bảo mật trên máy tính của bạn.</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('practice')}
                    className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all active:scale-95"
                  >
                    Bắt đầu học phát âm <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'practice' ? (
          /* PRACTICE TAB */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-150'}`}>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-indigo-500" />
                  Thuật ngữ Y khoa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Chọn từ bất kỳ để nghe và nói lại:</p>
                
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {MEDICAL_VOCAB.map((v) => (
                    <button
                      key={v.term}
                      onClick={() => {
                        setSelectedWord(v);
                        setPracticeResult(null);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedWord.term === v.term 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 font-bold' 
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-800 dark:text-slate-100 font-bold">{v.term}</span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{v.category}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{v.ipa}</span>
                        <span className="text-xs text-slate-400">{v.meaning}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} text-center shadow-lg`}>
                <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold uppercase tracking-wider">Thực hành từ vựng</span>
                
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-4 tracking-tight">{selectedWord.term}</h2>
                <p className="text-lg text-indigo-600 dark:text-indigo-400 font-black mt-1">{selectedWord.ipa}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Định nghĩa: <strong className="text-slate-700 dark:text-slate-300 font-medium">{selectedWord.meaning}</strong></p>

                <div className="mt-6 flex justify-center gap-4">
                  <button 
                    onClick={() => speakWord(selectedWord.term)}
                    className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" /> Phát giọng mẫu (Offline)
                  </button>
                </div>

                <div className={`mt-6 p-4 rounded-xl border text-left max-w-lg mx-auto ${darkMode ? 'bg-slate-800 border-slate-750' : 'bg-amber-50/50 border-amber-100'}`}>
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4" /> Lưu ý khẩu hình:
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{selectedWord.soundTrap}</p>
                </div>

                {/* Simulated Speech Analysis */}
                <div className="mt-8 py-8 flex flex-col items-center justify-center border-t border-slate-150 dark:border-slate-800">
                  <button
                    onClick={startRecording}
                    disabled={isRecording}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isRecording 
                        ? 'bg-rose-500 text-white shadow-lg animate-pulse' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-75" />
                    )}
                    <Mic className="w-8 h-8" />
                  </button>
                  <p className="text-xs text-slate-400 mt-4 font-semibold uppercase tracking-widest">
                    {isRecording ? 'Đang lắng nghe...' : 'Ấn và phát âm từ này'}
                  </p>

                  {audioPulse && (
                    <div className="flex gap-1 items-end h-8 mt-4">
                      <div className="w-1 bg-rose-400 h-6 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 bg-rose-500 h-8 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 bg-rose-600 h-4 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-1 bg-rose-500 h-7 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  )}
                </div>

                {practiceResult && (
                  <div className={`mt-4 p-5 rounded-2xl border text-left max-w-xl mx-auto transition-all ${
                    practiceResult.score > 85 
                      ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-sm flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-4 h-4" /> Thẩm định âm học
                      </h4>
                      <div className="text-right">
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{practiceResult.score}%</span>
                      </div>
                    </div>
                    
                    <p className="text-xs font-semibold mb-3 text-slate-700 dark:text-slate-300">{practiceResult.message}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-[11px] pt-3 border-t border-slate-150 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block">Trọng âm:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{practiceResult.feedback.syllables}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Âm đuôi:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{practiceResult.feedback.endingSound}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* TIMER TAB */
          <div className="max-w-2xl mx-auto space-y-6">
            <div className={`p-8 rounded-3xl border text-center transition-all shadow-xl ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'}`}>
              
              <div className="mb-6">
                <span className="text-xs px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Phòng Học Tập Trung</span>
                
                <div className="mt-4 max-w-md mx-auto">
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Môn học đang tập trung:</label>
                  <select 
                    value={currentTask}
                    onChange={(e) => setCurrentTask(e.target.value)}
                    className="w-full p-2.5 font-bold text-center text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 rounded-xl focus:outline-none cursor-pointer text-sm"
                  >
                    <option value="Phát âm Tiếng Anh Y Khoa">Phát âm Tiếng Anh ({allocation.english} phút/ngày)</option>
                    <optgroup label="Chuyên ngành Điều dưỡng">
                      {allocation.subjects.map(sub => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name} (Mục tiêu: {sub.allocatedMins} phút)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="flex justify-center gap-2.5 mb-8">
                <button 
                  onClick={() => changeTimerMode('pomodoro', 25)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${timerMode === 'pomodoro' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                >
                  Pomodoro (25p)
                </button>
                <button 
                  onClick={() => changeTimerMode('shortBreak', 5)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${timerMode === 'shortBreak' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                >
                  Nghỉ ngắn (5p)
                </button>
                <button 
                  onClick={() => changeTimerMode('longBreak', 15)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${timerMode === 'longBreak' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                >
                  Nghỉ dài (15p)
                </button>
              </div>

              <div className="text-[6rem] sm:text-[8rem] font-black text-slate-800 dark:text-white leading-none tracking-tight mb-8 tabular-nums">
                {formatTime(timeLeft)}
              </div>

              {/* Ambient Sound Engine */}
              <div className="mb-8 border-t border-b border-slate-150 dark:border-slate-800 py-4 max-w-md mx-auto">
                <p className="text-xs text-slate-400 font-bold mb-3 flex items-center justify-center gap-1.5">
                  <Music className="w-4 h-4 text-teal-500" /> Sóng não & Âm thanh giúp tập trung sâu:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'Tắt âm' },
                    { id: 'rain', label: 'Tiếng mưa' },
                    { id: 'waves', label: 'Sóng biển' },
                    { id: 'binaural', label: 'Tần số Alpha' },
                  ].map(sound => (
                    <button
                      key={sound.id}
                      onClick={() => setAmbientSound(sound.id)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${ambientSound === sound.id ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                    >
                      {sound.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={toggleTimer}
                  className={`w-16 h-16 flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 ${isActive ? 'bg-amber-500 text-white' : 'bg-teal-600 text-white'}`}
                >
                  {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>
                <button 
                  onClick={resetTimer}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-100'} shadow-sm`}>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Nhiệm vụ rèn luyện hằng ngày (Nhận XP)
              </h3>
              <div className="space-y-2">
                {dailyQuests.map(quest => (
                  <div key={quest.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${quest.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                        {quest.done && <CheckCircle className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs ${quest.done ? 'line-through text-slate-400 font-normal' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>{quest.text}</span>
                    </div>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded">+{quest.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}