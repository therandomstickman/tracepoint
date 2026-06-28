import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Image as ImageIcon,
  MapPin,
  Eye,
  FileText,
  CheckCircle2,
  History,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Share2,
  Compass,
  Layers,
  Globe,
  Clock,
  Camera,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Loader2,
  Sparkles,
  CreditCard,
  Lock,
  Unlock,
  ShieldCheck
} from "lucide-react";
import MapComponent from "./components/MapComponent";
import { AnalysisResult } from "./types";
import { sampleAnalyses } from "./samples";

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [activeReport, setActiveReport] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"clues" | "ocr" | "exif">("clues");
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Premium / Billing states
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("tracepoint_premium") === "true";
  });
  const [scansRemaining, setScansRemaining] = useState<number>(() => {
    const remaining = localStorage.getItem("tracepoint_scans_remaining");
    return remaining !== null ? parseInt(remaining, 10) : 5;
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"plans" | "checkout" | "processing" | "success">("plans");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading animation stages
  const loadingStages = [
    "READING RAW EXIF METADATA AND COORDINATE GEOMETRY...",
    "SCANNING IMAGE BUFFERS FOR HIGH-RESOLUTION OCR SIGNAGE...",
    "EXTRACTING LOCAL ARCHITECTURAL AND REGIONAL INFRASTRUCTURE MARKERS...",
    "EVALUATING NATIVE BIOME VEGETATION AND CLIMATE BIOMETRICS...",
    "SYNTHESIZING DEDUCTIVE EVIDENCE AND CONFIDENCE PARAMETERS..."
  ];

  // Rotate through loading stages when analyzing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage((prev) => (prev < loadingStages.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load history and reset daily scans from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tracepoint_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load search history", e);
      }
    }

    const today = new Date().toDateString();
    const savedDate = localStorage.getItem("tracepoint_last_scan_date");
    
    if (savedDate !== today) {
      localStorage.setItem("tracepoint_last_scan_date", today);
      localStorage.setItem("tracepoint_scans_remaining", "5");
      setScansRemaining(5);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum image size is 20 MB.");
      return;
    }

    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setActiveReport(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Run live analysis via server API
  const runAnalysis = async () => {
    if (!selectedImage || !selectedFile) return;

    if (!isPremium && scansRemaining <= 0) {
      setIsPaymentModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: selectedImage,
          mimeType: selectedFile.type,
          imageName: selectedFile.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setActiveReport(data);

      // Decrement remaining scans if not premium
      if (!isPremium) {
        const nextRemaining = Math.max(0, scansRemaining - 1);
        setScansRemaining(nextRemaining);
        localStorage.setItem("tracepoint_scans_remaining", String(nextRemaining));
      }

      // Save to history
      const updatedHistory = [data, ...history.filter((item) => item.id !== data.id)];
      setHistory(updatedHistory);
      localStorage.setItem("tracepoint_history", JSON.stringify(updatedHistory));
    } catch (err: any) {
      console.error("Analysis failed", err);
      setError(err.message || "Something went wrong during image analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // View a sample report immediately
  const loadSample = (sample: AnalysisResult) => {
    setError(null);
    setSelectedImage(null);
    setSelectedFile(null);
    setActiveReport(sample);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setActiveReport(null);
    setError(null);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("tracepoint_history", JSON.stringify(updated));

    if (activeReport && activeReport.id === id) {
      handleReset();
    }
  };

  const handleCancelSubscription = () => {
    setIsPremium(false);
    localStorage.setItem("tracepoint_premium", "false");
    localStorage.setItem("tracepoint_scans_remaining", "5");
    setScansRemaining(5);
    setPaymentStep("plans");
  };

  const handleStartCheckout = () => {
    setPaymentError(null);
    setPaymentStep("checkout");
  };

  const handleSimulatePayment = () => {
    if (!cardNumber.replace(/\s/g, "") || cardNumber.replace(/\s/g, "").length < 16) {
      setPaymentError("Invalid card details. Number must be 16 digits.");
      return;
    }
    if (!cardName) {
      setPaymentError("Cardholder name is required.");
      return;
    }
    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setPaymentError("Expiry must be in MM/YY format.");
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      setPaymentError("CVV is invalid.");
      return;
    }

    setPaymentError(null);
    setPaymentStep("processing");
    
    // Simulate multi-stage visual loader
    const stages = [
      "ESTABLISHING 256-BIT ENCRYPTED TUNNEL...",
      "AUTHORIZING CREDIT LEDGER TRANSACTIONS...",
      "PROVISIONING DUAL-METADATA DECRYPTION STREAM...",
      "SUBSCRIPTION COMMITTED SUCCESSFULLY."
    ];

    let currentStage = 0;
    setProcessingStatus(stages[0]);

    const interval = setInterval(() => {
      currentStage++;
      if (currentStage < stages.length) {
        setProcessingStatus(stages[currentStage]);
      } else {
        clearInterval(interval);
        setIsPremium(true);
        localStorage.setItem("tracepoint_premium", "true");
        setPaymentStep("success");
      }
    }, 1500);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const shareReport = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  return (
    <div id="tracepoint-root" className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0] font-sans flex flex-col selection:bg-[#D1FF00] selection:text-black">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0F0F0F] border-b border-[#1A1A1A] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 border border-[#333] bg-[#141414] flex items-center justify-center text-[#D1FF00] shadow-sm relative group">
              <Compass className="w-5 h-5 animate-spin-slow group-hover:text-white transition-colors" />
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#D1FF00]" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-[0.4em] text-[#D1FF00] font-mono leading-none block">TracePoint</span>
              <span className="text-xl font-serif italic font-light tracking-tight text-white">Forensic Geolocation</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isPremium ? (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 border border-[#D1FF00]/40 bg-[#D1FF00]/5 text-[#D1FF00] hover:text-white hover:border-[#D1FF00]/80 text-[10px] font-mono uppercase tracking-[0.15em] transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D1FF00] animate-pulse" />
                <span>Premium Member</span>
              </button>
            ) : (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 border border-[#1A1A1A] hover:border-[#D1FF00]/40 bg-[#0A0A0A] hover:bg-[#D1FF00]/5 text-slate-400 hover:text-[#D1FF00] text-[10px] font-mono uppercase tracking-[0.15em] transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Free Tier: {scansRemaining}/5 Scans</span>
                <span className="text-[#D1FF00] font-black ml-1">Upgrade</span>
              </button>
            )}

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2 border border-[#1A1A1A] hover:border-[#333] text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-[#D1FF00] transition-all cursor-pointer bg-[#0A0A0A]"
            >
              <History className="w-3.5 h-3.5" />
              <span>Log</span>
              {history.length > 0 && (
                <span className="bg-[#D1FF00] text-black text-[10px] px-2 py-0.5 font-black font-mono">
                  {history.length}
                </span>
              )}
            </button>
            {(selectedImage || activeReport) && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#D1FF00] hover:bg-white text-black text-xs font-mono uppercase tracking-widest font-black transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Engine</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          
          {/* STATE 1: Landing Workspace */}
          {!isLoading && !activeReport && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16"
            >
              
              {/* Editorial Hero Area */}
              <div className="text-center max-w-3xl mx-auto space-y-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#1A1A1A] text-[10px] font-mono uppercase tracking-[0.2em] text-[#D1FF00]">
                  <span className="w-1.5 h-1.5 bg-[#D1FF00] animate-pulse"></span>
                  Tactical Image Geolocation MVP
                </span>
                <h1 className="text-5xl sm:text-7xl font-serif italic font-light tracking-tight text-white leading-tight">
                  Where was this taken?
                </h1>
                <p className="text-sm font-mono text-slate-400 tracking-wide uppercase leading-relaxed max-w-2xl mx-auto">
                  TracePoint parses photographic assets through specialized OCR pipelines, climate analysis, EXIF forensics, and multimodal neural layers to construct evidence-backed estimates.
                </p>
              </div>

              {/* Forensic Upload Box */}
              <div className="max-w-2xl mx-auto">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={!selectedImage ? triggerFileInput : undefined}
                  className={`relative border border-[#1A1A1A] p-10 text-center transition-all bg-[#0F0F0F] cursor-pointer ${
                    isDragging
                      ? "border-[#D1FF00] bg-[#141414]"
                      : selectedImage
                      ? "border-[#333]"
                      : "hover:border-[#333] hover:bg-[#141414]"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Geometric Corner Accents */}
                  <div className="absolute top-0 left-0 w-6 h-1 bg-[#1A1A1A]"></div>
                  <div className="absolute top-0 left-0 w-1 h-6 bg-[#1A1A1A]"></div>
                  <div className="absolute top-0 right-0 w-6 h-1 bg-[#1A1A1A]"></div>
                  <div className="absolute top-0 right-0 w-1 h-6 bg-[#1A1A1A]"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-1 bg-[#1A1A1A]"></div>
                  <div className="absolute bottom-0 left-0 w-1 h-6 bg-[#1A1A1A]"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-1 bg-[#1A1A1A]"></div>
                  <div className="absolute bottom-0 right-0 w-1 h-6 bg-[#1A1A1A]"></div>

                  {!selectedImage ? (
                    <div className="space-y-6 py-8">
                      <div className="w-16 h-16 mx-auto bg-[#141414] border border-[#1A1A1A] flex items-center justify-center text-slate-400">
                        <Upload className="w-6 h-6 text-[#D1FF00]" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-serif italic text-white font-light">
                          Drag file here or <span className="text-[#D1FF00] underline underline-offset-4 font-mono uppercase text-xs tracking-widest font-black decoration-1">browse</span>
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                          JPEG, PNG, WebP up to 20MB / EXIF tags will be decrypted
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="relative inline-block border border-[#333] p-1 bg-[#141414]">
                        {/* Target Grid */}
                        <div className="absolute w-8 h-8 border-t-2 border-l-2 border-[#D1FF00] top-4 left-4 z-10 opacity-60"></div>
                        <div className="absolute w-8 h-8 border-b-2 border-r-2 border-[#D1FF00] bottom-4 right-4 z-10 opacity-60"></div>
                        
                        <img
                          src={selectedImage}
                          alt="Forensic capture"
                          className="max-h-84 max-w-full object-contain mx-auto grayscale"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                          }}
                          className="absolute -top-3 -right-3 p-1.5 bg-[#0A0A0A] border border-[#333] text-white hover:text-[#D1FF00] transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col items-center justify-center space-y-4">
                        {!isPremium && scansRemaining <= 0 ? (
                          <div className="text-center p-6 border border-[#D1FF00]/30 bg-[#0E0E0E] max-w-md space-y-4">
                            <span className="text-[10px] font-mono text-[#D1FF00] tracking-widest block uppercase font-bold">
                              [ FREE DAILY QUOTA EXHAUSTED ]
                            </span>
                            <p className="text-xs font-serif italic text-slate-400 leading-relaxed">
                              You have reached the maximum limit of 5 free geolocations per day. Upgrade to Premium for unlimited scans, faster processing, and 150+ extended metadata tags.
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-8 py-3 bg-[#D1FF00] hover:bg-white text-black text-xs font-mono uppercase tracking-widest font-black transition-all cursor-pointer shadow-md shadow-[#D1FF00]/10"
                            >
                              Unlock Unlimited — $20/mo
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={runAnalysis}
                            className="px-10 py-4 bg-[#D1FF00] hover:bg-white text-black font-mono uppercase tracking-[0.2em] font-black text-xs transition-all flex items-center gap-3 cursor-pointer shadow-lg shadow-[#D1FF00]/5"
                          >
                            <Compass className="w-4 h-4 animate-spin-slow" />
                            <span>Initiate Analysis Sequence</span>
                          </button>
                        )}
                        {!isPremium && scansRemaining > 0 && (
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            Free account: {scansRemaining} of 5 daily scans remaining
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 p-4 bg-[#0F0F0F] border border-rose-900/50 text-rose-200 flex items-start gap-3 text-xs font-mono uppercase tracking-wider"
                  >
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </div>

              {/* Interactive Sample Dossiers */}
              <div className="space-y-8 pt-10 border-t border-[#1A1A1A]">
                <div className="text-center">
                  <h2 className="text-[10px] uppercase tracking-[0.4em] text-[#D1FF00] font-mono">
                    Select Photographic Specimen File
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {sampleAnalyses.map((sample) => (
                    <div
                      key={sample.id}
                      onClick={() => loadSample(sample)}
                      className="group bg-[#0F0F0F] border border-[#1A1A1A] p-6 hover:border-[#D1FF00] transition-all duration-300 cursor-pointer relative flex flex-col justify-between min-h-80"
                    >
                      {/* Corner decoration */}
                      <div className="absolute top-0 right-0 w-2 h-2 bg-[#1A1A1A] group-hover:bg-[#D1FF00]" />

                      <div className="space-y-4">
                        <div className="h-44 bg-[#141414] border border-[#1A1A1A] flex flex-col items-center justify-center relative p-5 text-center group-hover:border-[#333]">
                          {/* Simulated crosshair lines */}
                          <div className="absolute inset-x-4 top-1/2 h-[1px] bg-white/5" />
                          <div className="absolute inset-y-4 left-1/2 w-[1px] bg-white/5" />
                          
                          {sample.id === "sample_japan" && (
                            <>
                              <span className="text-3xl opacity-50 mb-2">🏮</span>
                              <span className="text-base font-serif italic text-white tracking-tight">Osaka Prefecture</span>
                              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">SPECIMEN JP-04</span>
                            </>
                          )}
                          {sample.id === "sample_france" && (
                            <>
                              <span className="text-3xl opacity-50 mb-2">🥐</span>
                              <span className="text-base font-serif italic text-white tracking-tight">Parisian Boulevard</span>
                              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">SPECIMEN FR-01</span>
                            </>
                          )}
                          {sample.id === "sample_iceland" && (
                            <>
                              <span className="text-3xl opacity-50 mb-2">🌋</span>
                              <span className="text-base font-serif italic text-white tracking-tight">Reykjavík Coast</span>
                              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">SPECIMEN IS-09</span>
                            </>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-1.5">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {sample.location.city}, {sample.location.country}
                            </span>
                            <span className="text-[10px] font-mono text-[#D1FF00]">
                              {sample.location.confidence}% CONF
                            </span>
                          </div>
                          <p className="text-xs font-serif italic text-slate-400 line-clamp-2">
                            {sample.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Grid / Tactical Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto pt-12 border-t border-[#1A1A1A]">
                <div className="space-y-3">
                  <div className="w-8 h-8 bg-[#141414] border border-[#1A1A1A] flex items-center justify-center text-[#D1FF00]">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs uppercase tracking-widest font-mono text-white">01 / Metadata Decryption</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-serif italic">
                    Extracts raw focal length, device parameters, lens apertures, and native GPS coordinates directly from visual headers.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="w-8 h-8 bg-[#141414] border border-[#1A1A1A] flex items-center justify-center text-[#D1FF00]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs uppercase tracking-widest font-mono text-white">02 / Signage OCR Reader</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-serif italic">
                    Scrapes regional text, street boards, commercial labels, licenses, and advertisements into legible unicode strings.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="w-8 h-8 bg-[#141414] border border-[#1A1A1A] flex items-center justify-center text-[#D1FF00]">
                    <Eye className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs uppercase tracking-widest font-mono text-white">03 / Environmental Heuristics</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-serif italic">
                    Assesses high-voltage steel layouts, road line color codes, vegetation varieties, topography, and clothing.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="w-8 h-8 bg-[#141414] border border-[#1A1A1A] flex items-center justify-center text-[#D1FF00]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs uppercase tracking-widest font-mono text-white">04 / Spatial Plotting</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-serif italic">
                    Generates precise uncertainty circles on high-contrast cartography to outline coordinates and evidence bounds.
                  </p>
                </div>
              </div>

            </motion.div>
          )}

          {/* STATE 2: Processing Scanner */}
          {isLoading && (
            <motion.div
              key="loading-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-10 max-w-md mx-auto text-center"
            >
              <div className="relative w-64 h-64 border border-[#333] bg-[#0F0F0F] p-1 flex items-center justify-center">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Scanning"
                    className="w-full h-full object-cover opacity-40 grayscale"
                  />
                )}
                {/* Tactical scanner overlays */}
                <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]/30">
                  <div className="w-48 h-48 border border-dashed border-[#D1FF00]/40 rounded-full animate-spin flex items-center justify-center">
                    <Compass className="w-10 h-10 text-[#D1FF00]" />
                  </div>
                </div>
                {/* Horizontal radar line */}
                <div className="absolute left-0 w-full h-1 bg-[#D1FF00] shadow-[0_0_15px_#D1FF00] animate-scan z-20"></div>
                
                {/* Sharp Corner Highlights */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#D1FF00]"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#D1FF00]"></div>
              </div>

              <div className="space-y-4 w-full">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#D1FF00] bg-[#141414] px-4 py-2 border border-[#1A1A1A] inline-block animate-pulse">
                  SCANNING ATOMIC STRUCTS...
                </span>
                
                <h2 className="text-2xl font-serif italic text-white tracking-tight">
                  Running Investigation Protocol
                </h2>
                
                <div className="h-14 flex items-center justify-center px-4">
                  <p className="text-[11px] font-mono text-slate-400 tracking-wider uppercase leading-relaxed">
                    {loadingStages[loadingStage]}
                  </p>
                </div>

                {/* Progress dot indicators */}
                <div className="flex justify-center gap-2 pt-4">
                  {loadingStages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 transition-all duration-300 ${
                        idx === loadingStage ? "w-8 bg-[#D1FF00]" : "w-1.5 bg-[#1A1A1A]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 3: Forensic Dossier Report */}
          {!isLoading && activeReport && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              
              {/* Report Header Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0F0F0F] p-6 border border-[#1A1A1A] relative">
                {/* Corner indicator */}
                <div className="absolute top-0 left-0 w-2 h-2 bg-[#D1FF00]" />

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleReset}
                    className="p-2.5 bg-[#141414] hover:bg-black border border-[#1A1A1A] text-slate-400 hover:text-[#D1FF00] transition-colors cursor-pointer"
                    title="Load new specimen file"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-[#D1FF00] font-mono leading-none">
                      INVESTIGATION DOSSIER
                    </h2>
                    <span className="text-xs text-slate-400 font-mono mt-2 block">
                      CASE NO: {activeReport.id.toUpperCase()} • DEPLOYED: {new Date(activeReport.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={shareReport}
                    className="relative flex items-center gap-2 px-4 py-2.5 bg-[#141414] hover:bg-black border border-[#1A1A1A] hover:border-[#333] text-slate-300 text-xs font-mono uppercase tracking-widest transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                    {showShareTooltip && (
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#D1FF00] text-black text-[9px] font-mono uppercase tracking-wider font-bold px-3 py-1 shadow-md">
                        Link copied!
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#D1FF00] hover:bg-white text-black text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    <span>Inspect Another File</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Two-Column Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* Left Column: Visual Data Layers */}
                <div className="lg:col-span-5 space-y-10">
                  
                  {/* Photo Display Card */}
                  <div className="bg-[#0F0F0F] border border-[#1A1A1A] overflow-hidden relative">
                    <div className="p-4 border-b border-[#1A1A1A] flex items-center justify-between bg-[#141414]">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#D1FF00] flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Photographic Asset
                      </h3>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest max-w-[180px] truncate">
                        {activeReport.imageName}
                      </span>
                    </div>
                    
                    <div className="bg-[#0A0A0A] p-4 flex items-center justify-center min-h-64 max-h-120 border-b border-[#1A1A1A]">
                      {selectedImage ? (
                        <div className="relative inline-block border border-[#1A1A1A] p-1 bg-[#141414]">
                          {/* Targeting box lines */}
                          <div className="absolute w-6 h-6 border-t border-l border-[#D1FF00] top-2 left-2 z-10 opacity-70"></div>
                          <div className="absolute w-6 h-6 border-b border-r border-[#D1FF00] bottom-2 right-2 z-10 opacity-70"></div>
                          <img
                            src={selectedImage}
                            alt="Specimen forensic view"
                            className="max-h-96 object-contain grayscale hover:grayscale-0 transition-all duration-500"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-20 text-slate-500">
                          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-20 text-[#D1FF00]" />
                          <p className="text-[10px] font-mono uppercase tracking-widest">Specimen Image Stripped (Sample Mode)</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 bg-[#0F0F0F] text-[9px] font-mono text-slate-500 uppercase tracking-widest flex justify-between">
                      <span>Forensic Specimen Analyser</span>
                      <span>RESOLUTION: OPTIMAL</span>
                    </div>
                  </div>

                  {/* High-Contrast Interactive Map */}
                  <div className="bg-[#0F0F0F] border border-[#1A1A1A] h-104 flex flex-col relative">
                    <div className="p-4 border-b border-[#1A1A1A] flex items-center justify-between bg-[#141414]">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#D1FF00] flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        Spatial Plot Preview
                      </h3>
                      {activeReport.exif?.gps ? (
                        <span className="bg-[#1A1A1A] text-[#D1FF00] border border-[#333] text-[9px] font-mono px-2 py-0.5 uppercase tracking-widest">
                          RAW GPS
                        </span>
                      ) : (
                        <span className="bg-[#141414] text-slate-400 border border-[#1A1A1A] text-[9px] font-mono px-2 py-0.5 uppercase tracking-widest">
                          AI SCAN
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 w-full relative">
                      <MapComponent
                        latitude={activeReport.coordinates.latitude}
                        longitude={activeReport.coordinates.longitude}
                        uncertaintyRadius={activeReport.coordinates.uncertaintyRadiusMeters}
                      />
                    </div>
                  </div>

                </div>

                {/* Right Column: Textual Forensic Dossier */}
                <div className="lg:col-span-7 space-y-10">
                  
                  {/* Primary Location Conclusions */}
                  <div className="bg-[#0F0F0F] border border-[#1A1A1A] p-8 space-y-8 relative">
                    {/* Visual corner decoration */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#333]" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#1A1A1A]">
                      <div className="space-y-3">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-[#D1FF00] font-mono">
                          Estimated Coordinates Origin
                        </span>
                        <h1 className="text-4xl sm:text-6xl font-serif italic text-white leading-none tracking-tight">
                          {activeReport.location.country}
                        </h1>
                        <p className="text-sm font-mono text-slate-400 uppercase tracking-widest">
                          {activeReport.location.city && `${activeReport.location.city} • `}
                          {activeReport.location.region}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <div className="px-6 py-4 border border-[#1A1A1A] bg-[#0A0A0A] text-center relative">
                          <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#D1FF00]" />
                          <span className="text-4xl font-mono text-white block leading-none font-bold">
                            {activeReport.location.confidence}%
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-slate-500 block mt-2">
                            CONFIDENCE
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Report Summary */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono">INVESTIGATOR ANALYSIS SUMMARY</h4>
                      <p className="text-base font-serif italic text-slate-300 leading-relaxed font-light">
                        "{activeReport.summary}"
                      </p>
                    </div>
                  </div>

                  {/* Supporting Evidence Panel */}
                  <div className="bg-[#0F0F0F] border border-[#1A1A1A] p-8 space-y-6 relative">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#D1FF00] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D1FF00]" />
                      Corroborating Evidence Logs
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeReport.evidence.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#1A1A1A] text-xs"
                        >
                          <span className="text-[#D1FF00] font-mono font-black">✓</span>
                          <span className="font-mono text-slate-300 uppercase tracking-wide leading-relaxed">
                            {item.replace(/^✓\s*/, "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabbed Forensic Data Layers */}
                  <div className="bg-[#0F0F0F] border border-[#1A1A1A]">
                    <div className="flex border-b border-[#1A1A1A] bg-[#141414]">
                      <button
                        onClick={() => setActiveTab("clues")}
                        className={`flex-1 py-4 px-6 text-[10px] font-mono uppercase tracking-widest border-b transition-all cursor-pointer ${
                          activeTab === "clues"
                            ? "border-[#D1FF00] text-[#D1FF00] bg-[#0F0F0F]"
                            : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Visual Markers
                      </button>
                      <button
                        onClick={() => setActiveTab("ocr")}
                        className={`flex-1 py-4 px-6 text-[10px] font-mono uppercase tracking-widest border-b transition-all cursor-pointer ${
                          activeTab === "ocr"
                            ? "border-[#D1FF00] text-[#D1FF00] bg-[#0F0F0F]"
                            : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Extracted OCR ({activeReport.ocrText.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("exif")}
                        className={`flex-1 py-4 px-6 text-[10px] font-mono uppercase tracking-widest border-b transition-all cursor-pointer ${
                          activeTab === "exif"
                            ? "border-[#D1FF00] text-[#D1FF00] bg-[#0F0F0F]"
                            : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Raw EXIF Metadata
                      </button>
                    </div>

                    <div className="p-8">
                      
                      {/* Tab 1: Visual Markers */}
                      {activeTab === "clues" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(activeReport.visualClues).map(([key, value]) => {
                            if (!value) return null;
                            const label = key.replace(/([A-Z])/g, " $1");
                            return (
                              <div
                                key={key}
                                className="pb-4 border-b border-[#1A1A1A] space-y-2 flex flex-col justify-between"
                              >
                                <span className="text-[9px] uppercase font-mono text-[#D1FF00] tracking-widest">
                                  {label}
                                </span>
                                <p className="text-xs font-serif italic text-slate-300 leading-relaxed">
                                  {value}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Tab 2: OCR */}
                      {activeTab === "ocr" && (
                        <div className="space-y-4">
                          {activeReport.ocrText.length > 0 ? (
                            <div className="flex flex-wrap gap-2.5">
                              {activeReport.ocrText.map((text, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-1.5 bg-[#141414] border border-[#333] text-[10px] font-mono text-white tracking-wider uppercase flex items-center gap-2"
                                >
                                  <div className="w-1 h-1 bg-[#D1FF00]" />
                                  <span>{text}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-slate-500 space-y-3 bg-[#0A0A0A] border border-[#1A1A1A]">
                              <FileText className="w-8 h-8 mx-auto opacity-20 text-[#D1FF00]" />
                              <p className="text-xs font-mono uppercase tracking-widest">Zero Readable Signage Found</p>
                              <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Image parsing layers could not capture high-contrast lettering, billboard vectors, license plates, or geographic directions.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 3: EXIF */}
                      {activeTab === "exif" && (
                        <div className="space-y-4">
                          {activeReport.exif ? (
                            <div className="border border-[#1A1A1A] overflow-hidden bg-[#0A0A0A]">
                              <table className="w-full text-left text-[11px] border-collapse font-mono">
                                <thead>
                                  <tr className="bg-[#141414] border-b border-[#1A1A1A]">
                                    <th className="p-4 font-mono uppercase tracking-wider text-slate-400">Parameter</th>
                                    <th className="p-4 font-mono uppercase tracking-wider text-slate-400">Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1A1A1A] text-slate-300">
                                  {activeReport.exif.cameraModel && (
                                    <tr>
                                      <td className="p-4 uppercase tracking-widest text-slate-500">Camera Model</td>
                                      <td className="p-4 text-white uppercase">{activeReport.exif.cameraModel}</td>
                                    </tr>
                                  )}
                                  {activeReport.exif.timestamp && (
                                    <tr>
                                      <td className="p-4 uppercase tracking-widest text-slate-500">Timestamp</td>
                                      <td className="p-4 text-[#D1FF00]">{activeReport.exif.timestamp}</td>
                                    </tr>
                                  )}
                                  {activeReport.exif.orientation && (
                                    <tr>
                                      <td className="p-4 uppercase tracking-widest text-slate-500">Orientation</td>
                                      <td className="p-4 text-white uppercase">{activeReport.exif.orientation}</td>
                                    </tr>
                                  )}
                                  {activeReport.exif.software && (
                                    <tr>
                                      <td className="p-4 uppercase tracking-widest text-slate-500">Software</td>
                                      <td className="p-4 text-white uppercase">{activeReport.exif.software}</td>
                                    </tr>
                                  )}
                                  {activeReport.exif.gps && (
                                    <>
                                      <tr>
                                        <td className="p-4 uppercase tracking-widest text-slate-500">Latitude</td>
                                        <td className="p-4 text-[#D1FF00]">{activeReport.exif.gps.latitude?.toFixed(6)}° N</td>
                                      </tr>
                                      <tr>
                                        <td className="p-4 uppercase tracking-widest text-slate-500">Longitude</td>
                                        <td className="p-4 text-[#D1FF00]">{activeReport.exif.gps.longitude?.toFixed(6)}° E</td>
                                      </tr>
                                      {activeReport.exif.gps.altitude !== undefined && (
                                        <tr>
                                          <td className="p-4 uppercase tracking-widest text-slate-500">Altitude</td>
                                          <td className="p-4 text-white">{activeReport.exif.gps.altitude.toFixed(1)}M</td>
                                        </tr>
                                      )}
                                    </>
                                  )}
                                  {isPremium && activeReport.exif.additionalTags && Object.entries(activeReport.exif.additionalTags).map(([key, val]) => (
                                    <tr key={key} className="border-t border-[#1A1A1A] bg-[#0E0E0E]/50">
                                      <td className="p-4 uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                                        <Sparkles className="w-2.5 h-2.5 text-[#D1FF00] shrink-0" />
                                        {key.replace(/([A-Z])/g, " $1")}
                                      </td>
                                      <td className="p-4 text-[#D1FF00] font-bold uppercase">{val}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              {!isPremium && activeReport.exif.additionalTags && (
                                <div className="border-t border-[#1A1A1A] bg-[#0C0C0C] p-8 text-center space-y-4 relative overflow-hidden">
                                  {/* Blurred background preview of rows to entice user */}
                                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none filter blur-[1px] flex flex-col justify-around p-6 text-[9px] font-mono">
                                    <div className="flex justify-between border-b border-[#333] pb-1"><span>Lens Model</span><span>FE 24-105mm F4 G OSS</span></div>
                                    <div className="flex justify-between border-b border-[#333] pb-1"><span>Exposure Time</span><span>1/800 sec</span></div>
                                    <div className="flex justify-between border-b border-[#333] pb-1"><span>ISO Rating</span><span>100</span></div>
                                    <div className="flex justify-between border-b border-[#333] pb-1"><span>Metering Mode</span><span>Pattern</span></div>
                                  </div>
                                  
                                  <div className="relative z-10 py-2 max-w-md mx-auto space-y-4">
                                    <div className="w-10 h-10 mx-auto bg-[#141414] border border-[#1A1A1A] flex items-center justify-center text-[#D1FF00]">
                                      <Lock className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF00] font-mono font-bold">
                                        Decrypt Extended EXIF Payload
                                      </h4>
                                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                                        Status: {Object.keys(activeReport.exif.additionalTags).length} Hex Headers Locked
                                      </p>
                                    </div>
                                    <p className="text-xs font-serif italic text-slate-400 leading-relaxed">
                                      This photographic asset contains advanced hardware parameters. Upgrade to Premium to reveal lens optics, ISO metrics, shutter values, exposure program, and sensor color matrices.
                                    </p>
                                    <button
                                      onClick={() => setIsPaymentModalOpen(true)}
                                      className="px-6 py-2.5 bg-[#D1FF00] hover:bg-white text-black text-[10px] font-mono uppercase tracking-widest font-black transition-all cursor-pointer shadow-md shadow-[#D1FF00]/10"
                                    >
                                      Unlock Payload Stream — $20/mo
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-slate-500 space-y-3 bg-[#0A0A0A] border border-[#1A1A1A]">
                              <HelpCircle className="w-8 h-8 mx-auto opacity-20 text-[#D1FF00]" />
                              <p className="text-xs font-mono uppercase tracking-widest">GPS Metadata Scrubbed</p>
                              <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Photographic asset lacks camera metadata parameters. AI-derived location estimating models were executed automatically.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Slide-out History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-[#0A0A0A] z-40 cursor-pointer"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-100 bg-[#0F0F0F] border-l border-[#1A1A1A] shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-[#1A1A1A] flex items-center justify-between bg-[#141414]">
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-[#D1FF00]" />
                  <span className="text-xs uppercase tracking-[0.3em] font-mono text-white">Investigation Dossiers</span>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 hover:bg-[#1A1A1A] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0A0A0A]">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveReport(item);
                        setSelectedImage(null);
                        setIsHistoryOpen(false);
                      }}
                      className="group p-5 bg-[#0F0F0F] border border-[#1A1A1A] hover:border-[#D1FF00] transition-all cursor-pointer relative"
                    >
                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="absolute top-4 right-4 p-1.5 hover:bg-[#1A1A1A] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="space-y-3 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-black bg-[#D1FF00] px-2 py-0.5 uppercase tracking-wider">
                            {item.location.confidence}% CONF
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {new Date(item.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xl font-serif italic text-white group-hover:text-[#D1FF00] transition-colors leading-none">
                          {item.location.country}
                        </h4>
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                          {item.location.city ? `${item.location.city} • ` : ""}{item.location.region}
                        </p>
                        <span className="text-[9px] font-mono text-slate-500 block truncate">
                          FILE: {item.imageName}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24 text-slate-500 space-y-4">
                    <History className="w-10 h-10 mx-auto opacity-20 text-[#D1FF00]" />
                    <p className="text-xs font-mono uppercase tracking-widest">No Log Entries Saved</p>
                    <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed font-serif italic">
                      Completed photographic scans will be documented in this registry.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Interactive Billing & Subscription Terminal Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (paymentStep !== "processing") setIsPaymentModalOpen(false);
              }}
              className="fixed inset-0 bg-[#060606] z-40 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-160 md:max-h-[85vh] bg-[#0F0F0F] border border-[#1A1A1A] z-50 flex flex-col shadow-2xl overflow-hidden font-mono"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#1A1A1A] bg-[#141414] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#D1FF00]" />
                  <span className="text-xs uppercase tracking-[0.25em] text-white font-bold">Billing Terminal</span>
                </div>
                {paymentStep !== "processing" && (
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="p-1 hover:bg-[#1A1A1A] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 bg-[#0A0A0A]">
                
                {/* STEP 1: PLANS OVERVIEW */}
                {paymentStep === "plans" && (
                  <div className="space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-serif italic text-white tracking-tight">Select Decryption Tier</h3>
                      <p className="text-xs text-slate-500 uppercase tracking-widest leading-relaxed">
                        Authorize higher bandwidth, bypass regional limiters, and decrypt raw lens data.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* FREE PLAN CARD */}
                      <div className={`p-6 border bg-[#0F0F0F] relative flex flex-col justify-between h-80 transition-all ${
                        !isPremium ? "border-[#333] opacity-80" : "border-[#1A1A1A] opacity-60"
                      }`}>
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] tracking-widest uppercase text-slate-500 font-bold">STANDARD</span>
                            {!isPremium && (
                              <span className="bg-[#1A1A1A] text-slate-400 text-[8px] font-bold px-2 py-0.5 border border-[#333] uppercase tracking-wider">
                                ACTIVE TIER
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-2xl font-serif italic text-white font-light">Free Scan Specimen</h4>
                            <p className="text-2xl font-bold text-white mt-1">$0 <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-normal">/ month</span></p>
                          </div>
                          <ul className="space-y-2 text-[10px] text-slate-400 uppercase tracking-wider leading-relaxed">
                            <li className="flex items-center gap-2"><span className="text-[#D1FF00]">✓</span> 5 Geolocation Scans / Day</li>
                            <li className="flex items-center gap-2"><span className="text-[#D1FF00]">✓</span> Standard OCR Extraction</li>
                            <li className="flex items-center gap-2"><span className="text-slate-600">✗</span> Advanced EXIF Metadata Blocked</li>
                          </ul>
                        </div>
                        {isPremium && (
                          <button
                            onClick={handleCancelSubscription}
                            className="w-full py-2.5 bg-transparent hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-rose-950 hover:border-rose-700 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer"
                          >
                            Downgrade to Free
                          </button>
                        )}
                      </div>

                      {/* PREMIUM PLAN CARD */}
                      <div className={`p-6 border relative flex flex-col justify-between h-80 transition-all ${
                        isPremium ? "border-[#D1FF00] bg-[#D1FF00]/5" : "border-[#333] hover:border-[#D1FF00]/60 bg-[#0F0F0F]"
                      }`}>
                        {/* Glowing corner decor */}
                        <div className="absolute top-0 right-0 w-2 h-2 bg-[#D1FF00]" />
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] tracking-[0.15em] uppercase text-[#D1FF00] font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 animate-pulse" /> PRO FORENSIC
                            </span>
                            {isPremium && (
                              <span className="bg-[#D1FF00] text-black text-[8px] font-black px-2 py-0.5 uppercase tracking-wider">
                                ACTIVE TIER
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-2xl font-serif italic text-white font-light">Unlimited Intelligence</h4>
                            <p className="text-2xl font-bold text-[#D1FF00] mt-1">$20 <span className="text-[10px] font-mono text-[#D1FF00]/60 uppercase tracking-widest font-normal">/ month</span></p>
                          </div>
                          <ul className="space-y-2 text-[10px] text-white uppercase tracking-wider leading-relaxed">
                            <li className="flex items-center gap-2"><span className="text-[#D1FF00]">✓</span> Unlimited Geolocations</li>
                            <li className="flex items-center gap-2"><span className="text-[#D1FF00]">✓</span> Decrypt 150+ Extended EXIF Tags</li>
                            <li className="flex items-center gap-2"><span className="text-[#D1FF00]">✓</span> Fast-Track AI Pipeline Priority</li>
                            <li className="flex items-center gap-2"><span className="text-[#D1FF00]">✓</span> Raw Sensor Calibration Vectors</li>
                          </ul>
                        </div>

                        {!isPremium ? (
                          <button
                            onClick={handleStartCheckout}
                            className="w-full py-2.5 bg-[#D1FF00] hover:bg-white text-black text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer shadow-md shadow-[#D1FF00]/10"
                          >
                            Authorize Pro — $20/mo
                          </button>
                        ) : (
                          <div className="py-2 text-center text-[10px] uppercase text-[#D1FF00] tracking-widest border border-dashed border-[#D1FF00]/30">
                            Active Unlimited Credentials
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CHECKOUT SECURE TERMINAL */}
                {paymentStep === "checkout" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
                      <div>
                        <h3 className="text-lg font-serif italic text-white leading-none">Complete Pro Activation</h3>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-1">256-BIT SECURE CONNECTION DECRYPTED</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">PRICE</span>
                        <span className="text-lg text-[#D1FF00] font-bold">$20.00 / mo</span>
                      </div>
                    </div>

                    {paymentError && (
                      <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-300 text-[10px] uppercase tracking-wider">
                        {paymentError}
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Cardholder Name */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 block">CARDHOLDER NAME</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="INVESTIGATOR NAME"
                          className="w-full bg-[#0F0F0F] border border-[#1A1A1A] hover:border-[#333] focus:border-[#D1FF00] focus:outline-none p-3 text-white text-xs uppercase tracking-widest placeholder:text-slate-700 transition-all"
                        />
                      </div>

                      {/* Card Number */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 block">CARD NUMBER</label>
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            placeholder="4000 1234 5678 9010"
                            className="w-full bg-[#0F0F0F] border border-[#1A1A1A] hover:border-[#333] focus:border-[#D1FF00] focus:outline-none p-3 text-white text-xs placeholder:text-slate-700 tracking-[0.15em] transition-all font-mono"
                          />
                          <CreditCard className="w-4 h-4 text-slate-600 absolute right-3.5 top-3.5" />
                        </div>
                      </div>

                      {/* Expiry and CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-slate-500 block">EXPIRATION</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            className="w-full bg-[#0F0F0F] border border-[#1A1A1A] hover:border-[#333] focus:border-[#D1FF00] focus:outline-none p-3 text-white text-xs placeholder:text-slate-700 tracking-widest transition-all text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-slate-500 block">CVV SECURE</label>
                          <input
                            type="password"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                            placeholder="***"
                            className="w-full bg-[#0F0F0F] border border-[#1A1A1A] hover:border-[#333] focus:border-[#D1FF00] focus:outline-none p-3 text-white text-xs placeholder:text-slate-700 tracking-widest transition-all text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                      <button
                        onClick={() => setPaymentStep("plans")}
                        className="flex-1 py-3 border border-[#1A1A1A] hover:border-slate-500 text-slate-400 hover:text-white text-[10px] uppercase tracking-widest transition-all cursor-pointer bg-transparent"
                      >
                        Change Tier
                      </button>
                      <button
                        onClick={handleSimulatePayment}
                        className="flex-1 py-3 bg-[#D1FF00] hover:bg-white text-black text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer shadow-md shadow-[#D1FF00]/10 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Commit Payment</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: PROCESSING SECURE TERMINAL */}
                {paymentStep === "processing" && (
                  <div className="space-y-8 py-10 text-center">
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-slate-900 border-t-2 border-t-[#D1FF00] animate-spin"></div>
                      <Compass className="w-6 h-6 text-[#D1FF00] animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-[#D1FF00] tracking-[0.3em] block uppercase animate-pulse">
                        PROCESSING SECURE AUTHORIZATION
                      </span>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest transition-all">
                        {processingStatus}
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 4: SUCCESS RECEIPT */}
                {paymentStep === "success" && (
                  <div className="space-y-8 py-4 text-center">
                    <div className="w-14 h-14 mx-auto bg-[#D1FF00]/10 border border-[#D1FF00] flex items-center justify-center text-[#D1FF00] relative">
                      <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-black border border-[#D1FF00]" />
                      <Check className="w-6 h-6 stroke-[3px]" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif italic text-white tracking-tight">Access Credentials Restored</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                        PRO FORENSIC SUBSCRIPTION REGISTERED SUCCESSFULLY
                      </p>
                    </div>

                    {/* Receipt block */}
                    <div className="bg-[#0F0F0F] border border-[#1A1A1A] p-6 text-left max-w-sm mx-auto text-[10px] uppercase tracking-wider space-y-3 font-mono">
                      <div className="flex justify-between border-b border-[#1A1A1A] pb-2">
                        <span className="text-slate-500">MEMBER LEVEL</span>
                        <span className="text-[#D1FF00] font-bold">PRO FORENSIC INTEL</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1A1A1A] pb-2">
                        <span className="text-slate-500">TX REFERENT</span>
                        <span className="text-white">TX-{Math.floor(Math.random() * 900000 + 100000)}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1A1A1A] pb-2">
                        <span className="text-slate-500">MONTHLY CYCLE</span>
                        <span className="text-white">RECURRING AUTOMATIC</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-slate-400">TOTAL CHARGED</span>
                        <span className="text-[#D1FF00] font-bold">$20.00 / MONTH</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsPaymentModalOpen(false);
                        // Reset form
                        setCardNumber("");
                        setCardName("");
                        setCardExpiry("");
                        setCardCvv("");
                        setPaymentStep("plans");
                      }}
                      className="px-10 py-3 bg-[#D1FF00] hover:bg-white text-black text-xs uppercase tracking-widest font-black transition-all cursor-pointer shadow-md shadow-[#D1FF00]/10"
                    >
                      ENTER COMMAND CENTER
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#0F0F0F] border-t border-[#1A1A1A] py-8 text-center text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 TracePoint Intelligence Core • All Rights Reserved</p>
        </div>
      </footer>

    </div>
  );
}
