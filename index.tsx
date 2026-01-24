import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// Component definitions to fix missing component errors
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

const App = () => {
    // State definitions to fix missing variable errors
    const [apiKey, setApiKey] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    
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
        generateFullBody: false
    });

    // Load API Key on Mount
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        } else if (process.env.API_KEY) {
            setApiKey(process.env.API_KEY);
        }
    }, []);

    const saveApiKey = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setShowSettings(false);
        setError(null);
    };

    // Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void, setPreview: (s: string | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setPreview: (s: string | null) => void, setResult: (s: string | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (typeof ev.target?.result === 'string') {
                    setPreview(ev.target.result);
                    setResult(null); // Reset result when new image is uploaded
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
        setGenerationSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
                    // Extract base64 data only
                    resolve(reader.result.split(',')[1]);
                } else {
                    reject(new Error("Failed to read file"));
                }
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleGenerateTryOn = async () => {
        if (!apiKey) {
            setError("Vui lòng nhập API Key trong phần Cài đặt AI để tiếp tục.");
            setShowSettings(true);
            return;
        }

        setIsGenerating(true);
        setFinalImage(null);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const modelName = 'gemini-2.5-flash-image'; 
            
            const parts: any[] = [];
            
            // Add Model Image
            if (modelFile) {
                const modelB64 = await fileToBase64(modelFile);
                parts.push({
                    inlineData: {
                        mimeType: modelFile.type,
                        data: modelB64
                    }
                });
                parts.push({ text: "This is the model." });
            }

            // Add Garment Images
            if (tryOnMode === 'full' && fullOutfitFile) {
                const outfitB64 = await fileToBase64(fullOutfitFile);
                parts.push({
                    inlineData: {
                        mimeType: fullOutfitFile.type,
                        data: outfitB64
                    }
                });
                parts.push({ text: "This is the outfit to try on." });
            } else if (tryOnMode === 'mix') {
                for (const [key, file] of Object.entries(mixFiles)) {
                    if (file) {
                        const f = file as File;
                        const b64 = await fileToBase64(f);
                        parts.push({
                            inlineData: {
                                mimeType: f.type,
                                data: b64
                            }
                        });
                        parts.push({ text: `This is the ${key}.` });
                    }
                }
            }

            // Prompt Construction
            let prompt = "Generate a photorealistic image of the model wearing the provided garments.";
            
            if (tryOnMode === 'full') {
                const activeOptions = Object.entries(fullSetOptions)
                    .filter(([_, active]) => active)
                    .map(([key]) => key);
                if (activeOptions.length > 0) {
                    prompt += ` Specifically replace the ${activeOptions.join(', ')} on the model with the ones from the outfit image.`;
                } else {
                    prompt += " Replace the outfit on the model with the provided outfit.";
                }
            } else {
                prompt += " Mix and match the provided individual garments onto the model naturally.";
            }

            if (generationSettings.changePose) prompt += " Change the pose of the model.";
            if (generationSettings.changeBackground) prompt += " Change the background.";
            if (generationSettings.generateFullBody) prompt += " Ensure the full body is visible.";
            prompt += ` Aspect ratio should be ${generationSettings.aspectRatio}.`;

            parts.push({ text: prompt });

            const response = await ai.models.generateContent({
                model: modelName,
                contents: { parts: parts },
            });

            // Handle response
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

            if (!foundImage && response.text) {
                 console.log("Response text:", response.text);
                 if (!foundImage) setError("AI trả về phản hồi dạng văn bản thay vì ảnh. Vui lòng thử lại.");
            }

        } catch (err: any) {
            console.error("Generation error:", err);
            setError("Lỗi tạo ảnh: " + (err.message || "Vui lòng kiểm tra API Key."));
        } finally {
            setIsGenerating(false);
        }
    };

    // Refactored process logic to be reusable
    const processSkinFix = async (imageSrc: string) => {
        if (!apiKey) {
            setError("Vui lòng nhập API Key để sử dụng tính năng này.");
            setShowSettings(true);
            return;
        }

        setIsFixingSkin(true);
        setError(null);
        setSkinFixResultImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const modelName = 'gemini-2.5-flash-image'; 

            const base64Data = imageSrc.split(',')[1];
            const mimeType = imageSrc.match(/data:(.*?);base64/)?.[1] || 'image/png';

            const parts = [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                },
                { text: "Enhance the skin texture of the person in this image to look more photorealistic and natural. Remove any plastic-like smoothing or artificial blur. Add realistic skin pores and texture details. Keep the outfit, background, and identity exactly the same. Output high quality image." }
            ];

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
                 setError("Không thể xử lý ảnh. Vui lòng thử lại.");
             }

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
        // Auto start workflow
        await processSkinFix(imageSrc);
    };

    // Refactored process logic to be reusable
    const processBreastLift = async (imageSrc: string) => {
        if (!apiKey) {
            setError("Vui lòng nhập API Key để sử dụng tính năng này.");
            setShowSettings(true);
            return;
        }

        setIsLiftingBreast(true);
        setError(null);
        setBreastLiftResultImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const modelName = 'gemini-2.5-flash-image'; 

            const base64Data = imageSrc.split(',')[1];
            const mimeType = imageSrc.match(/data:(.*?);base64/)?.[1] || 'image/png';

            const parts = [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                },
                { text: "Enhance the person's figure by slightly lifting and adding fullness to the chest area for a more aesthetic and attractive look, ensuring it looks natural. Keep the face, skin texture, outfit details, and background exactly unchanged." }
            ];

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
                 setError("Không thể xử lý ảnh. Vui lòng thử lại.");
             }

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
        // Auto start workflow
        await processBreastLift(imageSrc);
    };

    return (
        <div className="container">
            {/* --- RESTORED HEADER --- */}
            <header className="main-header">
                <h1 className="app-title">AI Studio VIP</h1>
                <p className="app-subtitle">Bộ công cụ xử lý ảnh chuyên nghiệp</p>
                <div style={{marginBottom: '20px'}}>
                    <button 
                        className="settings-btn"
                        onClick={() => setShowSettings(true)}
                    >
                        ⚙️ Cài đặt AI
                    </button>
                </div>
                
                <nav className="main-nav">
                    <button 
                        className={`nav-item ${activeTab === 'try-on' ? 'active' : ''}`}
                        onClick={() => setActiveTab('try-on')}
                    >
                        👗 Virtual Try-On
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'fix-skin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('fix-skin')}
                    >
                        ✨ Fix Da Nhựa
                    </button>
                    <button 
                        className={`nav-item special-item ${activeTab === 'breast-lift' ? 'active' : ''}`}
                        onClick={() => setActiveTab('breast-lift')}
                    >
                        👙 AI Nâng Ngực
                    </button>
                </nav>
            </header>

             {error && <div className="error-message">{error}</div>}
             
             {/* Settings Modal */}
            {showSettings && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Cài đặt API Key</h3>
                        <p style={{color: '#aaa', fontSize: '0.9rem', marginBottom: '15px'}}>
                            Nhập Google Gemini API Key của bạn để sử dụng. Key sẽ được lưu trên trình duyệt của bạn.
                        </p>
                        <input 
                            type="password" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Nhập API Key (bắt đầu bằng AIza...)"
                            className="api-input"
                        />
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Đóng</button>
                            <button className="btn btn-primary" onClick={saveApiKey}>Lưu & Áp dụng</button>
                        </div>
                        <p style={{marginTop: '15px', fontSize: '0.8rem'}}>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" style={{color: '#60a5fa', textDecoration: 'none'}}>👉 Lấy API Key miễn phí tại đây</a>
                        </p>
                    </div>
                </div>
            )}

             {activeTab === 'try-on' && (
                <>
                    {/* Global Mode Switcher for Try-On */}
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
                            /* --- FULL MODE LAYOUT --- */
                            <>
                                <section className="step-card full-width">
                                    <h2><span className="step-number">1</span> Cấu hình & Dữ liệu</h2>
                                    <div className="garment-source-container">
                                        <div className="full-mode-container">
                                            {/* 1. Images Row: Outfit + Model Side by Side */}
                                            <div className="dual-upload-container">
                                                <div className="upload-box">
                                                    <ImageUploader
                                                        label="1. Ảnh Set Đồ"
                                                        image={fullOutfitPreview}
                                                        onImageSelect={(e) => handleFileChange(e, setFullOutfitFile, setFullOutfitPreview)}
                                                        onRemove={() => { setFullOutfitFile(null); setFullOutfitPreview(null); }}
                                                    >
                                                        <p>Tải ảnh chứa nguyên set đồ</p>
                                                    </ImageUploader>
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
                                            
                                            {/* 2. Settings Row */}
                                            <div className="settings-panel">
                                                <div className="settings-columns">
                                                    {/* Item Selection Group */}
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

                                                    {/* Advanced Settings Group */}
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

                                                                <button 
                                                                    className={`option-btn ${generationSettings.changePose ? 'active' : ''}`}
                                                                    onClick={() => toggleGenerationSetting('changePose')}
                                                                >
                                                                    <span>💃 Thay đổi tư thế</span>
                                                                    {generationSettings.changePose && <span>✓</span>}
                                                                </button>
                                                                <button 
                                                                    className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`}
                                                                    onClick={() => toggleGenerationSetting('changeBackground')}
                                                                >
                                                                    <span>🏞️ Đổi bối cảnh</span>
                                                                    {generationSettings.changeBackground && <span>✓</span>}
                                                                </button>
                                                                <button 
                                                                    className={`option-btn ${generationSettings.generateFullBody ? 'active' : ''}`}
                                                                    onClick={() => toggleGenerationSetting('generateFullBody')}
                                                                >
                                                                    <span>🧍 Tạo ảnh toàn thân</span>
                                                                    {generationSettings.generateFullBody && <span>✓</span>}
                                                                </button>
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
                            /* --- MIX MODE LAYOUT (Reordered) --- */
                            <>
                                {/* Step 1: Model (Moved to Top) */}
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

                                {/* Step 2: Items (Smaller Grid) */}
                                <section className="step-card full-width">
                                    <h2><span className="step-number">2</span> Chọn Đồ Mix & Match</h2>
                                    <div className="mix-mode-grid">
                                        <p className="section-desc">
                                            Tải lên các món đồ riêng lẻ bạn muốn mặc cho người mẫu.
                                        </p>
                                        
                                        <div className="extracted-items">
                                            {/* Row 1: Main Clothes */}
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

                                            {/* Row 2: Accessories */}
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

                                        {/* Mix Mode Advanced Options */}
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

                                                <button 
                                                    className={`option-btn ${generationSettings.changePose ? 'active' : ''}`}
                                                    onClick={() => toggleGenerationSetting('changePose')}
                                                >
                                                    💃 Thay đổi tư thế
                                                </button>
                                                <button 
                                                    className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`}
                                                    onClick={() => toggleGenerationSetting('changeBackground')}
                                                >
                                                    🏞️ Đổi bối cảnh
                                                </button>
                                                <button 
                                                    className={`option-btn ${generationSettings.generateFullBody ? 'active' : ''}`}
                                                    onClick={() => toggleGenerationSetting('generateFullBody')}
                                                >
                                                    🧍 Tạo ảnh toàn thân
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* Step 3: Finalize (Common for both, Full Width) */}
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
                                        {generationSettings.changeBackground ? ' ✅ Bối cảnh mới' : ' 🔒 Giữ nền'} • 
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

                        {/* Result Section */}
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