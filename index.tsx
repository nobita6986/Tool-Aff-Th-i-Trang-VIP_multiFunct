import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- UTILS ---

// Tooltip Component
const Tooltip = ({ text, children, style }: { text: string; children?: React.ReactNode; style?: React.CSSProperties }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div 
            className="tooltip-container" 
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            style={style}
        >
            {children}
            {isVisible && (
                <div className="tooltip-bubble">
                    {text}
                </div>
            )}
        </div>
    );
};

// Helper: Remove solid background via Flood Fill from corners
// This assumes the background is nearly white and contiguous from the corners.
const removeBackground = async (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(imageSrc); return; }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const w = canvas.width;
            const h = canvas.height;

            // We'll use a flood fill from 4 corners
            const stack: [number, number][] = [];
            const visited = new Uint8Array(w * h); // 0 = unvisited, 1 = visited

            // Threshold for "White" (or background color)
            // AI generated white might have slight noise, so we use a threshold.
            // 240/255 is safe for "Pure White" prompts.
            const threshold = 230; 

            // Helper to check if pixel is "background-like" (very bright/white)
            const isBackground = (idx: number) => {
                const r = data[idx];
                const g = data[idx+1];
                const b = data[idx+2];
                return r > threshold && g > threshold && b > threshold;
            };

            // Add corners to stack if they look like background
            const corners = [[0,0], [w-1, 0], [0, h-1], [w-1, h-1]];
            for(const [cx, cy] of corners) {
                const idx = (cy * w + cx) * 4;
                if(isBackground(idx)) {
                    stack.push([cx, cy]);
                    visited[cy * w + cx] = 1;
                }
            }

            // Flood Fill (DFS)
            while(stack.length > 0) {
                const [x, y] = stack.pop()!;
                const idx = (y * w + x) * 4;
                
                // Make pixel transparent
                data[idx + 3] = 0; 

                // Check Neighbors (4-way)
                const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
                for(const [nx, ny] of neighbors) {
                    if(nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const nPos = ny * w + nx;
                        if(visited[nPos] === 0) {
                            const nIdx = nPos * 4;
                            if(isBackground(nIdx)) {
                                visited[nPos] = 1;
                                stack.push([nx, ny]);
                            }
                        }
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(imageSrc); // Fallback to original on error
        img.src = imageSrc;
    });
};

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
    const [showGuide, setShowGuide] = useState(false);
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

    // --- UTILS FOR APP ---
    const getDownloadFileName = (prefix: string) => {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        return `${prefix}_${timeStr}.png`;
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
            
            // 1. Model Image (The most critical input)
            if (modelFile) {
                const modelB64 = await fileToBase64(modelFile);
                parts.push({ text: "IMAGE A [TARGET MODEL]: This is the PRIMARY image. You must preserve the identity (face), body shape, and skin tone of this person." });
                parts.push({
                    inlineData: {
                        mimeType: modelFile.type,
                        data: modelB64
                    }
                });
            }

            // 2. Clothing Image(s)
            if (tryOnMode === 'full' && fullOutfitFile) {
                const outfitB64 = await fileToBase64(fullOutfitFile);
                parts.push({ text: "IMAGE B [CLOTHING SOURCE]: Extract the garment design, texture, and details from this image. Do NOT use the person/face from this image." });
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
                        parts.push({ text: `IMAGE [REFERENCE OUTFIT ${i+1}]: Auxiliary reference for the clothing details in IMAGE B.` });
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
                        parts.push({ text: `IMAGE [CLOTHING ITEM - ${key.toUpperCase()}]: Wear this item.` });
                        parts.push({
                            inlineData: {
                                mimeType: f.type,
                                data: b64
                            }
                        });
                    }
                }
            }

            // 3. Construct the Master Prompt
            let textPrompt = "TASK: Professional Virtual Try-On & Photorealistic Compositing.\n";
            textPrompt += "ACTION: Dress the person in IMAGE A [TARGET MODEL] with the clothing from IMAGE B (or the provided clothing items).\n\n";

            textPrompt += "🔴 STRICT IDENTITY & ANATOMY RULES (HIGHEST PRIORITY):\n";
            textPrompt += "1. **FACE INTEGRITY**: You MUST keep the face of the person in IMAGE A exactly as is. **Do NOT swap faces.** Do NOT morph the face with IMAGE B. The output face must be indistinguishable from IMAGE A.\n";
            textPrompt += "2. **BODY SHAPE**: Preserve the exact body proportions, height, and weight of the person in IMAGE A. Do not make them thinner or curvier unless explicitly asked.\n";
            textPrompt += "3. **SKIN TONE**: Maintain the exact skin tone and texture of the person in IMAGE A.\n\n";

            textPrompt += "🔵 CLOTHING INTEGRATION:\n";
            textPrompt += "- Warp and fit the clothing from IMAGE B naturally onto the body of IMAGE A.\n";
            textPrompt += "- Preserve realistic fabric folds, textures, and lighting from the clothing source.\n";
            
            if (tryOnMode === 'full') {
                 const activeOptions = Object.entries(fullSetOptions)
                    .filter(([_, active]) => active)
                    .map(([key]) => key);
                
                if (activeOptions.length > 0) {
                     textPrompt += `- **TARGETED REPLACEMENT**: ONLY replace the [${activeOptions.join(', ')}]. Keep other original items (hair accessories, etc.) from IMAGE A if they don't conflict.\n`;
                }
            }

            textPrompt += "\n🟢 GENERATION SETTINGS:\n";
            
            // POSE LOGIC
            if (generationSettings.changePose) {
                textPrompt += "- **POSE**: Generate a NEW dynamic, fashion-forward pose. However, the FACE and BODY ID must still match IMAGE A.\n";
            } else {
                textPrompt += "- **POSE**: **STRICTLY PRESERVE** the original pose, arm placement, and head angle of IMAGE A. This acts like an advanced inpainting task.\n";
            }
            
            // BACKGROUND LOGIC
            if (generationSettings.transparentBackground) {
                textPrompt += "- **BACKGROUND**: **SOLID WHITE (Hex #FFFFFF)**. CRITICAL: Render on a flat white background. NO shadows, NO floor reflections, NO noise. This is for background removal.\n";
            } else if (generationSettings.changeBackground) {
                textPrompt += "- **BACKGROUND**: Place the subject in a completely new, high-end professional studio setting (soft lighting, neutral tones).\n";
            } else {
                textPrompt += "- **BACKGROUND**: Keep the original background from IMAGE A exactly as is.\n";
            }

            // FULL BODY LOGIC
            if (generationSettings.generateFullBody) {
                textPrompt += "- **FRAMING**: FULL BODY. If IMAGE A is a crop, realistically generate the missing legs/shoes to match the style.\n";
            } else {
                textPrompt += "- **FRAMING**: Maintain the exact cropping and aspect ratio of IMAGE A.\n";
            }

            textPrompt += `\nOutput Aspect Ratio: ${generationSettings.aspectRatio}.`;
            textPrompt += "\nStyle: 8k resolution, Photorealistic, Commercial Fashion Photography, High Detail.";

            parts.push({ text: textPrompt });

            // Use Rotation
            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const modelName = 'gemini-2.5-flash-image';
                
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: { parts: parts },
                });

                let finalUrl: string | null = null;
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            finalUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            break;
                        }
                    }
                }

                if (!finalUrl) {
                        const extraText = response.text ? ` (AI Refusal: ${response.text})` : "";
                        throw new Error("AI không trả về ảnh" + extraText); 
                }
                
                // Post-process transparency
                if (generationSettings.transparentBackground) {
                    finalUrl = await removeBackground(finalUrl);
                }

                setFinalImage(finalUrl);
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
                
                <div className="header-actions">
                    <button 
                        className="settings-btn"
                        onClick={() => setShowSettings(true)}
                    >
                        <span style={{fontSize: '1.2rem'}}>⚙️</span>
                        <span>Cài đặt API</span>
                    </button>
                    <button 
                        className="guide-btn"
                        onClick={() => setShowGuide(true)}
                    >
                        <span style={{fontSize: '1.2rem'}}>📖</span>
                        <span>Hướng dẫn</span>
                    </button>
                </div>
                {activeProvider !== 'gemini' && (
                    <div style={{marginTop: '0px', color: '#f59e0b', fontSize: '0.9rem'}}>
                        ⚠️ Đang dùng: {activeProvider.toUpperCase()} (Chưa hỗ trợ tạo ảnh)
                    </div>
                )}

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

            {/* --- GUIDE MODAL --- */}
            {showGuide && (
                <div className="modal-overlay">
                    <div className="modal-content settings-modal-wide">
                        <div className="modal-header">
                            <h3>Hướng dẫn sử dụng & Giới thiệu</h3>
                            <button className="modal-close" onClick={() => setShowGuide(false)}>×</button>
                        </div>
                        <div className="modal-main guide-content">
                            <div className="guide-features">
                                <div className="feature-box">
                                    <strong>Công nghệ Đột phá</strong>
                                    Sử dụng AI Generative mới nhất để hiểu sâu về cấu trúc trang phục và cơ thể người.
                                </div>
                                <div className="feature-box">
                                    <strong>Bảo toàn Danh tính</strong>
                                    Thuật toán "Identity Preservation" giúp giữ nguyên khuôn mặt và vóc dáng mẫu gốc.
                                </div>
                                <div className="feature-box">
                                    <strong>Xử lý Đa chiều</strong>
                                    Hỗ trợ thay đổi tư thế (Pose), bối cảnh, và tự động xóa phông nền (Alpha channel).
                                </div>
                            </div>

                            <div className="guide-section">
                                <h4>1. Virtual Try-On (Thử đồ ảo)</h4>
                                <ul>
                                    <li><strong>Full Set:</strong> Dành cho khi bạn có ảnh chụp sẵn một bộ đồ hoàn chỉnh (trải sàn hoặc ma-nơ-canh) và muốn ướm lên mẫu.</li>
                                    <li><strong>Mix & Match:</strong> Dành cho khi bạn muốn phối các món đồ lẻ (áo, quần, giày...) lại với nhau.</li>
                                    <li><strong>Lưu ý:</strong> Ảnh mẫu nên rõ mặt và chụp chính diện để có kết quả tốt nhất.</li>
                                </ul>
                            </div>

                            <div className="guide-section">
                                <h4>2. Fix Da Nhựa (Skin Enhancer)</h4>
                                <ul>
                                    <li>Công cụ chuyên dụng để xử lý các ảnh AI bị lỗi da "bóng loáng" hoặc "giả trân".</li>
                                    <li>AI sẽ tái tạo lại lỗ chân lông, thêm hạt (grain) và điều chỉnh ánh sáng để da trông như chụp bằng máy ảnh thật.</li>
                                </ul>
                            </div>

                             <div className="guide-section">
                                <h4>3. AI Nâng Ngực (Body Enhancer)</h4>
                                <ul>
                                    <li>Tự động nhận diện vùng ngực và điều chỉnh kích thước tự nhiên.</li>
                                    <li>AI tự động tính toán độ căng của vải và bóng đổ để đảm bảo tính vật lý chân thực.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                        <Tooltip text="Chế độ thay toàn bộ trang phục từ một ảnh duy nhất.">
                            <button 
                                className={`btn ${tryOnMode === 'full' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => { setTryOnMode('full'); setError(null); }}
                            >
                                ✨ Full Set (Nguyên Bộ)
                            </button>
                        </Tooltip>
                        <Tooltip text="Chế độ phối hợp nhiều món đồ lẻ (áo, quần, giày...) lên người mẫu.">
                            <button 
                                className={`btn ${tryOnMode === 'mix' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => { setTryOnMode('mix'); setError(null); }}
                            >
                                🧩 Mix & Match (Lẻ)
                            </button>
                        </Tooltip>
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
                                                    <Tooltip text="Ảnh chứa bộ đồ bạn muốn mặc thử. Có thể là ảnh trải sàn hoặc ma-nơ-canh.">
                                                        <ImageUploader
                                                            label="1. Ảnh Set Đồ (Chính)"
                                                            image={fullOutfitPreview}
                                                            onImageSelect={(e) => handleFileChange(e, setFullOutfitFile, setFullOutfitPreview)}
                                                            onRemove={() => { setFullOutfitFile(null); setFullOutfitPreview(null); }}
                                                        >
                                                            <p>Tải ảnh chứa nguyên set đồ</p>
                                                        </ImageUploader>
                                                    </Tooltip>

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
                                                    <Tooltip text="Ảnh người mẫu sẽ mặc thử đồ. Khuôn mặt và vóc dáng sẽ được giữ nguyên.">
                                                        <ImageUploader
                                                            label="2. Ảnh Người Mẫu"
                                                            image={modelPreview}
                                                            onImageSelect={(e) => handleFileChange(e, setModelFile, setModelPreview)}
                                                            onRemove={() => { setModelFile(null); setModelPreview(null); }}
                                                        >
                                                            <p>Tải ảnh người mẫu</p>
                                                        </ImageUploader>
                                                    </Tooltip>
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
                                                                    <Tooltip text="Phù hợp cho Story/Reels/Tiktok.">
                                                                        <button 
                                                                            className={`option-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`}
                                                                            onClick={() => setAspectRatio('9:16')}
                                                                        >
                                                                            📱 Dọc (9:16)
                                                                        </button>
                                                                    </Tooltip>
                                                                    <Tooltip text="Phù hợp cho bài đăng Facebook/Web.">
                                                                        <button 
                                                                            className={`option-btn ${generationSettings.aspectRatio === '16:9' ? 'active' : ''}`}
                                                                            onClick={() => setAspectRatio('16:9')}
                                                                        >
                                                                            💻 Ngang (16:9)
                                                                        </button>
                                                                    </Tooltip>
                                                                </div>

                                                                <div className="settings-grid-2col">
                                                                    <Tooltip text="AI sẽ tự sáng tạo tư thế mới dựa trên trang phục. Tắt để giữ nguyên dáng đứng cũ.">
                                                                        <button 
                                                                            className={`option-btn ${generationSettings.changePose ? 'active' : ''}`}
                                                                            onClick={() => toggleGenerationSetting('changePose')}
                                                                        >
                                                                            <span>💃 Đổi tư thế</span>
                                                                            {generationSettings.changePose && <span>✓</span>}
                                                                        </button>
                                                                    </Tooltip>
                                                                    
                                                                    <Tooltip text="Nếu ảnh gốc bị cắt chân, AI sẽ tự vẽ thêm để thành ảnh toàn thân.">
                                                                        <button 
                                                                            className={`option-btn ${generationSettings.generateFullBody ? 'active' : ''}`}
                                                                            onClick={() => toggleGenerationSetting('generateFullBody')}
                                                                        >
                                                                            <span>🧍 Toàn thân</span>
                                                                            {generationSettings.generateFullBody && <span>✓</span>}
                                                                        </button>
                                                                    </Tooltip>

                                                                    <Tooltip text="Thay thế nền cũ bằng studio chuyên nghiệp hoặc bối cảnh phù hợp.">
                                                                        <button 
                                                                            className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`}
                                                                            onClick={() => toggleGenerationSetting('changeBackground')}
                                                                            disabled={generationSettings.transparentBackground}
                                                                            style={generationSettings.transparentBackground ? {opacity: 0.5} : {}}
                                                                        >
                                                                            <span>🏞️ Đổi nền</span>
                                                                            {generationSettings.changeBackground && !generationSettings.transparentBackground && <span>✓</span>}
                                                                        </button>
                                                                    </Tooltip>

                                                                    <Tooltip text="Tách nền, tạo ra ảnh PNG trong suốt. Rất tiện để ghép vào thiết kế khác.">
                                                                        <button 
                                                                            className={`option-btn ${generationSettings.transparentBackground ? 'active' : ''}`}
                                                                            onClick={() => toggleGenerationSetting('transparentBackground')}
                                                                        >
                                                                            <span>🔳 Nền rỗng</span>
                                                                            {generationSettings.transparentBackground && <span>✓</span>}
                                                                        </button>
                                                                    </Tooltip>
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
                                                    <a href={finalImage} download={getDownloadFileName('try-on')} className="btn btn-primary" style={{textDecoration: 'none'}}>💾 Tải về</a>
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
                                            <a href={skinFixResultImage} download={getDownloadFileName('fix-skin')} className="btn btn-primary" style={{textDecoration: 'none'}}>💾 Tải về</a>
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
                                            <a href={breastLiftResultImage} download={getDownloadFileName('breast-lift')} className="btn btn-primary" style={{textDecoration: 'none'}}>💾 Tải về</a>
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