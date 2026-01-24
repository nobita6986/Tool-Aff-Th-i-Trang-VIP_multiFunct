import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// Component definitions
const ImageUploader = ({ label, image, onImageSelect, onRemove, children }: { 
    label?: string; 
    image: string | null; 
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    onRemove?: () => void; 
    children?: React.ReactNode;
}) => {
    return (
        <div className="uploader-wrapper">
            {label && <label className="uploader-label">{label}</label>}
            <div className="image-upload-area" onClick={() => document.getElementById(`file-${label || 'upload'}`)?.click()}>
                {image ? (
                    <div className="preview-container">
                        <img src={image} alt="Upload preview" />
                        {onRemove && (
                            <button 
                                className="remove-btn"
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="placeholder-content">
                        {children || <span style={{fontSize: '24px', color: '#555'}}>+</span>}
                    </div>
                )}
                
                <input 
                    id={`file-${label || 'upload'}`}
                    type="file" 
                    accept="image/*" 
                    onChange={onImageSelect} 
                    className="hidden-input"
                />
            </div>
        </div>
    );
};

type Provider = 'gemini' | 'openai' | 'grok';

const App = () => {
    // --- API MANAGEMENT STATE ---
    const [apiKeys, setApiKeys] = useState<Record<Provider, string[]>>({
        gemini: [],
        openai: [],
        grok: []
    });
    const [activeProvider, setActiveProvider] = useState<Provider>('gemini');
    const [tempKeyInput, setTempKeyInput] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [modalSelectedProvider, setModalSelectedProvider] = useState<Provider>('gemini');
    
    // Rotation Logic refs
    const currentKeyIndices = useRef<Record<Provider, number>>({
        gemini: 0,
        openai: 0,
        grok: 0
    });

    // --- APP STATE ---
    const [activeTab, setActiveTab] = useState('try-on');
    const [tryOnMode, setTryOnMode] = useState<'full' | 'mix'>('full');
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [finalImage, setFinalImage] = useState<string | null>(null);

    // Skin Fix Mode State
    const [skinFixInputImage, setSkinFixInputImage] = useState<string | null>(null);
    const [skinFixResultImage, setSkinFixResultImage] = useState<string | null>(null);
    const [isFixingSkin, setIsFixingSkin] = useState(false);

    // Breast Lift Mode State
    const [breastLiftInputImage, setBreastLiftInputImage] = useState<string | null>(null);
    const [breastLiftResultImage, setBreastLiftResultImage] = useState<string | null>(null);
    const [isLiftingBreast, setIsLiftingBreast] = useState(false);

    // Full Mode State
    const [fullOutfitFile, setFullOutfitFile] = useState<File | null>(null);
    const [fullOutfitPreview, setFullOutfitPreview] = useState<string | null>(null);
    const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
    const [referencePreviews, setReferencePreviews] = useState<string[]>([]);

    const [modelFile, setModelFile] = useState<File | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    
    const [fullSetOptions, setFullSetOptions] = useState({
        clothing: true,
        shoes: false,
        jewelry: false,
        bag: false
    });

    // Mix Mode State
    const [dressImage, setDressImage] = useState<string | null>(null);
    const [topImage, setTopImage] = useState<string | null>(null);
    const [bottomImage, setBottomImage] = useState<string | null>(null);
    const [shoesImage, setShoesImage] = useState<string | null>(null);
    const [jewelryImage, setJewelryImage] = useState<string | null>(null);
    const [bagImage, setBagImage] = useState<string | null>(null);
    
    // Helper to keep track of files for mix mode
    const [mixFiles, setMixFiles] = useState<{ [key: string]: File | null }>({});

    const [generationSettings, setGenerationSettings] = useState({
        aspectRatio: '9:16',
        changePose: false,
        changeBackground: false,
        generateFullBody: false,
        transparentBackground: false
    });

    // --- INITIALIZATION & API LOGIC ---

    // Load API Keys from LocalStorage
    useEffect(() => {
        const storedKeys = localStorage.getItem('multi_provider_api_keys');
        const storedActiveProvider = localStorage.getItem('active_provider') as Provider | null;

        if (storedKeys) {
            try {
                const parsed = JSON.parse(storedKeys);
                setApiKeys(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Error parsing keys", e);
            }
        } else {
             // Fallback: Use process.env.API_KEY if available as a starter
            if (process.env.API_KEY) {
                setApiKeys(prev => {
                    const newState = { ...prev, gemini: [process.env.API_KEY!] };
                    // Don't save to localStorage to avoid persisting env var, just use it in state
                    return newState;
                });
            }
        }

        if (storedActiveProvider && ['gemini', 'openai', 'grok'].includes(storedActiveProvider)) {
            setActiveProvider(storedActiveProvider);
            setModalSelectedProvider(storedActiveProvider);
        }
    }, []);

    const addApiKeys = () => {
        if (!tempKeyInput.trim()) return;
        
        const newKeys = tempKeyInput
            .split(/[\n,]+/)
            .map(k => k.trim())
            .filter(k => k.length > 5);

        if (newKeys.length > 0) {
            setApiKeys(prev => {
                const currentProviderKeys = prev[modalSelectedProvider];
                const uniqueNewKeys = newKeys.filter(k => !currentProviderKeys.includes(k));
                
                const newState = {
                    ...prev,
                    [modalSelectedProvider]: [...currentProviderKeys, ...uniqueNewKeys]
                };
                localStorage.setItem('multi_provider_api_keys', JSON.stringify(newState));
                return newState;
            });
            setTempKeyInput('');
        }
    };

    const removeApiKey = (provider: Provider, index: number) => {
        setApiKeys(prev => {
            const currentProviderKeys = prev[provider];
            const updatedKeys = currentProviderKeys.filter((_, i) => i !== index);
            const newState = { ...prev, [provider]: updatedKeys };
            localStorage.setItem('multi_provider_api_keys', JSON.stringify(newState));
            
            if (currentKeyIndices.current[provider] >= updatedKeys.length) {
                currentKeyIndices.current[provider] = 0;
            }
            return newState;
        });
    };

    const handleSetActiveProvider = (provider: Provider) => {
        setActiveProvider(provider);
        localStorage.setItem('active_provider', provider);
    };

    // CORE: Rotation Logic
    const executeWithRotation = async <T,>(operation: (apiKey: string) => Promise<T>): Promise<T> => {
        const providerKeys = apiKeys[activeProvider];

        if (activeProvider !== 'gemini') {
            throw new Error(`Nhà cung cấp ${activeProvider.toUpperCase()} chưa được hỗ trợ cho chức năng này. Vui lòng chọn Gemini.`);
        }

        if (providerKeys.length === 0) {
            setShowSettings(true);
            throw new Error(`Vui lòng nhập API Key cho ${activeProvider.toUpperCase()} trong phần Cài đặt.`);
        }

        let lastError: any = new Error("Unknown error");
        const startIndex = currentKeyIndices.current[activeProvider];

        for (let i = 0; i < providerKeys.length; i++) {
            const index = (startIndex + i) % providerKeys.length;
            const key = providerKeys[index];

            try {
                const result = await operation(key);
                // Success: update sticky index
                currentKeyIndices.current[activeProvider] = index;
                return result;
            } catch (err: any) {
                // If it's a content refusal (Safety/Policy), DON'T rotate, just fail.
                if (err.message && (err.message.includes("AI không trả về ảnh") || err.message.includes("Safety"))) {
                    throw err; 
                }

                console.warn(`Key ...${key.slice(-4)} failed:`, err.message);
                lastError = err;
            }
        }
        throw new Error(`Tất cả Key của ${activeProvider.toUpperCase()} đều lỗi. Lỗi cuối: ${lastError.message}`);
    };

    // --- HANDLERS ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void, setPreview: (s: string | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (referenceFiles.length >= 3) {
                alert("Tối đa 3 ảnh tham khảo.");
                return;
            }
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setReferenceFiles(prev => [...prev, file]);
            setReferencePreviews(prev => [...prev, url]);
            
            e.target.value = ''; 
        }
    };

    const removeReferenceImage = (index: number) => {
        setReferenceFiles(prev => prev.filter((_, i) => i !== index));
        setReferencePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setPreview: (s: string | null) => void, setResult: (s: string | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (typeof ev.target?.result === 'string') {
                    setPreview(ev.target.result);
                    setResult(null); 
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleFullSetOption = (key: keyof typeof fullSetOptions) => {
        setFullSetOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const setAspectRatio = (ratio: string) => {
        setGenerationSettings(prev => ({ ...prev, aspectRatio: ratio }));
    };

    const toggleGenerationSetting = (key: keyof typeof generationSettings) => {
        setGenerationSettings(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            // Conflict handling: Transparent implies Change Background implicitly in UI logic, but here we can just update state.
            // If transparent is turned ON, we might want to uncheck "Change Background" to avoid visual clutter, but prompt logic handles priority.
            if (key === 'transparentBackground' && newState.transparentBackground) {
                // Optional: Force changeBackground off if transparent is on, or just let prompt logic handle it.
                // newState.changeBackground = false; 
            }
            return newState;
        });
    };

    const handleDirectGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setMixFiles(prev => ({ ...prev, [type]: file }));
            
            switch(type) {
                case 'dress': setDressImage(url); break;
                case 'top': setTopImage(url); break;
                case 'bottom': setBottomImage(url); break;
                case 'shoes': setShoesImage(url); break;
                case 'jewelry': setJewelryImage(url); break;
                case 'bag': setBagImage(url); break;
            }
        }
    };

    const handleRemoveGarment = (type: string) => {
        setMixFiles(prev => ({ ...prev, [type]: null }));
        switch(type) {
            case 'dress': setDressImage(null); break;
            case 'top': setTopImage(null); break;
            case 'bottom': setBottomImage(null); break;
            case 'shoes': setShoesImage(null); break;
            case 'jewelry': setJewelryImage(null); break;
            case 'bag': setBagImage(null); break;
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result.split(',')[1]);
                } else {
                    reject(new Error("Failed to read file"));
                }
            };
            reader.onerror = error => reject(error);
        });
    };

    // --- GENERATION FUNCTIONS ---

    const handleGenerateTryOn = async () => {
        setIsGenerating(true);
        setFinalImage(null);
        setError(null);

        try {
            const parts: any[] = [];
            
            if (modelFile) {
                const modelB64 = await fileToBase64(modelFile);
                parts.push({ text: "IMAGE A [TARGET MODEL]: This is the main subject. Use this person's face and body characteristics." });
                parts.push({
                    inlineData: {
                        mimeType: modelFile.type,
                        data: modelB64
                    }
                });
            }

            if (tryOnMode === 'full' && fullOutfitFile) {
                const outfitB64 = await fileToBase64(fullOutfitFile);
                parts.push({ text: "IMAGE B [CLOTHING SOURCE]: Extract the outfit from this image. This is the PRIMARY source for the clothing design, pattern, and color. Ignore the person in this image." });
                parts.push({
                    inlineData: {
                        mimeType: fullOutfitFile.type,
                        data: outfitB64
                    }
                });

                // Add Reference Images if available
                if (referenceFiles.length > 0) {
                    for (let i = 0; i < referenceFiles.length; i++) {
                        const refB64 = await fileToBase64(referenceFiles[i]);
                        parts.push({ text: `IMAGE [REFERENCE OUTFIT ${i+1}]: Auxiliary reference for the clothing in IMAGE B. Use these ONLY for understanding the 3D structure, texture, or back/side details. Priority: IMAGE B > Reference Images.` });
                        parts.push({
                            inlineData: {
                                mimeType: referenceFiles[i].type,
                                data: refB64
                            }
                        });
                    }
                }
            } else if (tryOnMode === 'mix') {
                for (const [key, file] of Object.entries(mixFiles)) {
                    if (file) {
                        const f = file as File;
                        const b64 = await fileToBase64(f);
                        parts.push({ text: `IMAGE [CLOTHING ITEM - ${key.toUpperCase()}]: Use this item.` });
                        parts.push({
                            inlineData: {
                                mimeType: f.type,
                                data: b64
                            }
                        });
                    }
                }
            }

            let textPrompt = "TASK: Virtual Try-On & Fashion Compositing. \n";
            
            if (generationSettings.changePose) {
                textPrompt += "GOAL: Generate a NEW image of the person from IMAGE A (Identity) wearing the clothing from IMAGE B, but in a NEW DYNAMIC POSE.\n";
            } else {
                textPrompt += "GOAL: Composite the clothing from IMAGE B onto the person in IMAGE A, strictly maintaining the original pose and composition.\n";
            }

            textPrompt += "\nCRITICAL IDENTITY RULES:\n";
            textPrompt += "1. IDENTITY: You MUST preserve the face and body shape of the person in IMAGE A. Do NOT use the face from IMAGE B.\n";
            textPrompt += "2. CLOTHING: Replace the clothes on the person in IMAGE A with the clothes visible in IMAGE B. Fit them naturally.\n";
            
            if (tryOnMode === 'full') {
                 const activeOptions = Object.entries(fullSetOptions)
                    .filter(([_, active]) => active)
                    .map(([key]) => key);
                
                if (activeOptions.length > 0) {
                     textPrompt += `3. TARGETED CHANGE: Specifically change the [${activeOptions.join(', ')}] on the model. Keep other accessories from IMAGE A if possible.\n`;
                } else {
                     textPrompt += "3. CHANGE: Replace the entire outfit.\n";
                }
            }

            textPrompt += "\nGENERATION SETTINGS (MUST FOLLOW):\n";
            if (generationSettings.changePose) {
                textPrompt += "- POSE: **CHANGE THE POSE**. Do NOT use the pose from IMAGE A. Generate a confident, high-fashion model pose suitable for the outfit.\n";
            } else {
                textPrompt += "- POSE: **STRICTLY PRESERVE** the pose from IMAGE A. Head angle, arm position, and leg position must remain the same.\n";
            }
            
            // BACKGROUND LOGIC
            if (generationSettings.transparentBackground) {
                textPrompt += "- BACKGROUND: **ISOLATED SUBJECT**. Generate the subject on a clean, PURE WHITE background (Hex #FFFFFF) with no shadows or environmental details, strictly isolated for easy background removal.\n";
            } else if (generationSettings.changeBackground) {
                textPrompt += "- BACKGROUND: **CHANGE THE BACKGROUND**. Do NOT use the background from IMAGE A. Place the subject in a clean, professional studio environment (e.g., solid color, soft gradient, or lifestyle setting).\n";
            } else {
                textPrompt += "- BACKGROUND: **KEEP BACKGROUND**. Retain the background environment from IMAGE A.\n";
            }

            if (generationSettings.generateFullBody) {
                textPrompt += "- FRAMING: **FULL BODY SHOT**. You MUST generate a full-body image (Head to Toe). If IMAGE A is cropped (e.g., half-body), you must HALLUCINATE/GENERATE the legs and shoes coherently to complete the look.\n";
            } else {
                textPrompt += "- FRAMING: Respect the original framing/crop of IMAGE A.\n";
            }

            textPrompt += `\nOutput Aspect Ratio: ${generationSettings.aspectRatio}.`;
            textPrompt += "\nStyle: Photorealistic, 8k, detailed texture, realistic lighting.";

            parts.push({ text: textPrompt });

            // Use Rotation
            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const modelName = 'gemini-2.5-flash-image';
                
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: { parts: parts },
                });

                let foundImage = false;
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            setFinalImage(imageUrl);
                            foundImage = true;
                        }
                    }
                }

                if (!foundImage) {
                        const extraText = response.text ? ` (AI Refusal: ${response.text})` : "";
                        throw new Error("AI không trả về ảnh" + extraText); 
                }
                return response;
            });

        } catch (err: any) {
            console.error("Generation error:", err);
            setError("Lỗi tạo ảnh: " + (err.message || "Vui lòng kiểm tra lại."));
        } finally {
            setIsGenerating(false);
        }
    };

    const processSkinFix = async (imageSrc: string) => {
        setIsFixingSkin(true);
        setError(null);
        setSkinFixResultImage(null);

        try {
            const base64Data = imageSrc.split(',')[1];
            const mimeType = imageSrc.match(/data:(.*?);base64/)?.[1] || 'image/png';

            const parts = [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                },
                { text: "TASK: Advanced Photorealistic Skin Restoration (De-Plasticizing).\n" +
                  "CONTEXT: The input image is an AI-generated portrait with 'plastic/waxy' skin artifacts.\n" +
                  "OBJECTIVE: Restore physics-based skin properties without altering the subject's identity.\n\n" +

                  "EXECUTION STEPS:\n" +
                  "1. SEGMENTATION & PARSING: Focus EXCLUSIVELY on skin regions (cheeks, forehead, chin, nose bridge). STRICTLY PROTECT eyes, eyebrows, lips, and hair from any changes.\n" +
                  "2. PLASTICITY DETECTION: Identify areas lacking high-frequency details (smooth, blur patches).\n" +
                  "3. MICRO-TEXTURE SYNTHESIS: Generate non-repeating, irregular micro-textures (pores, fine lines, skin variance) appropriate for the subject's age and lighting conditions. Remove the 'low-frequency' smooth look.\n" +
                  "4. LIGHTING PHYSICS: Simulate Subsurface Scattering (SSS) to remove the hard 'plastic' shine. Soften specular highlights to look like organic skin, not plastic. Add micro-contrast shadows to skin texture.\n" +
                  "5. NOISE/GRAIN: Add subtle, realistic camera sensor noise/grain to match a high-end photography look.\n\n" +

                  "NEGATIVE CONSTRAINTS (MUST AVOID):\n" +
                  "- DO NOT change facial geometry, bone structure, or expression (Identity Preservation is PARAMOUNT).\n" +
                  "- DO NOT add heavy blemishes or age spots unless present in original.\n" +
                  "- DO NOT smooth, beautify, or apply 'filters'.\n" +
                  "- NO waxiness, NO airbrush look."
                }
            ];

            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const modelName = 'gemini-2.5-flash-image';
                
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: { parts: parts },
                });

                let foundImage = false;
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            setSkinFixResultImage(imageUrl);
                            foundImage = true;
                        }
                    }
                }
                if (!foundImage) {
                    const extraText = response.text ? ` (AI Refusal: ${response.text})` : "";
                    throw new Error("AI không trả về ảnh" + extraText);
                }
                return response;
            });

        } catch (e: any) {
            console.error(e);
            setError("Lỗi khi xử lý da: " + e.message);
        } finally {
            setIsFixingSkin(false);
        }
    };

    const handleTransferToSkinFix = async (imageSrc: string) => {
        setSkinFixInputImage(imageSrc);
        setActiveTab('fix-skin');
        await processSkinFix(imageSrc);
    };

    const processBreastLift = async (imageSrc: string) => {
        setIsLiftingBreast(true);
        setError(null);
        setBreastLiftResultImage(null);

        try {
            const base64Data = imageSrc.split(',')[1];
            const mimeType = imageSrc.match(/data:(.*?);base64/)?.[1] || 'image/png';

            const parts = [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                },
                { text: "TASK: Digital Body Transformation - Maximum Augmentation.\n" +
                  "OBJECTIVE: Alter the subject's physique to have a significantly larger, voluptuous bust (Cup size increase: +5).\n\n" +

                  "VISUAL INSTRUCTIONS:\n" +
                  "1. **OVERRIDE SILHOUETTE:** You MUST expand the boundaries of the upper body. Do not constrain the new shape to the old clothing lines. Draw a NEW, EXPANDED chest silhouette.\n" +
                  "2. **CLOTHING PHYSICS:** The clothes must look TIGHT. Render tension lines, stretching fabric, and stress on buttons/seams. The fabric should cling to the under-curve of the chest.\n" +
                  "3. **SHADING & VOLUME:** Create deep cleavage shadows. Add specular highlights on the upper chest to emphasize spherical volume.\n" +
                  "4. **PROPORTIONS:** Create an exaggerated 'Hourglass' figure by widening the chest and keeping the waist slim.\n\n" +

                  "STRICT RULES:\n" +
                  "- **PRESERVE IDENTITY:** Face, hair, and head MUST remain 100% original.\n" +
                  "- **PRESERVE BACKGROUND:** Do not warp the background.\n" +
                  "- **OUTPUT STYLE:** Photorealistic, high definition."
                }
            ];

            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const modelName = 'gemini-2.5-flash-image';

                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: { parts: parts },
                });

                let foundImage = false;
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            setBreastLiftResultImage(imageUrl);
                            foundImage = true;
                        }
                    }
                }
                if (!foundImage) {
                        const extraText = response.text ? ` (AI Refusal: ${response.text})` : "";
                        throw new Error("AI không trả về ảnh" + extraText);
                }
                return response;
            });

        } catch (e: any) {
            console.error(e);
            setError("Lỗi khi xử lý nâng ngực: " + e.message);
        } finally {
            setIsLiftingBreast(false);
        }
    };

    const handleTransferToBreastLift = async (imageSrc: string) => {
        setBreastLiftInputImage(imageSrc);
        setActiveTab('breast-lift');
        await processBreastLift(imageSrc);
    };

    return (
        <div className="container">
            {/* --- HEADER WITH SETTINGS BTN --- */}
            <header className="main-header">
                <h1 className="app-title">AI Studio VIP</h1>
                <p className="app-subtitle">Bộ công cụ xử lý ảnh chuyên nghiệp</p>
                
                <div style={{marginBottom: '20px'}}>
                    <button 
                        className="settings-btn"
                        onClick={() => setShowSettings(true)}
                    >
                        <span style={{fontSize: '1.2rem'}}>⚙️</span>
                        <span>Cài đặt API</span>
                    </button>
                    {activeProvider !== 'gemini' && (
                        <div style={{marginTop: '10px', color: '#f59e0b', fontSize: '0.9rem'}}>
                            ⚠️ Đang dùng: {activeProvider.toUpperCase()} (Chưa hỗ trợ tạo ảnh)
                        </div>
                    )}
                </div>

                <nav className="main-nav">
                    <button 
                        className={`nav-item nav-try-on ${activeTab === 'try-on' ? 'active' : ''}`}
                        onClick={() => setActiveTab('try-on')}
                    >
                        👗 Virtual Try-On
                    </button>
                    <button 
                        className={`nav-item nav-fix-skin ${activeTab === 'fix-skin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('fix-skin')}
                    >
                        ✨ Fix Da Nhựa
                    </button>
                    <button 
                        className={`nav-item nav-breast-lift ${activeTab === 'breast-lift' ? 'active' : ''}`}
                        onClick={() => setActiveTab('breast-lift')}
                    >
                        👙 AI Nâng Ngực
                    </button>
                </nav>
            </header>

            {/* --- SETTINGS MODAL --- */}
            {showSettings && (
                <div className="modal-overlay">
                    <div className="modal-content settings-modal-wide">
                        <div className="modal-header">
                            <h3>Quản lý API Key</h3>
                            <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            {/* Sidebar */}
                            <div className="modal-sidebar">
                                <button 
                                    className={`sidebar-item ${modalSelectedProvider === 'gemini' ? 'active' : ''}`}
                                    onClick={() => setModalSelectedProvider('gemini')}
                                >
                                    <span className="icon">💎</span> Gemini
                                    <span className="count-badge">{apiKeys.gemini.length}</span>
                                </button>
                                <button 
                                    className={`sidebar-item ${modalSelectedProvider === 'openai' ? 'active' : ''}`}
                                    onClick={() => setModalSelectedProvider('openai')}
                                >
                                    <span className="icon">🌀</span> Open AI
                                    <span className="count-badge">{apiKeys.openai.length}</span>
                                </button>
                                <button 
                                    className={`sidebar-item ${modalSelectedProvider === 'grok' ? 'active' : ''}`}
                                    onClick={() => setModalSelectedProvider('grok')}
                                >
                                    <span className="icon">🚀</span> Grok
                                    <span className="count-badge">{apiKeys.grok.length}</span>
                                </button>

                                <div className="active-provider-section">
                                    <label>Đang sử dụng:</label>
                                    <select 
                                        value={activeProvider} 
                                        onChange={(e) => handleSetActiveProvider(e.target.value as Provider)}
                                        className="provider-select"
                                    >
                                        <option value="gemini">Gemini (Khuyên dùng)</option>
                                        <option value="openai">Open AI</option>
                                        <option value="grok">Grok</option>
                                    </select>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="modal-main">
                                <h4 style={{marginTop: 0, marginBottom: '10px', textTransform: 'capitalize'}}>
                                    Quản lý Key {modalSelectedProvider}
                                </h4>
                                <p style={{color: '#aaa', fontSize: '0.85rem', marginBottom: '15px'}}>
                                    {modalSelectedProvider === 'gemini' 
                                        ? "Dùng để tạo ảnh Try-On, Fix da, Nâng ngực." 
                                        : "Chức năng tạo ảnh với provider này đang phát triển."}
                                </p>
                                
                                <div className="api-input-group">
                                    <textarea 
                                        value={tempKeyInput} 
                                        onChange={(e) => setTempKeyInput(e.target.value)}
                                        placeholder={`Dán danh sách Key ${modalSelectedProvider} (mỗi dòng một Key)...`}
                                        className="api-textarea"
                                        rows={3}
                                    />
                                    <button className="btn btn-primary add-key-btn" onClick={addApiKeys}>+ Thêm</button>
                                </div>

                                <div className="key-list-container">
                                    <div className="key-list-header">
                                        Danh sách Key ({apiKeys[modalSelectedProvider].length})
                                    </div>
                                    <div className="key-list">
                                        {apiKeys[modalSelectedProvider].length === 0 ? (
                                            <div className="empty-keys">Chưa có Key nào.</div>
                                        ) : (
                                            apiKeys[modalSelectedProvider].map((k, i) => (
                                                <div key={i} className={`key-item ${modalSelectedProvider === activeProvider && i === currentKeyIndices.current[modalSelectedProvider] ? 'key-active' : ''}`}>
                                                    <div className="key-info">
                                                        <span className={`key-status-dot ${modalSelectedProvider === activeProvider ? 'active' : 'inactive'}`}></span>
                                                        <span className="key-text">...{k.slice(-6)}</span>
                                                    </div>
                                                    <button className="delete-key-btn" onClick={() => removeApiKey(modalSelectedProvider, i)}>🗑️</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                
                                <div style={{marginTop: 'auto', paddingTop: '10px', fontSize: '0.8rem'}}>
                                    {modalSelectedProvider === 'gemini' && (
                                        <a href="https://aistudio.google.com/app/apikey" target="_blank" style={{color: '#60a5fa'}}>👉 Lấy Gemini API Key</a>
                                    )}
                                    {modalSelectedProvider === 'openai' && (
                                        <a href="https://platform.openai.com/api-keys" target="_blank" style={{color: '#60a5fa'}}>👉 Lấy OpenAI API Key</a>
                                    )}
                                    {modalSelectedProvider === 'grok' && (
                                        <a href="https://console.x.ai/" target="_blank" style={{color: '#60a5fa'}}>👉 Lấy Grok API Key</a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

             {error && <div className="error-message">{error}</div>}
             
             {activeTab === 'try-on' && (
                <>
                    <div className="mode-switcher-container">
                        <button 
                            className={`btn ${tryOnMode === 'full' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setTryOnMode('full'); setError(null); }}
                        >
                            ✨ Full Set (Nguyên Bộ)
                        </button>
                        <button 
                            className={`btn ${tryOnMode === 'mix' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setTryOnMode('mix'); setError(null); }}
                        >
                            🧩 Mix & Match (Lẻ)
                        </button>
                    </div>

                    <main className="workflow-container">
                        {tryOnMode === 'full' ? (
                            <>
                                <section className="step-card full-width">
                                    <h2><span className="step-number">1</span> Cấu hình & Dữ liệu</h2>
                                    <div className="garment-source-container">
                                        <div className="full-mode-container">
                                            <div className="dual-upload-container">
                                                <div className="upload-box">
                                                    <ImageUploader
                                                        label="1. Ảnh Set Đồ (Chính)"
                                                        image={fullOutfitPreview}
                                                        onImageSelect={(e) => handleFileChange(e, setFullOutfitFile, setFullOutfitPreview)}
                                                        onRemove={() => { setFullOutfitFile(null); setFullOutfitPreview(null); }}
                                                    >
                                                        <p>Tải ảnh chứa nguyên set đồ</p>
                                                    </ImageUploader>

                                                    <div className="reference-section">
                                                        <div className="reference-header">
                                                            <label>Ảnh tham khảo (Tùy chọn)</label>
                                                            <span>{referenceFiles.length}/3</span>
                                                        </div>
                                                        
                                                        <div className="reference-grid">
                                                            {referencePreviews.map((src, idx) => (
                                                                <div key={idx} className="reference-item">
                                                                    <img src={src} />
                                                                    <button onClick={() => removeReferenceImage(idx)}>×</button>
                                                                </div>
                                                            ))}
                                                            
                                                            {referenceFiles.length < 3 && (
                                                                <div 
                                                                    className="reference-add-btn"
                                                                    onClick={() => document.getElementById('ref-upload')?.click()}
                                                                >
                                                                    +
                                                                </div>
                                                            )}
                                                            <input 
                                                                id="ref-upload" 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={handleReferenceUpload} 
                                                                style={{display: 'none'}} 
                                                            />
                                                        </div>
                                                        <p className="reference-note">
                                                            *Upload thêm góc nhìn khác để AI hiểu rõ hơn.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="upload-box">
                                                    <ImageUploader
                                                        label="2. Ảnh Người Mẫu"
                                                        image={modelPreview}
                                                        onImageSelect={(e) => handleFileChange(e, setModelFile, setModelPreview)}
                                                        onRemove={() => { setModelFile(null); setModelPreview(null); }}
                                                    >
                                                        <p>Tải ảnh người mẫu</p>
                                                    </ImageUploader>
                                                </div>
                                            </div>
                                            
                                            <div className="settings-panel">
                                                <div className="settings-columns">
                                                    <div className="settings-card">
                                                        <div className="settings-card-header">
                                                            <label>3. Chọn mục cần thay:</label>
                                                        </div>
                                                        <div className="settings-card-body">
                                                            <div className="option-toggles-list">
                                                                <button 
                                                                    className={`option-btn ${fullSetOptions.clothing ? 'active' : ''}`}
                                                                    onClick={() => toggleFullSetOption('clothing')}
                                                                >
                                                                    <span>👗 Quần/Áo/Váy</span>
                                                                    {fullSetOptions.clothing && <span>✓</span>}
                                                                </button>
                                                                <button 
                                                                    className={`option-btn ${fullSetOptions.shoes ? 'active' : ''}`}
                                                                    onClick={() => toggleFullSetOption('shoes')}
                                                                >
                                                                    <span>👠 Giày/Dép</span>
                                                                    {fullSetOptions.shoes && <span>✓</span>}
                                                                </button>
                                                                <button 
                                                                    className={`option-btn ${fullSetOptions.jewelry ? 'active' : ''}`}
                                                                    onClick={() => toggleFullSetOption('jewelry')}
                                                                >
                                                                    <span>💎 Trang sức</span>
                                                                    {fullSetOptions.jewelry && <span>✓</span>}
                                                                </button>
                                                                <button 
                                                                    className={`option-btn ${fullSetOptions.bag ? 'active' : ''}`}
                                                                    onClick={() => toggleFullSetOption('bag')}
                                                                >
                                                                    <span>👜 Túi xách</span>
                                                                    {fullSetOptions.bag && <span>✓</span>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="settings-card">
                                                        <div className="settings-card-header">
                                                            <label>4. Cài đặt tạo ảnh:</label>
                                                        </div>
                                                        <div className="settings-card-body">
                                                            <div className="option-toggles-list">
                                                                <div className="aspect-ratio-selector">
                                                                    <button 
                                                                        className={`option-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`}
                                                                        onClick={() => setAspectRatio('9:16')}
                                                                    >
                                                                        📱 Dọc (9:16)
                                                                    </button>
                                                                    <button 
                                                                        className={`option-btn ${generationSettings.aspectRatio === '16:9' ? 'active' : ''}`}
                                                                        onClick={() => setAspectRatio('16:9')}
                                                                    >
                                                                        💻 Ngang (16:9)
                                                                    </button>
                                                                </div>

                                                                <div className="settings-grid-2col">
                                                                    <button 
                                                                        className={`option-btn ${generationSettings.changePose ? 'active' : ''}`}
                                                                        onClick={() => toggleGenerationSetting('changePose')}
                                                                    >
                                                                        <span>💃 Đổi tư thế</span>
                                                                        {generationSettings.changePose && <span>✓</span>}
                                                                    </button>
                                                                    
                                                                    <button 
                                                                        className={`option-btn ${generationSettings.generateFullBody ? 'active' : ''}`}
                                                                        onClick={() => toggleGenerationSetting('generateFullBody')}
                                                                    >
                                                                        <span>🧍 Toàn thân</span>
                                                                        {generationSettings.generateFullBody && <span>✓</span>}
                                                                    </button>

                                                                    <button 
                                                                        className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`}
                                                                        onClick={() => toggleGenerationSetting('changeBackground')}
                                                                        disabled={generationSettings.transparentBackground}
                                                                        style={generationSettings.transparentBackground ? {opacity: 0.5} : {}}
                                                                    >
                                                                        <span>🏞️ Đổi nền</span>
                                                                        {generationSettings.changeBackground && !generationSettings.transparentBackground && <span>✓</span>}
                                                                    </button>

                                                                    <button 
                                                                        className={`option-btn ${generationSettings.transparentBackground ? 'active' : ''}`}
                                                                        onClick={() => toggleGenerationSetting('transparentBackground')}
                                                                    >
                                                                        <span>🔳 Nền rỗng</span>
                                                                        {generationSettings.transparentBackground && <span>✓</span>}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </>
                        ) : (
                            <>
                                <section className="step-card full-width">
                                    <h2><span className="step-number">1</span> Ảnh Người Mẫu</h2>
                                    <div className="model-upload-center">
                                        <ImageUploader
                                            image={modelPreview}
                                            onImageSelect={(e) => handleFileChange(e, setModelFile, setModelPreview)}
                                        >
                                            <p>+ Tải ảnh người mẫu</p>
                                        </ImageUploader>
                                    </div>
                                </section>

                                <section className="step-card full-width">
                                    <h2><span className="step-number">2</span> Chọn Đồ Mix & Match</h2>
                                    <div className="mix-mode-grid">
                                        <p className="section-desc">
                                            Tải lên các món đồ riêng lẻ bạn muốn mặc cho người mẫu.
                                        </p>
                                        
                                        <div className="extracted-items">
                                            <ImageUploader
                                                label="👗 Váy (Bộ)"
                                                image={dressImage}
                                                onImageSelect={(e) => handleDirectGarmentUpload(e, 'dress')}
                                                onRemove={() => handleRemoveGarment('dress')}
                                            />

                                            <ImageUploader
                                                label="👚 Áo"
                                                image={topImage}
                                                onImageSelect={(e) => handleDirectGarmentUpload(e, 'top')}
                                                onRemove={() => handleRemoveGarment('top')}
                                            />

                                            <ImageUploader
                                                label="👖 Quần/Váy"
                                                image={bottomImage}
                                                onImageSelect={(e) => handleDirectGarmentUpload(e, 'bottom')}
                                                onRemove={() => handleRemoveGarment('bottom')}
                                            />

                                            <ImageUploader
                                                label="👠 Giày"
                                                image={shoesImage}
                                                onImageSelect={(e) => handleDirectGarmentUpload(e, 'shoes')}
                                                onRemove={() => handleRemoveGarment('shoes')}
                                            />

                                            <ImageUploader
                                                label="💎 Trang sức"
                                                image={jewelryImage}
                                                onImageSelect={(e) => handleDirectGarmentUpload(e, 'jewelry')}
                                                onRemove={() => handleRemoveGarment('jewelry')}
                                            />

                                            <ImageUploader
                                                label="👜 Túi"
                                                image={bagImage}
                                                onImageSelect={(e) => handleDirectGarmentUpload(e, 'bag')}
                                                onRemove={() => handleRemoveGarment('bag')}
                                            />
                                        </div>

                                        <div className="mix-mode-options">
                                            <label className="uploader-label" style={{marginBottom: '0.8rem', display: 'block'}}>Cài đặt nâng cao:</label>
                                            <div className="mix-mode-actions">
                                                 <div className="aspect-ratio-selector">
                                                    <button 
                                                        className={`option-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`}
                                                        onClick={() => setAspectRatio('9:16')}
                                                    >
                                                        📱 Dọc (9:16)
                                                    </button>
                                                    <button 
                                                        className={`option-btn ${generationSettings.aspectRatio === '16:9' ? 'active' : ''}`}
                                                        onClick={() => setAspectRatio('16:9')}
                                                    >
                                                        💻 Ngang (16:9)
                                                    </button>
                                                </div>
                                                
                                                <div className="settings-grid-2col" style={{width: '100%'}}>
                                                    <button 
                                                        className={`option-btn ${generationSettings.changePose ? 'active' : ''}`}
                                                        onClick={() => toggleGenerationSetting('changePose')}
                                                    >
                                                        💃 Đổi tư thế
                                                    </button>
                                                    <button 
                                                        className={`option-btn ${generationSettings.generateFullBody ? 'active' : ''}`}
                                                        onClick={() => toggleGenerationSetting('generateFullBody')}
                                                    >
                                                        🧍 Toàn thân
                                                    </button>
                                                    <button 
                                                        className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`}
                                                        onClick={() => toggleGenerationSetting('changeBackground')}
                                                        disabled={generationSettings.transparentBackground}
                                                    >
                                                        🏞️ Đổi nền
                                                    </button>
                                                     <button 
                                                        className={`option-btn ${generationSettings.transparentBackground ? 'active' : ''}`}
                                                        onClick={() => toggleGenerationSetting('transparentBackground')}
                                                    >
                                                        🔳 Nền rỗng
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        <section className="step-card full-width">
                            <h2><span className="step-number">{tryOnMode === 'full' ? '2' : '3'}</span> Hoàn Tất</h2>
                            <div className={`finalize-box ${tryOnMode === 'full' ? 'balanced-layout' : ''}`}>
                                <div className="summary-info">
                                    <p>Cấu hình hiện tại: <strong>{tryOnMode === 'full' ? 'Full Set (Nguyên Bộ)' : 'Mix & Match'}</strong></p>
                                    
                                    {tryOnMode === 'mix' && (
                                        <ul className="status-list">
                                            <li>Trang phục chính: {dressImage ? '✅ Váy/Đầm' : (topImage || bottomImage ? `✅ ${topImage ? 'Áo' : ''} ${bottomImage ? 'Quần' : ''}` : '❌ Chưa chọn')}</li>
                                            <li>Phụ kiện: {[
                                                shoesImage ? 'Giày' : '',
                                                jewelryImage ? 'Trang sức' : '',
                                                bagImage ? 'Túi' : ''
                                            ].filter(Boolean).join(', ') || 'Không'}</li>
                                        </ul>
                                    )}
                                    
                                    {tryOnMode === 'full' && (
                                        <ul className="status-list balanced-list">
                                            <li>Set đồ: {fullOutfitFile ? '✅ Sẵn sàng' : '❌ Thiếu'}</li>
                                            <li>Mẫu: {modelFile ? '✅ Sẵn sàng' : '❌ Thiếu'}</li>
                                            {referenceFiles.length > 0 && <li>Ảnh tham khảo: {referenceFiles.length} ảnh</li>}
                                            <li>Thay: 
                                                {[
                                                    fullSetOptions.clothing ? 'Áo/Quần' : '',
                                                    fullSetOptions.shoes ? 'Giày' : '',
                                                    fullSetOptions.jewelry ? 'Trang sức' : '',
                                                    fullSetOptions.bag ? 'Túi' : ''
                                                ].filter(Boolean).join(', ') || 'Chưa chọn'}
                                            </li>
                                        </ul>
                                    )}

                                    <div className="generation-settings-summary">
                                        {generationSettings.changePose ? '✅ Tư thế mới' : '🔒 Giữ tư thế'} • 
                                        {generationSettings.transparentBackground ? '✅ Nền trắng' : (generationSettings.changeBackground ? ' ✅ Bối cảnh mới' : ' 🔒 Giữ nền')} • 
                                        {generationSettings.generateFullBody ? ' ✅ Toàn thân' : ' 🔒 Giữ khung'} •
                                        {generationSettings.aspectRatio === '9:16' ? ' 📱 Dọc (9:16)' : ' 💻 Ngang (16:9)'}
                                    </div>
                                </div>

                                <button 
                                    className="btn btn-primary start-btn" 
                                    onClick={handleGenerateTryOn} 
                                    disabled={
                                        isGenerating || 
                                        !modelFile || 
                                        (tryOnMode === 'mix' && !dressImage && !topImage && !bottomImage && !shoesImage && !jewelryImage && !bagImage) ||
                                        (tryOnMode === 'full' && (!fullOutfitFile || Object.values(fullSetOptions).every(v => !v)))
                                    }
                                >
                                    ✨ {isGenerating ? 'Đang mặc đồ...' : 'Bắt đầu ghép đồ'}
                                </button>
                            </div>
                        </section>

                        {(finalImage || isGenerating) && (
                            <section className="step-card full-width">
                                <h2><span className="step-number">✨</span> Kết Quả</h2>
                                <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                    {isGenerating ? (
                                        <div style={{textAlign: 'center'}}>
                                            <div className="spinner"></div>
                                            <p style={{ marginTop: '15px', color: '#a1a1aa' }}>Đang xử lý hình ảnh...</p>
                                        </div>
                                    ) : (
                                        finalImage && (
                                            <div style={{ width: '100%', textAlign: 'center' }}>
                                                <img src={finalImage} alt="Result" style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }} />
                                                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                    <a href={finalImage} download="result.png" className="btn btn-primary" style={{textDecoration: 'none'}}>💾 Tải về</a>
                                                    <button className="btn btn-secondary" onClick={() => setFinalImage(null)}>🔄 Làm lại</button>
                                                    <button 
                                                        className="btn" 
                                                        style={{ background: '#f59e0b', color: 'white' }}
                                                        onClick={() => handleTransferToSkinFix(finalImage)}
                                                    >
                                                        ✨ Fix da nhựa
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        )}
                    </main>
                </>
            )}

            {activeTab === 'fix-skin' && (
                <div className="workflow-container">
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setActiveTab('try-on')}
                        style={{alignSelf: 'flex-start', marginBottom: '1rem'}}
                    >
                        ← Quay lại Try-On
                    </button>
                    <section className="step-card full-width">
                        <h2><span className="step-number">✨</span> Fix Da Nhựa (Skin Enhancer)</h2>
                        <div className="dual-upload-container" style={{alignItems: 'start'}}>
                            <div className="upload-box">
                                <h3 style={{color: '#a1a1aa', marginBottom: '10px', fontSize: '1rem'}}>Ảnh Gốc</h3>
                                <ImageUploader
                                    image={skinFixInputImage}
                                    onImageSelect={(e) => handleLocalImageUpload(e, setSkinFixInputImage, setSkinFixResultImage)}
                                    onRemove={() => { setSkinFixInputImage(null); setSkinFixResultImage(null); }}
                                >
                                    <p>Tải ảnh để fix da</p>
                                </ImageUploader>
                                {skinFixInputImage && !isFixingSkin && !skinFixResultImage && (
                                     <button 
                                        className="btn btn-primary" 
                                        style={{width: '100%', marginTop: '10px'}}
                                        onClick={() => processSkinFix(skinFixInputImage)}
                                     >
                                        Bắt đầu Fix Da
                                     </button>
                                )}
                            </div>
                            <div className="upload-box">
                                <h3 style={{color: '#a1a1aa', marginBottom: '10px', fontSize: '1rem'}}>Kết Quả</h3>
                                {isFixingSkin ? (
                                    <div style={{textAlign: 'center', padding: '40px'}}>
                                        <div className="spinner"></div>
                                        <p style={{marginTop: '15px', color: '#888'}}>Đang tái tạo bề mặt da...</p>
                                    </div>
                                ) : skinFixResultImage ? (
                                    <div>
                                        <img src={skinFixResultImage} style={{width: '100%', borderRadius: '8px'}} alt="Fixed" />
                                        <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                            <a href={skinFixResultImage} download="fixed_skin.png" className="btn btn-primary" style={{textDecoration: 'none'}}>💾 Tải về</a>
                                             <button 
                                                className="btn" 
                                                style={{ background: 'linear-gradient(to right, #c084fc, #e879f9)', color: 'black', border: 'none', fontWeight: 600 }}
                                                onClick={() => handleTransferToBreastLift(skinFixResultImage)}
                                            >
                                                👙 AI Nâng Ngực
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                                        Chưa có kết quả
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            )}
            
            {activeTab === 'breast-lift' && (
                <div className="workflow-container">
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setActiveTab('try-on')}
                        style={{alignSelf: 'flex-start', marginBottom: '1rem'}}
                    >
                        ← Quay lại Try-On
                    </button>
                    <section className="step-card full-width">
                         <h2><span className="step-number">👙</span> AI Nâng Ngực (Body Enhancer)</h2>
                         <div className="dual-upload-container" style={{alignItems: 'start'}}>
                            <div className="upload-box">
                                <h3 style={{color: '#a1a1aa', marginBottom: '10px', fontSize: '1rem'}}>Ảnh Gốc</h3>
                                <ImageUploader
                                    image={breastLiftInputImage}
                                    onImageSelect={(e) => handleLocalImageUpload(e, setBreastLiftInputImage, setBreastLiftResultImage)}
                                    onRemove={() => { setBreastLiftInputImage(null); setBreastLiftResultImage(null); }}
                                >
                                    <p>Tải ảnh để nâng ngực</p>
                                </ImageUploader>
                                {breastLiftInputImage && !isLiftingBreast && !breastLiftResultImage && (
                                     <button 
                                        className="btn btn-primary" 
                                        style={{width: '100%', marginTop: '10px'}}
                                        onClick={() => processBreastLift(breastLiftInputImage)}
                                     >
                                        Bắt đầu Nâng Ngực
                                     </button>
                                )}
                            </div>
                            <div className="upload-box">
                                <h3 style={{color: '#a1a1aa', marginBottom: '10px', fontSize: '1rem'}}>Kết Quả</h3>
                                {isLiftingBreast ? (
                                    <div style={{textAlign: 'center', padding: '40px'}}>
                                        <div className="spinner"></div>
                                        <p style={{marginTop: '15px', color: '#888'}}>Đang chỉnh sửa hình thể...</p>
                                    </div>
                                ) : breastLiftResultImage ? (
                                    <div>
                                        <img src={breastLiftResultImage} style={{width: '100%', borderRadius: '8px'}} alt="Lifted" />
                                        <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                            <a href={breastLiftResultImage} download="body_enhanced.png" className="btn btn-primary" style={{textDecoration: 'none'}}>💾 Tải về</a>
                                            <button 
                                                className="btn btn-secondary" 
                                                onClick={() => {
                                                    if (breastLiftResultImage) {
                                                        const newImage = breastLiftResultImage;
                                                        setBreastLiftInputImage(newImage);
                                                        setBreastLiftResultImage(null);
                                                        processBreastLift(newImage);
                                                    }
                                                }}
                                            >
                                                🔄 Nâng tiếp
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                                        Chưa có kết quả
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);