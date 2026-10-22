import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  BookOpen, 
  Search, 
  Music, 
  Plus, 
  Edit3, 
  Trash2, 
  LogOut, 
  UserCheck, 
  X, 
  School, 
  Palette, 
  Sparkles,
  Camera,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  Upload,
  FileAudio,
  ImageIcon,
  Check
} from 'lucide-react';
import { POEMS_DATA, Poem } from './data/poems.ts';
import { 
  saveAudioFile, 
  getAudioFile, 
  deleteAudioFile, 
  saveImageFile, 
  getImageFile, 
  deleteImageFile,
  saveClassPhoto,
  getClassPhoto
} from './utils/mediaStorage.ts';

const STORAGE_KEY_POEMS = 'mario_pederneiras_turma301_poems';
const STORAGE_KEY_PHOTO = 'mario_pederneiras_turma301_class_photo';
const STORAGE_KEY_TEACHER = 'mario_pederneiras_teacher_session';

const DEFAULT_CLASS_PHOTO = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1600&q=80';

export default function App() {
  // Poems state (synced with localStorage)
  const [poems, setPoems] = useState<Poem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POEMS);
      return saved ? JSON.parse(saved) : POEMS_DATA;
    } catch {
      return POEMS_DATA;
    }
  });

  // Class photo state
  const [classPhotoUrl, setClassPhotoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PHOTO) || DEFAULT_CLASS_PHOTO;
    } catch {
      return DEFAULT_CLASS_PHOTO;
    }
  });

  // Teacher Authentication state
  const [teacherEmail, setTeacherEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_TEACHER) || null;
    } catch {
      return null;
    }
  });

  // Navigation: 'gallery' | 'admin'
  const [activeTab, setActiveTab] = useState<'gallery' | 'admin'>('gallery');

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Audio player state
  const [currentPoem, setCurrentPoem] = useState<Poem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  // Modals state
  const [modalPoem, setModalPoem] = useState<Poem | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEditPoemModal, setShowEditPoemModal] = useState(false);
  const [editingPoem, setEditingPoem] = useState<Poem | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Uploaded media files state in modal
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [audioInputMode, setAudioInputMode] = useState<'file' | 'url'>('file');
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file');
  const [selectedClassPhotoFile, setSelectedClassPhotoFile] = useState<File | null>(null);
  const [classPhotoPreviewUrl, setClassPhotoPreviewUrl] = useState<string | null>(null);
  const [classPhotoInputMode, setClassPhotoInputMode] = useState<'file' | 'url'>('file');
  const [isSavingMedia, setIsSavingMedia] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('willian.souza@professor.gaspar.sc.gov.br');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Audio refs & Web Audio synthesizer fallback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Hydrate audio and image files from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    async function loadMediaFiles() {
      try {
        // Hydrate class photo if stored
        const photoRecord = await getClassPhoto();
        if (photoRecord && isMounted) {
          setClassPhotoUrl(URL.createObjectURL(photoRecord.blob));
        }

        // Hydrate poems audio/images
        const hydrated = await Promise.all(
          poems.map(async (p) => {
            let updated = { ...p };
            const audioRecord = await getAudioFile(p.id);
            if (audioRecord) {
              updated.audioUrl = URL.createObjectURL(audioRecord.blob);
              updated.uploadedAudioName = audioRecord.name;
            }
            const imgRecord = await getImageFile(p.id);
            if (imgRecord) {
              updated.coverUrl = URL.createObjectURL(imgRecord.blob);
              updated.uploadedCoverName = imgRecord.name;
            }
            return updated;
          })
        );

        if (isMounted) {
          setPoems(hydrated);
        }
      } catch (err) {
        console.warn('Erro ao restaurar arquivos locais do IndexedDB:', err);
      }
    }

    loadMediaFiles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save poems to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POEMS, JSON.stringify(poems));
    } catch {
      // Storage error
    }
  }, [poems]);

  // Save class photo
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PHOTO, classPhotoUrl);
    } catch {
      // Storage error
    }
  }, [classPhotoUrl]);

  // Save teacher session
  useEffect(() => {
    try {
      if (teacherEmail) {
        localStorage.setItem(STORAGE_KEY_TEACHER, teacherEmail);
      } else {
        localStorage.removeItem(STORAGE_KEY_TEACHER);
      }
    } catch {
      // Storage error
    }
  }, [teacherEmail]);

  // Show temporary toast message
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered poems based on search and selected word
  const filteredPoems = poems.filter(poem => {
    const matchesSearch = 
      poem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poem.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poem.mandatoryWords.some(w => w.toLowerCase().includes(searchTerm.toLowerCase())) ||
      poem.genre.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesWord = selectedWord 
      ? poem.mandatoryWords.some(w => w.toLowerCase() === selectedWord.toLowerCase())
      : true;

    return matchesSearch && matchesWord;
  });

  // Extract unique mandatory words
  const allWords = Array.from(
    new Set(poems.flatMap(p => p.mandatoryWords))
  );

  // Audio playback handler
  const handlePlayPoem = (poem: Poem) => {
    if (currentPoem?.id === poem.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        stopSynth();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          playFallbackSynth();
          setIsPlaying(true);
        });
      }
    } else {
      stopSynth();
      setCurrentPoem(poem);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  // Web Audio fallback synthesizer
  const playFallbackSynth = () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25];
      let noteIdx = 0;
      
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = window.setInterval(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[noteIdx % notes.length], ctx.currentTime);
        gain.gain.setValueAtTime(0.12 * volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
        noteIdx++;
      }, 500);
    } catch {
      // AudioContext unavailable
    }
  };

  const stopSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // Update audio element on currentPoem change
  useEffect(() => {
    if (currentPoem && audioRef.current) {
      audioRef.current.src = currentPoem.audioUrl;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          playFallbackSynth();
          setIsPlaying(true);
        });
    }
    return () => stopSynth();
  }, [currentPoem]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 120);
    }
  };

  const handleNextTrack = () => {
    if (!currentPoem) return;
    const currentIndex = poems.findIndex(p => p.id === currentPoem.id);
    const nextIndex = (currentIndex + 1) % poems.length;
    setCurrentPoem(poems[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    if (!currentPoem) return;
    const currentIndex = poems.findIndex(p => p.id === currentPoem.id);
    const prevIndex = (currentIndex - 1 + poems.length) % poems.length;
    setCurrentPoem(poems[prevIndex]);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Institutional Email Authentication logic
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const emailTrimmed = loginEmail.trim().toLowerCase();
    
    // Strict validation: must end in @professor.gaspar.sc.gov.br
    const isInstitutional = /^[a-zA-Z0-9._%+-]+@professor\.gaspar\.sc\.gov\.br$/.test(emailTrimmed);

    if (!isInstitutional) {
      setLoginError('Acesso restrito: É obrigatório utilizar um e-mail institucional terminado em @professor.gaspar.sc.gov.br');
      return;
    }

    setTeacherEmail(emailTrimmed);
    setShowLoginModal(false);
    setActiveTab('admin');
    showToast(`Bem-vindo, professor(a)! Painel de edição liberado.`);
  };

  const handleLogout = () => {
    setTeacherEmail(null);
    setActiveTab('gallery');
    showToast('Você saiu da área do professor.');
  };

  // File selection handlers
  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedAudioFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(objectUrl);
    if (editingPoem) {
      setEditingPoem({
        ...editingPoem,
        audioUrl: objectUrl,
        uploadedAudioName: file.name
      });
    }
    showToast(`Arquivo "${file.name}" pronto para ser salvo!`);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    if (editingPoem) {
      setEditingPoem({
        ...editingPoem,
        coverUrl: objectUrl,
        uploadedCoverName: file.name
      });
    }
    showToast(`Ilustração "${file.name}" selecionada!`);
  };

  const handleClassPhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedClassPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setClassPhotoPreviewUrl(objectUrl);
  };

  const handleSaveClassPhotoModal = async () => {
    if (selectedClassPhotoFile) {
      await saveClassPhoto(selectedClassPhotoFile);
      const objectUrl = URL.createObjectURL(selectedClassPhotoFile);
      setClassPhotoUrl(objectUrl);
      showToast('Nova foto da turma enviada e salva!');
    } else if (classPhotoUrl) {
      showToast('Foto da turma atualizada!');
    }
    setShowPhotoModal(false);
  };

  // Poem Editing & Creation
  const handleOpenEditPoem = (poem: Poem) => {
    setEditingPoem({ ...poem, stanzas: [...poem.stanzas] });
    setSelectedAudioFile(null);
    setSelectedImageFile(null);
    setAudioPreviewUrl(poem.audioUrl || null);
    setImagePreviewUrl(poem.coverUrl || null);
    setAudioInputMode('file');
    setImageInputMode(poem.uploadedCoverName ? 'file' : 'url');
    setShowEditPoemModal(true);
  };

  const handleOpenNewPoem = () => {
    const newId = String(Date.now());
    const emptyPoem: Poem = {
      id: newId,
      title: '',
      authors: '',
      mandatoryWords: ['', '', ''],
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      audioUrl: '',
      sunoUrl: '',
      genre: 'Canção Infantil',
      duration: '2:15',
      stanzas: [
        'Escreva a primeira estrofe aqui...',
        'Escreva a segunda estrofe aqui...'
      ],
      pedagogicalNote: ''
    };
    setEditingPoem(emptyPoem);
    setSelectedAudioFile(null);
    setSelectedImageFile(null);
    setAudioPreviewUrl(null);
    setImagePreviewUrl(emptyPoem.coverUrl);
    setAudioInputMode('file');
    setImageInputMode('file');
    setShowEditPoemModal(true);
  };

  const handleSavePoem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoem) return;

    if (!editingPoem.title.trim() || !editingPoem.authors.trim()) {
      alert('Por favor, preencha pelo menos o título do poema e os nomes da dupla.');
      return;
    }

    if (!editingPoem.audioUrl && !selectedAudioFile) {
      alert('Por favor, selecione o arquivo MP3 da música ou insira um link de áudio.');
      return;
    }

    setIsSavingMedia(true);
    try {
      let finalAudioUrl = editingPoem.audioUrl;
      let finalAudioName = editingPoem.uploadedAudioName;

      // Save audio to IndexedDB if a new file was chosen
      if (selectedAudioFile) {
        await saveAudioFile(editingPoem.id, selectedAudioFile, selectedAudioFile.name);
        finalAudioUrl = URL.createObjectURL(selectedAudioFile);
        finalAudioName = selectedAudioFile.name;
      }

      let finalCoverUrl = editingPoem.coverUrl;
      let finalCoverName = editingPoem.uploadedCoverName;

      // Save image to IndexedDB if a new file was chosen
      if (selectedImageFile) {
        await saveImageFile(editingPoem.id, selectedImageFile, selectedImageFile.name);
        finalCoverUrl = URL.createObjectURL(selectedImageFile);
        finalCoverName = selectedImageFile.name;
      }

      const poemToSave: Poem = {
        ...editingPoem,
        audioUrl: finalAudioUrl,
        uploadedAudioName: finalAudioName,
        coverUrl: finalCoverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        uploadedCoverName: finalCoverName
      };

      const existingIdx = poems.findIndex(p => p.id === poemToSave.id);
      if (existingIdx >= 0) {
        const updated = [...poems];
        updated[existingIdx] = poemToSave;
        setPoems(updated);
        showToast(`Poema "${poemToSave.title}" atualizado com sucesso!`);
      } else {
        setPoems([poemToSave, ...poems]);
        showToast(`Nova criação "${poemToSave.title}" com áudio MP3 adicionada!`);
      }

      if (currentPoem?.id === poemToSave.id) {
        setCurrentPoem(poemToSave);
      }

      setShowEditPoemModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar os arquivos. Tente novamente.');
    } finally {
      setIsSavingMedia(false);
    }
  };

  const handleDeletePoem = async (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja remover o poema "${title}" da galeria?`)) {
      await deleteAudioFile(id);
      await deleteImageFile(id);
      setPoems(poems.filter(p => p.id !== id));
      if (currentPoem?.id === id) {
        audioRef.current?.pause();
        setCurrentPoem(null);
        setIsPlaying(false);
      }
      showToast(`Poema "${title}" removido.`);
    }
  };

  const handleResetDefaultPoems = async () => {
    if (confirm('Deseja restaurar as músicas e dados originais da Turma 301?')) {
      for (const p of poems) {
        await deleteAudioFile(p.id);
        await deleteImageFile(p.id);
      }
      setPoems(POEMS_DATA);
      setClassPhotoUrl(DEFAULT_CLASS_PHOTO);
      showToast('Dados originais restaurados com sucesso.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-[#1DB954] selection:text-white pb-32">
      
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNextTrack}
        onError={() => {
          if (isPlaying) playFallbackSynth();
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* BARRA SUPERIOR DE NAVEGAÇÃO                                    */}
      {/* ============================================================== */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs flex items-center justify-center p-0.5 shrink-0">
              <img 
                src="/assets/aistudio/mario_pederneiras_logo_512.png" 
                alt="Brasão Escola Mario Pederneiras" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <School className="w-3.5 h-3.5 text-emerald-600" />
                <span>Escola Mario Pederneiras</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Turma 301 · 3º Ano do Ensino Fundamental
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Abas e status exibidos apenas quando o professor estiver autenticado */}
            {teacherEmail && (
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'gallery'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Mural</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'admin'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Músicas</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden md:flex flex-col items-end text-right">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Professor Conectado
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                      {teacherEmail}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
                    title="Sair da área de edição"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* ============================================================== */}
      {/* SEÇÃO 1: CABEÇALHO COM FOTO DA TURMA A 100% E TÍTULO NO CANTO  */}
      {/* ============================================================== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          
          {/* Identificação da Escola */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <span>Escola Mario Pederneiras</span>
                <span>·</span>
                <span>Turma 301 (3º Ano EF)</span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                Mural de poesias, ilustrações e canções criadas em sala de aula
              </p>
            </div>

            {teacherEmail && (
              <button
                onClick={() => setShowPhotoModal(true)}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Trocar foto da turma</span>
              </button>
            )}
          </div>

          {/* Espaço para a Foto da Turma (100% de Opacidade) com Título no Canto Inferior Direito */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-lg border-2 border-slate-200/80 aspect-[16/9] sm:aspect-[21/9] max-h-[460px] bg-slate-100">
            <img 
              src={classPhotoUrl} 
              alt="Turma 301 - Escola Mario Pederneiras" 
              className="w-full h-full object-cover object-center"
              style={{ opacity: 1 }}
            />

            {/* Título "Nossos Poemas" no canto inferior direito sobre a foto 100% visível */}
            <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 text-right z-10 pointer-events-none">
              <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-2xl border border-white/20 shadow-xl text-right inline-block">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white drop-shadow-sm">
                  Nossos Poemas
                </h1>
                <p className="text-[11px] sm:text-xs font-semibold text-emerald-300 mt-0.5 tracking-wide">
                  Turma 301 · Escola Mario Pederneiras
                </p>
              </div>
            </div>
          </div>

          {/* Recado Acolhedor e Afetivo para as Famílias (Sem jargões de IA) */}
          <div className="mt-7 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 sm:p-6 text-slate-700 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <span>🌼</span>
              <span>Queridas famílias, amigos e visitantes:</span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-700">
              Sejam muito bem-vindos ao cantinho das nossas criações! Em sala de aula, cada dupla de alunos explorou o ritmo das rimas, 
              sorteou <strong>3 palavras obrigatórias</strong> para inspirar suas histórias, desenhou a ilustração com muito carinho 
              e transformou cada estrofe em uma canção especial.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Convidamos todos a colocar o fone de ouvido, passear pelas faixas abaixo e se encantar com as vozes e versos das nossas crianças!
            </p>
          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* ABA: PAINEL DO PROFESSOR (GESTÃO E EDIÇÃO DAS MÚSICAS)          */}
      {/* ============================================================== */}
      {activeTab === 'admin' && teacherEmail ? (
        <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Painel Administrativo da Turma 301
                </span>
                <h2 className="text-2xl font-display font-bold text-slate-900 mt-0.5">
                  Gerenciador de Músicas & Poemas
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Adicione novas produções, altere títulos, palavras-chave, capas do Canva, links de áudio ou as estrofes.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleOpenNewPoem}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Nova Canção</span>
                </button>

                <button
                  onClick={handleResetDefaultPoems}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 transition"
                  title="Restaurar dados de teste padrão"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>
            </div>

            {/* Lista de Músicas para Edição */}
            <div className="mt-6 space-y-3">
              {poems.map((poem, index) => (
                <div 
                  key={poem.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-slate-50/70 hover:bg-white transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5">
                      #{index + 1}
                    </span>
                    <img 
                      src={poem.coverUrl} 
                      alt={poem.title} 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{poem.title || 'Sem título'}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          ({poem.genre})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <strong className="text-slate-700">Dupla:</strong> {poem.authors || 'Não informada'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {poem.mandatoryWords.map(w => w && (
                          <span key={w} className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                            #{w}
                          </span>
                        ))}
                        {poem.uploadedAudioName && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <FileAudio className="w-3 h-3 text-amber-600" />
                            <span>MP3: {poem.uploadedAudioName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handlePlayPoem(poem)}
                      className="p-2 rounded-xl bg-slate-200 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition"
                      title="Ouvir áudio"
                    >
                      {currentPoem?.id === poem.id && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEditPoem(poem)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 transition shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handleDeletePoem(poem.id, poem.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                      title="Remover música"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </section>
      ) : (
        /* ============================================================== */
        /* ABA: GALERIA PÚBLICA (VISUALIZAÇÃO DOS ALUNOS E FAMÍLIAS)       */
        /* ============================================================== */
        <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
          
          {/* Barra de Pesquisa & Filtros de Palavras */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs mb-8 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por poema, alunos ou palavra..." 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-xs text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-8 py-2.5 focus:outline-none transition"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Total de faixas: <strong className="text-slate-800 font-bold">{filteredPoems.length} de {poems.length}</strong></span>
                {selectedWord && (
                  <button 
                    onClick={() => setSelectedWord(null)}
                    className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    Filtro: #{selectedWord} <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtros das 3 Palavras */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-semibold shrink-0 text-[11px]">Palavras sorteadas:</span>
              <button
                onClick={() => setSelectedWord(null)}
                className={`px-2.5 py-1 rounded-lg text-xs transition font-semibold shrink-0 ${
                  selectedWord === null 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              {allWords.map(word => (
                <button
                  key={word}
                  onClick={() => setSelectedWord(selectedWord === word ? null : word)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition font-medium shrink-0 border ${
                    selectedWord === word
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  #{word}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Cards de Poemas em Tema Claro */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPoems.map((poem) => {
              const isThisPlaying = currentPoem?.id === poem.id && isPlaying;
              
              return (
                <article 
                  key={poem.id}
                  className={`group bg-white border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-md ${
                    isThisPlaying 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Capa do Canva com Play Button */}
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-100 border border-slate-200 shadow-inner">
                      <img 
                        src={poem.coverUrl} 
                        alt={`Capa do poema ${poem.title}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-bold bg-white/95 backdrop-blur-md text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1">
                          🎨 Ilustração da Dupla
                        </span>
                      </div>

                      {/* Botão de Play circular verde */}
                      <button 
                        onClick={() => handlePlayPoem(poem)}
                        aria-label={isThisPlaying ? "Pausar" : "Tocar"}
                        className={`absolute bottom-3 right-3 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-all transform ${
                          isThisPlaying 
                            ? 'opacity-100 scale-100' 
                            : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'
                        }`}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current translate-x-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Título & Dupla de Alunos */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-display font-bold text-slate-900 tracking-tight line-clamp-1 group-hover:text-emerald-700 transition">
                          {poem.title}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          {poem.duration}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        <span className="text-slate-400">Dupla:</span> {poem.authors}
                      </p>
                    </div>

                    {/* As 3 Palavras Obrigatórias */}
                    <div className="mb-4">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        3 Palavras Sorteadas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {poem.mandatoryWords.map((word) => word && (
                          <button
                            key={word}
                            onClick={() => setSelectedWord(word)}
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                          >
                            #{word}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Player de Áudio e Botões */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 px-1">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isThisPlaying ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                          <span>Canção da Dupla</span>
                        </span>
                        <span className="text-[10px] text-slate-400">{poem.genre}</span>
                      </div>
                      <audio controls className="w-full h-8 rounded" src={poem.audioUrl} key={poem.audioUrl} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setModalPoem(poem)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs transition duration-200 flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ler Poema</span>
                      </button>

                      {poem.sunoUrl ? (
                        <a 
                          href={poem.sunoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-medium text-xs transition duration-200 flex items-center justify-center gap-1.5 border border-slate-300"
                        >
                          <Music className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ouvir Música</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ) : (
                        <button 
                          onClick={() => handlePlayPoem(poem)}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition duration-200 flex items-center justify-center gap-1.5 border ${
                            isThisPlaying
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isThisPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Pausar</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                              <span>Ouvir MP3</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                  </div>

                </article>
              );
            })}
          </div>

        </main>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: LOGIN INSTITUCIONAL DO PROFESSOR                      */}
      {/* ============================================================== */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <button 
                onClick={() => setShowLoginModal(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-xl font-display font-bold text-slate-900 mb-1">
              Acesso do Professor
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Área restrita aos professores da <strong>Escola Mario Pederneiras</strong> para edição de poemas e músicas da Turma 301.
            </p>

            {loginError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail Institucional (@professor.gaspar.sc.gov.br)
                </label>
                <input 
                  type="email" 
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu.nome@professor.gaspar.sc.gov.br" 
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Exemplo: <code className="text-emerald-700 font-semibold">willian.souza@professor.gaspar.sc.gov.br</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Senha de Acesso / Chave Pedagógica
                </label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Digite sua senha escolar..." 
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none transition"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
                >
                  Entrar no Painel do Professor
                </button>

                <button
                  type="button"
                  onClick={() => setLoginEmail('willian.souza@professor.gaspar.sc.gov.br')}
                  className="text-[11px] text-slate-500 hover:text-emerald-700 underline text-center pt-1"
                >
                  Preencher com meu e-mail (Willian Souza)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIÇÃO / CADASTRO DE POEMA                            */}
      {/* ============================================================== */}
      {showEditPoemModal && editingPoem && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowEditPoemModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Edição Pedagógica
                </span>
                <h3 className="text-xl font-display font-bold text-slate-900 mt-0.5">
                  {editingPoem.title ? `Editar: ${editingPoem.title}` : 'Nova Canção da Turma'}
                </h3>
              </div>
              <button 
                onClick={() => setShowEditPoemModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePoem} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Título do Poema</label>
                  <input 
                    type="text"
                    required
                    value={editingPoem.title}
                    onChange={(e) => setEditingPoem({ ...editingPoem, title: e.target.value })}
                    placeholder="Ex: O Voo da Borboleta Estelar"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dupla de Alunos (Autores)</label>
                  <input 
                    type="text"
                    required
                    value={editingPoem.authors}
                    onChange={(e) => setEditingPoem({ ...editingPoem, authors: e.target.value })}
                    placeholder="Ex: Ana Clara & Pedro Henrique"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* As 3 Palavras Obrigatórias */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  As 3 Palavras Obrigatórias Sorteadas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="text"
                    value={editingPoem.mandatoryWords[0] || ''}
                    onChange={(e) => {
                      const words: [string, string, string] = [
                        e.target.value,
                        editingPoem.mandatoryWords[1] || '',
                        editingPoem.mandatoryWords[2] || ''
                      ];
                      setEditingPoem({ ...editingPoem, mandatoryWords: words });
                    }}
                    placeholder="Palavra 1 (Ex: Borboleta)"
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  <input 
                    type="text"
                    value={editingPoem.mandatoryWords[1] || ''}
                    onChange={(e) => {
                      const words: [string, string, string] = [
                        editingPoem.mandatoryWords[0] || '',
                        e.target.value,
                        editingPoem.mandatoryWords[2] || ''
                      ];
                      setEditingPoem({ ...editingPoem, mandatoryWords: words });
                    }}
                    placeholder="Palavra 2 (Ex: Estrela)"
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  <input 
                    type="text"
                    value={editingPoem.mandatoryWords[2] || ''}
                    onChange={(e) => {
                      const words: [string, string, string] = [
                        editingPoem.mandatoryWords[0] || '',
                        editingPoem.mandatoryWords[1] || '',
                        e.target.value
                      ];
                      setEditingPoem({ ...editingPoem, mandatoryWords: words });
                    }}
                    placeholder="Palavra 3 (Ex: Amizade)"
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Ilustração e Estilo Musical */}
              <div className="space-y-4">
                {/* Ilustração de Capa */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>Ilustração da Dupla (Capa)</span>
                    </label>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('file')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          imageInputMode === 'file' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        Enviar Imagem
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          imageInputMode === 'url' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        Link URL
                      </button>
                    </div>
                  </div>

                  {imageInputMode === 'file' ? (
                    <div>
                      <input 
                        type="file" 
                        id="cover-file-input"
                        accept="image/*"
                        onChange={handleImageFileSelect}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        <img 
                          src={imagePreviewUrl || editingPoem.coverUrl} 
                          alt="Prévia da capa" 
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <label 
                            htmlFor="cover-file-input"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer transition shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{selectedImageFile ? 'Trocar Imagem' : 'Escolher Arquivo do Computador'}</span>
                          </label>
                          <p className="text-[10px] text-slate-400 mt-1 truncate">
                            {selectedImageFile ? selectedImageFile.name : (editingPoem.uploadedCoverName || 'PNG, JPG ou WEBP do computador')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <input 
                      type="text"
                      value={editingPoem.coverUrl}
                      onChange={(e) => {
                        setEditingPoem({ ...editingPoem, coverUrl: e.target.value, uploadedCoverName: undefined });
                        setImagePreviewUrl(e.target.value);
                      }}
                      placeholder="https://exemplo.com/desenho.jpg"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  )}
                </div>

                {/* Estilo / Ritmo Musical */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estilo / Ritmo Musical</label>
                  <input 
                    type="text"
                    value={editingPoem.genre}
                    onChange={(e) => setEditingPoem({ ...editingPoem, genre: e.target.value })}
                    placeholder="Ex: Bossa Nova Infantil, Pop Lúdico, Reggae Divertido"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* SEÇÃO PRINCIPAL: ÁUDIO MP3 DA MÚSICA */}
              <div className="bg-emerald-50/70 border-2 border-emerald-300/80 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-emerald-700" />
                      <span>Arquivo MP3 da Canção (Áudio Direto)</span>
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Insira o arquivo MP3 salvo no seu computador para tocar direto na página
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setAudioInputMode('file')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                        audioInputMode === 'file'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Arquivo do Computador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudioInputMode('url')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                        audioInputMode === 'url'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Link URL</span>
                    </button>
                  </div>
                </div>

                {audioInputMode === 'file' ? (
                  <div>
                    <input 
                      type="file" 
                      id="mp3-file-input"
                      accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/ogg,.mp3,.wav,.m4a,.ogg"
                      onChange={handleAudioFileSelect}
                      className="hidden"
                    />

                    {selectedAudioFile || editingPoem.uploadedAudioName || (audioPreviewUrl && !audioPreviewUrl.startsWith('http')) ? (
                      <div className="bg-white border-2 border-emerald-500 rounded-xl p-3 shadow-xs space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <FileAudio className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs truncate max-w-[240px]">
                                  {selectedAudioFile?.name || editingPoem.uploadedAudioName || 'Música Anexada'}
                                </span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3" /> MP3 Pronto
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {selectedAudioFile ? `${(selectedAudioFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Armazenado no navegador'}
                              </p>
                            </div>
                          </div>

                          <label 
                            htmlFor="mp3-file-input"
                            className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition shrink-0"
                          >
                            Trocar MP3
                          </label>
                        </div>

                        {/* Player de pré-escuta */}
                        {(audioPreviewUrl || editingPoem.audioUrl) && (
                          <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                              <span className="font-semibold text-emerald-800">Ouvir prévia do MP3 selecionado:</span>
                            </div>
                            <audio 
                              controls 
                              src={audioPreviewUrl || editingPoem.audioUrl} 
                              className="w-full h-8 rounded" 
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <label 
                        htmlFor="mp3-file-input"
                        className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-white/90 hover:bg-white rounded-xl p-6 cursor-pointer transition group shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center mb-2 transition">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 transition text-center">
                          Clique aqui para selecionar o arquivo MP3 no seu computador
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1 text-center">
                          Formatos aceitos: MP3, WAV, M4A ou OGG (toca direto na galeria)
                        </span>
                      </label>
                    )}
                  </div>
                ) : (
                  <div>
                    <input 
                      type="url"
                      value={editingPoem.audioUrl}
                      onChange={(e) => {
                        setEditingPoem({ ...editingPoem, audioUrl: e.target.value, uploadedAudioName: undefined });
                        setAudioPreviewUrl(e.target.value);
                      }}
                      placeholder="https://exemplo.com/musica.mp3"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                    {editingPoem.audioUrl && (
                      <audio controls src={editingPoem.audioUrl} className="w-full h-8 mt-2 rounded" />
                    )}
                  </div>
                )}
              </div>

              {/* Link Adicional Opcional */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Link Externo da Canção (Opcional)
                </label>
                <input 
                  type="text"
                  value={editingPoem.sunoUrl}
                  onChange={(e) => setEditingPoem({ ...editingPoem, sunoUrl: e.target.value })}
                  placeholder="https://suno.com/@turma301/musica (ou YouTube se houver)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Estrofes do Poema */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Estrofes do Poema (Separe estrofes com uma linha em branco)
                  </label>
                </div>
                <textarea 
                  rows={6}
                  value={editingPoem.stanzas.join('\n\n')}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsedStanzas = raw.split(/\n\s*\n/).filter(s => s.trim().length > 0);
                    setEditingPoem({ ...editingPoem, stanzas: parsedStanzas });
                  }}
                  placeholder="Escreva os versos aqui..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditPoemModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Música</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ALTERAR FOTO DA TURMA NO FUNDO                        */}
      {/* ============================================================== */}
      {showPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                Alterar Foto da Turma no Fundo
              </h3>
              <button onClick={() => setShowPhotoModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Envie a foto da turma diretamente do seu computador ou cole um link de imagem:
            </p>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 mb-3">
              <button
                type="button"
                onClick={() => setClassPhotoInputMode('file')}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                  classPhotoInputMode === 'file' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Arquivo do Computador</span>
              </button>
              <button
                type="button"
                onClick={() => setClassPhotoInputMode('url')}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                  classPhotoInputMode === 'url' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Link URL</span>
              </button>
            </div>

            {classPhotoInputMode === 'file' ? (
              <div className="mb-4">
                <input 
                  type="file" 
                  id="class-photo-file-input"
                  accept="image/*"
                  onChange={handleClassPhotoFileSelect}
                  className="hidden"
                />
                <label 
                  htmlFor="class-photo-file-input"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-4 cursor-pointer transition text-center"
                >
                  <Camera className="w-6 h-6 text-emerald-600 mb-1" />
                  <span className="font-bold text-xs text-slate-800">
                    {selectedClassPhotoFile ? selectedClassPhotoFile.name : 'Selecionar foto da turma no computador'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    JPG, PNG ou WEBP (salvo com segurança no navegador)
                  </span>
                </label>
                {(classPhotoPreviewUrl || classPhotoUrl) && (
                  <div className="mt-2.5 rounded-xl overflow-hidden aspect-[16/9] border border-slate-200 shadow-xs">
                    <img 
                      src={classPhotoPreviewUrl || classPhotoUrl} 
                      alt="Prévia da turma" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <input 
                  type="text" 
                  value={classPhotoUrl}
                  onChange={(e) => setClassPhotoUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto-da-turma.jpg"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 mb-2"
                />
                {classPhotoUrl && (
                  <div className="rounded-xl overflow-hidden aspect-[16/9] border border-slate-200 shadow-xs">
                    <img src={classPhotoUrl} alt="Prévia" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => {
                  setClassPhotoUrl(DEFAULT_CLASS_PHOTO);
                  setSelectedClassPhotoFile(null);
                  setClassPhotoPreviewUrl(null);
                  showToast('Foto padrão restaurada.');
                  setShowPhotoModal(false);
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Restaurar Padrão
              </button>
              <button 
                onClick={handleSaveClassPhotoModal}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Concluir e Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: LEITURA COMPLETA DO POEMA (MODAL DO ALUNO)            */}
      {/* ============================================================== */}
      {modalPoem && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalPoem(null)}
        >
          <div 
            className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-start justify-between">
              <div className="flex gap-4 items-center">
                <img 
                  src={modalPoem.coverUrl} 
                  alt={modalPoem.title} 
                  className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-200"
                />
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                    Letra do Poema
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mt-0.5">
                    {modalPoem.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    <strong className="text-slate-700 font-semibold">Dupla:</strong> {modalPoem.authors}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setModalPoem(null)} 
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-sm transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  3 Palavras Obrigatórias:
                </span>
                <div className="flex flex-wrap gap-2">
                  {modalPoem.mandatoryWords.map((word) => word && (
                    <span key={word} className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      #{word}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="space-y-6 text-base sm:text-lg text-slate-800 leading-relaxed font-sans italic">
                  {modalPoem.stanzas.map((stanza, sIdx) => (
                    <div 
                      key={sIdx} 
                      className="border-l-3 border-emerald-500 pl-4 py-1 whitespace-pre-line"
                    >
                      {stanza}
                    </div>
                  ))}
                </div>
              </div>

              {/* Player no Modal */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
                <button 
                  onClick={() => handlePlayPoem(modalPoem)}
                  className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm"
                >
                  {currentPoem?.id === modalPoem.id && isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Ouvir Canção</span>
                    <span className="text-[10px] text-slate-500 font-normal">{modalPoem.genre}</span>
                  </div>
                  <audio controls className="w-full h-8 rounded" src={modalPoem.audioUrl} />
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {modalPoem.sunoUrl ? (
                <a 
                  href={modalPoem.sunoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ouvir Versão Completa ↗</span>
                </a>
              ) : (
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <FileAudio className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{modalPoem.uploadedAudioName ? `Arquivo: ${modalPoem.uploadedAudioName}` : 'Canção da Turma 301'}</span>
                </span>
              )}
              <button 
                onClick={() => setModalPoem(null)} 
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 transition"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. PLAYER BAR INFERIOR (TEMA CLARO ELEGANTE)                   */}
      {/* ============================================================== */}
      {currentPoem && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
              <img 
                src={currentPoem.coverUrl} 
                alt={currentPoem.title} 
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0 cursor-pointer"
                onClick={() => setModalPoem(currentPoem)}
              />
              <div className="overflow-hidden">
                <h4 
                  onClick={() => setModalPoem(currentPoem)}
                  className="text-xs font-bold text-slate-900 truncate hover:text-emerald-700 cursor-pointer"
                >
                  {currentPoem.title}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentPoem.authors}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handlePrevTrack} 
                  className="text-slate-500 hover:text-slate-800 transition"
                  aria-label="Faixa anterior"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => handlePlayPoem(currentPoem)}
                  className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition"
                  aria-label={isPlaying ? "Pausar" : "Tocar"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  )}
                </button>

                <button 
                  onClick={handleNextTrack} 
                  className="text-slate-500 hover:text-slate-800 transition"
                  aria-label="Próxima faixa"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 w-full text-[10px] text-slate-500 font-mono">
                <span>{formatTime(currentTime)}</span>
                <input 
                  type="range"
                  min="0"
                  max={duration || 120}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-slate-200 accent-emerald-600 rounded-lg appearance-none cursor-pointer"
                />
                <span>{formatTime(duration || 120)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 w-1/4 min-w-[150px]">
              <button 
                onClick={() => setModalPoem(currentPoem)}
                className="text-xs text-slate-700 hover:text-emerald-700 font-semibold hidden md:inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ler Poema</span>
              </button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-slate-500 hover:text-slate-800">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-slate-200 accent-emerald-600 rounded-lg appearance-none cursor-pointer hidden sm:block"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* RODAPÉ COM ACESSO DISCRETO DO PROFESSOR                        */}
      {/* ============================================================== */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="font-semibold text-slate-800">Escola Mario Pederneiras</span>
            <span className="text-slate-400">·</span>
            <span>Turma 301 (3º Ano EF)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Mural de Poesias e Canções</span>

            <span>·</span>

            {/* Acesso discreto no rodapé (para não atrair usuários maliciosos) */}
            {teacherEmail ? (
              <div className="flex items-center gap-2 text-emerald-700">
                <span>Docente conectado</span>
                <span>·</span>
                <button 
                  onClick={handleLogout} 
                  className="text-slate-400 hover:text-red-600 underline transition"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-slate-400/80 hover:text-slate-600 transition text-[11px] hover:underline"
              >
                Acesso do professor
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}
