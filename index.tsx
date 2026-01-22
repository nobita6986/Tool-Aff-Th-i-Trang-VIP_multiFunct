
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Types ---
type Provider = 'gemini' | 'openai' | 'grok';

interface ApiSettings {
    provider: Provider;
    keys: {
        gemini: string;
        openai: string;
        grok: string;
    };
    models: {
        gemini: string;
        openai: string;
        grok: string;
    };
}

// --- Constants ---
const DEFAULT_SETTINGS: ApiSettings = {
    provider: 'gemini',
    keys: {
        gemini: process.env.API_KEY || '', // Fallback to env if available
        openai: '',
        grok: ''
    },
    models: {
        gemini: 'gemini-3-pro-image-preview',
        openai: 'gpt-5.2',
        grok: 'grok-4-1-fast-reasoning'
    }
};

const MODEL_OPTIONS = {
    gemini: [
        { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image (Nano Banana Pro - Chuyên Ảnh)' },
        { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Mạnh nhất - Suy luận & Code)' },
        { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Tối ưu tốc độ & Chi phí)' }
    ],
    openai: [
        { value: 'gpt-5.2', label: 'GPT-5.2 (Flagship 12/2025)' },
        { value: 'gpt-5.2-pro', label: 'GPT-5.2 Pro (Doanh nghiệp - Chính xác cao)' },
        { value: 'gpt-5.1', label: 'GPT-5.1 (Stable - Ổn định)' },
        { value: 'gpt-5-mini', label: 'GPT-5 mini (Nhanh, rẻ)' },
        { value: 'gpt-5-nano', label: 'GPT-5 nano (Siêu nhỏ, chi phí thấp)' }
    ],
    grok: [
        { value: 'grok-4-1-fast-reasoning', label: 'Grok 4.1 Fast (Reasoning - Suy luận sâu)' },
        { value: 'grok-4-1-fast-non-reasoning', label: 'Grok 4.1 Fast (Instant - Tốc độ cao)' }
    ]
};

// --- Helper Functions ---
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const urlToGenerativePart = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
    });
    return {
        inlineData: { data: base64, mimeType: blob.type },
    };
};

// --- Components ---

// Settings Modal Component
const SettingsModal = ({ 
    isOpen, 
    onClose, 
    settings, 
    onSave 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    settings: ApiSettings; 
    onSave: (newSettings: ApiSettings) => void; 
}) => {
    const [localSettings, setLocalSettings] = useState<ApiSettings>(settings);

    // Sync local state when modal opens
    useEffect(() => {
        if (isOpen) setLocalSettings(settings);
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleKeyChange = (provider: Provider, value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            keys: { ...prev.keys, [provider]: value }
        }));
    };

    const handleModelChange = (provider: Provider, value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            models: { ...prev.models, [provider]: value }
        }));
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>⚙️ Cài đặt AI & API Key</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="modal-body">
                    {/* Provider Selection */}
                    <div className="form-group">
                        <label>Chọn Nhà Cung Cấp Chính (Provider):</label>
                        <div className="provider-tabs">
                            {(['gemini', 'openai', 'grok'] as Provider[]).map(p => (
                                <button
                                    key={p}
                                    className={`tab-btn small ${localSettings.provider === p ? 'active' : ''}`}
                                    onClick={() => setLocalSettings(prev => ({ ...prev, provider: p }))}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* Gemini Settings */}
                    <div className={`provider-settings ${localSettings.provider === 'gemini' ? 'active-section' : ''}`}>
                        <h3>Google Gemini (Khuyên dùng cho Try-On)</h3>
                        <div className="form-group">
                            <label>API Key:</label>
                            <input 
                                type="password" 
                                value={localSettings.keys.gemini}
                                onChange={(e) => handleKeyChange('gemini', e.target.value)}
                                placeholder="Nhập Gemini API Key..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Model:</label>
                            <select 
                                value={localSettings.models.gemini}
                                onChange={(e) => handleModelChange('gemini', e.target.value)}
                            >
                                {MODEL_OPTIONS.gemini.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* OpenAI Settings */}
                    <div className={`provider-settings ${localSettings.provider === 'openai' ? 'active-section' : ''}`}>
                        <h3>OpenAI (GPT-5 Series)</h3>
                        <div className="alert-box warning">
                            ⚠️ Lưu ý: Các model GPT-5 hỗ trợ Agentic Workflow mạnh mẽ, nhưng khả năng chỉnh sửa ảnh (Image-to-Image) trực tiếp có thể hạn chế hơn Gemini Pro Image.
                        </div>
                        <div className="form-group">
                            <label>API Key:</label>
                            <input 
                                type="password" 
                                value={localSettings.keys.openai}
                                onChange={(e) => handleKeyChange('openai', e.target.value)}
                                placeholder="sk-..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Model:</label>
                            <select 
                                value={localSettings.models.openai}
                                onChange={(e) => handleModelChange('openai', e.target.value)}
                            >
                                {MODEL_OPTIONS.openai.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Grok Settings */}
                    <div className={`provider-settings ${localSettings.provider === 'grok' ? 'active-section' : ''}`}>
                        <h3>xAI Grok</h3>
                        <div className="form-group">
                            <label>API Key:</label>
                            <input 
                                type="password" 
                                value={localSettings.keys.grok}
                                onChange={(e) => handleKeyChange('grok', e.target.value)}
                                placeholder="xai-..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Model:</label>
                            <select 
                                value={localSettings.models.grok}
                                onChange={(e) => handleModelChange('grok', e.target.value)}
                            >
                                {MODEL_OPTIONS.grok.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={() => onSave(localSettings)}>Lưu Cấu Hình</button>
                </div>
            </div>
        </div>
    );
};

const ImageUploader = ({ 
    image, 
    onImageSelect, 
    onRemove,
    children, 
    isLoading = false, 
    loadingText = '',
    label = ''
}: {
    image: string | null;
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove?: () => void;
    children?: React.ReactNode;
    isLoading?: boolean;
    loadingText?: string;
    label?: string;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAreaClick = (e: React.MouseEvent) => {
        // Prevent trigger if clicking the remove button
        if ((e.target as HTMLElement).closest('.remove-btn')) return;
        if (!isLoading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="uploader-wrapper">
            {label && <label className="uploader-label">{label}</label>}
            <div className="image-upload-area" onClick={handleAreaClick} role="button" tabIndex={0} aria-label="Image upload area">
                {image ? (
                    <>
                        <img src={image} alt="Preview" />
                        {onRemove && !isLoading && (
                            <button className="remove-btn" onClick={onRemove} title="Xóa ảnh">
                                &times;
                            </button>
                        )}
                    </>
                ) : children}
                {isLoading && (
                    <div className="loader-container">
                        <div className="spinner"></div>
                        <p>{loadingText}</p>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    className="hidden-file-input"
                    ref={fileInputRef}
                    onChange={onImageSelect}
                    disabled={isLoading}
                />
            </div>
        </div>
    );
};

const App = () => {
    // --- API Settings State ---
    const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
        // Load from local storage or use default
        const saved = localStorage.getItem('ai_studio_settings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<'try-on' | 'skin-fix' | 'breast-aug'>('try-on');

    // --- Try-On States ---
    const [tryOnMode, setTryOnMode] = useState<'mix' | 'full'>('full'); // 'mix' = Top/Bottom split, 'full' = One image set
    
    // Mix Mode States
    const [sourceGarmentFile, setSourceGarmentFile] = useState<File | null>(null);
    const [sourceGarmentPreview, setSourceGarmentPreview] = useState<string | null>(null);
    
    const [topImage, setTopImage] = useState<string | null>(null);
    const [bottomImage, setBottomImage] = useState<string | null>(null);
    const [shoesImage, setShoesImage] = useState<string | null>(null);
    
    const [isExtractingTop, setIsExtractingTop] = useState(false);
    const [isExtractingBottom, setIsExtractingBottom] = useState(false);
    const [isExtractingShoes, setIsExtractingShoes] = useState(false);

    // Full Set Mode States
    const [fullOutfitFile, setFullOutfitFile] = useState<File | null>(null);
    const [fullOutfitPreview, setFullOutfitPreview] = useState<string | null>(null);
    
    // Full Set Granular Options
    const [fullSetOptions, setFullSetOptions] = useState({
        clothing: true, // Áo, quần, váy
        shoes: true,    // Giày, dép
        jewelry: false, // Trang sức
        bag: false      // Túi xách
    });

    // General Generation Settings (For both modes)
    const [generationSettings, setGenerationSettings] = useState({
        changePose: false,      // Thay đổi tư thế
        changeBackground: false, // Đổi bối cảnh
        generateFullBody: false // Tạo ảnh toàn thân
    });

    // Common Try-On States
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Skin Fix States ---
    const [skinFile, setSkinFile] = useState<File | null>(null);
    const [skinPreview, setSkinPreview] = useState<string | null>(null);
    const [skinResult, setSkinResult] = useState<string | null>(null);
    const [isFixingSkin, setIsFixingSkin] = useState(false);

    // --- Breast Augmentation States ---
    const [breastAugFile, setBreastAugFile] = useState<File | null>(null);
    const [breastAugPreview, setBreastAugPreview] = useState<string | null>(null);
    const [breastAugResult, setBreastAugResult] = useState<string | null>(null);
    const [isBreastAugmenting, setIsBreastAugmenting] = useState(false);

    // --- Common States ---
    const [error, setError] = useState<string | null>(null);
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

    // Handle Settings Save
    const handleSaveSettings = (newSettings: ApiSettings) => {
        setApiSettings(newSettings);
        localStorage.setItem('ai_studio_settings', JSON.stringify(newSettings));
        setIsSettingsOpen(false);
        setError(null); // Clear errors
    };

    // Helper to check provider validity
    const checkProviderReady = () => {
        const key = apiSettings.keys[apiSettings.provider];
        if (!key) {
            setError(`Vui lòng nhập API Key cho ${apiSettings.provider.toUpperCase()} trong phần Cài đặt.`);
            setIsSettingsOpen(true);
            return false;
        }
        return true;
    };

    const handleTabChange = (tab: 'try-on' | 'skin-fix' | 'breast-aug') => {
        setActiveTab(tab);
        setError(null);
        setIsDownloadMenuOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void, setPreview: (url: string | null) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleDirectGarmentUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'top' | 'bottom' | 'shoes') => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (type === 'top') setTopImage(url);
            else if (type === 'bottom') setBottomImage(url);
            else setShoesImage(url);
            setError(null);
        }
    };

    const handleRemoveGarment = (type: 'top' | 'bottom' | 'shoes') => {
        if (type === 'top') setTopImage(null);
        else if (type === 'bottom') setBottomImage(null);
        else setShoesImage(null);
    };

    const handleExtract = async (type: 'top' | 'bottom' | 'shoes') => {
        if (!checkProviderReady()) return;
        
        if (apiSettings.provider !== 'gemini') {
            setError("Tính năng Tách đồ (Segment) hiện tại chỉ hỗ trợ tốt nhất trên Gemini.");
            return;
        }

        if (!sourceGarmentFile) {
            setError('Vui lòng tải ảnh gốc để tách trang phục.');
            return;
        }
        
        if (type === 'top') setIsExtractingTop(true);
        else if (type === 'bottom') setIsExtractingBottom(true);
        else setIsExtractingShoes(true);

        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: apiSettings.keys.gemini });
            const imagePart = await fileToGenerativePart(sourceGarmentFile);
            let prompt = '';
            
            if (type === 'top') {
                prompt = 'Extract ONLY the upper body garment (shirt, t-shirt, jacket, etc.) from this image. Place it on a completely transparent background. Remove the person and everything else.';
            } else if (type === 'bottom') {
                prompt = 'Extract ONLY the lower body garment (pants, shorts, skirt, etc.) from this image. Place it on a completely transparent background. Remove the person and everything else.';
            } else {
                prompt = 'Extract ONLY the footwear (shoes, sneakers, sandals, boots, etc.) from this image. Place it on a completely transparent background. Remove the person and everything else.';
            }

            const response = await ai.models.generateContent({
                model: apiSettings.models.gemini,
                contents: {
                    parts: [imagePart, { text: prompt }],
                },
                config: { responseModalities: [Modality.IMAGE] },
            });

            const firstPart = response.candidates?.[0]?.content?.parts?.[0];
            if (firstPart && firstPart.inlineData) {
                const imageUrl = `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
                if (type === 'top') setTopImage(imageUrl);
                else if (type === 'bottom') setBottomImage(imageUrl);
                else setShoesImage(imageUrl);
            } else {
                throw new Error(`Không thể tách ${type === 'top' ? 'áo' : type === 'bottom' ? 'quần' : 'giày'}. Thử ảnh khác rõ hơn.`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tách đồ.');
        } finally {
            if (type === 'top') setIsExtractingTop(false);
            else if (type === 'bottom') setIsExtractingBottom(false);
            else setIsExtractingShoes(false);
        }
    };

    const toggleFullSetOption = (option: keyof typeof fullSetOptions) => {
        setFullSetOptions(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };

    const toggleGenerationSetting = (option: keyof typeof generationSettings) => {
        setGenerationSettings(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };

    const handleGenerateTryOn = async () => {
        if (!checkProviderReady()) return;

        if (!modelFile) {
            setError('Vui lòng tải ảnh người mẫu.');
            return;
        }

        if (tryOnMode === 'mix' && !topImage && !bottomImage && !shoesImage) {
            setError('Vui lòng chọn ít nhất một món đồ (áo, quần hoặc giày) để thay.');
            return;
        }

        if (tryOnMode === 'full' && !fullOutfitFile) {
            setError('Vui lòng tải ảnh set đồ.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setFinalImage(null);

        try {
            // Check Provider logic
            if (apiSettings.provider !== 'gemini') {
                 // Warning/Fallback for OpenAI/Grok
                 if (apiSettings.provider === 'openai') {
                     throw new Error("Tính năng Virtual Try-On cần đầu vào nhiều ảnh để xử lý trực tiếp. OpenAI API hiện chưa hỗ trợ tốt quy trình Image-to-Image này (DALL-E 3 chỉ hỗ trợ Text-to-Image). Vui lòng chuyển sang Gemini.");
                 }
                 if (apiSettings.provider === 'grok') {
                     throw new Error("Grok hiện chưa hỗ trợ tính năng Image-to-Image Editing phức tạp này. Vui lòng chuyển sang Gemini.");
                 }
            }

            // --- Gemini Implementation ---
            const ai = new GoogleGenAI({ apiKey: apiSettings.keys.gemini });
            
            const parts: any[] = [];
            let instructions = "You are a professional fashion editor and creative director. ";

            // --- Common Instructions for Pose, Background, and Full Body ---
            const poseInstruction = generationSettings.changePose
                ? "POSE ADAPTATION: The model's pose MUST be changed. Generate a new, natural, and dynamic fashion pose that best showcases the new outfit. Do not be constrained by the original pose."
                : "POSE PRESERVATION: Keep the model's body pose, head position, and gesture identical to the original image (unless Full Body Generation requires extending the pose).";

            const backgroundInstruction = generationSettings.changeBackground
                ? "BACKGROUND GENERATION: Replace the original background completely. Generate a new, high-quality, realistic setting that matches the style of the outfit. The lighting on the model must match this new background."
                : "BACKGROUND PRESERVATION: Keep the original background EXACTLY as it is. Do not change the scene (unless Full Body Generation requires extending the background).";

            const fullBodyInstruction = generationSettings.generateFullBody
                ? "FULL BODY GENERATION: The input model image might be half-body or cropped. You MUST generate a FULL BODY output. Extrapolate legs, feet, and missing limbs naturally. Ensure the outfit (especially pants/shoes) is fully visible. Resize/outpaint as necessary to fit the full body."
                : "FRAME PRESERVATION: Keep the original framing/crop of the model image.";
            // ---------------------------------------------------

            if (tryOnMode === 'full' && fullOutfitFile) {
                const outfitPart = await fileToGenerativePart(fullOutfitFile);
                parts.push(outfitPart);
                const modelPart = await fileToGenerativePart(modelFile);
                parts.push(modelPart);

                // Build granular target list
                const targets = [];
                if (fullSetOptions.clothing) targets.push("- Main Clothing (Dress, Suit, Top & Bottom, Jacket)");
                if (fullSetOptions.shoes) targets.push("- Footwear (Shoes, Sandals, Boots)");
                if (fullSetOptions.jewelry) targets.push("- Jewelry & Accessories (Necklaces, Earrings, Glasses)");
                if (fullSetOptions.bag) targets.push("- Bags (Handbags, Purses - positioned naturally)");

                if (targets.length === 0) {
                    throw new Error("Vui lòng chọn ít nhất một mục để thay thế (Áo, Giày, Trang sức...).");
                }

                instructions += `
                ACT AS: Expert AI Virtual Stylist & Image Compositor.
                
                INPUTS:
                - Image 1: Reference Set (Contains items).
                - Image 2: Target Model.

                MISSION: Transfer SPECIFIC items from Reference to Target based on the list below. Ignore other items in the reference.

                TARGET ITEMS TO TRANSFER:
                ${targets.join('\n')}

                EXECUTION RULES FOR TARGET ITEMS:
                1. **Total Erasure & Replacement:** 
                   - If transferring CLOTHING: You MUST completely remove the model's original clothes first. DO NOT overlay. If the new item reveals skin (e.g., strapless), generate realistic skin texture/collarbones to replace the old fabric. No ghosting.
                   - If transferring SHOES: Remove old shoes entirely.
                2. **Preservation:** 
                   - If a category is NOT selected (e.g., Jewelry), KEEP the model's original item in that category (unless Pose Change is active, then adapt naturally).
                   - ALWAYS preserve Face Identity and Hair (unless covered by new hat).
                3. **Compositing & Environment:**
                   - ${poseInstruction}
                   - ${backgroundInstruction}
                   - ${fullBodyInstruction}
                   - Fit items naturally to the body. Match lighting and shadows.
                
                OUTPUT:
                Photorealistic result with selected items swapped, respecting pose, background, and frame settings.
                `;

            } else {
                // Mix Mode
                const ordinals = ["first", "second", "third"];
                let itemIndex = 0;

                if (topImage) {
                    const topPart = await urlToGenerativePart(topImage);
                    parts.push(topPart);
                    instructions += `Take the TOP garment from the ${ordinals[itemIndex]} provided item image. `;
                    itemIndex++;
                }
                if (bottomImage) {
                    const bottomPart = await urlToGenerativePart(bottomImage);
                    parts.push(bottomPart);
                    instructions += `Take the BOTTOM garment from the ${ordinals[itemIndex]} provided item image. `;
                    itemIndex++;
                }
                if (shoesImage) {
                    const shoesPart = await urlToGenerativePart(shoesImage);
                    parts.push(shoesPart);
                    instructions += `Take the FOOTWEAR (shoes/slippers) from the ${ordinals[itemIndex]} provided item image. `;
                    itemIndex++;
                }

                const modelPart = await fileToGenerativePart(modelFile);
                parts.push(modelPart);

                instructions += `Dress the person in the last image with these items. 
                
                RULES:
                1. If a top is provided, replace the model's top.
                2. If a bottom is provided, replace the model's pants/skirt.
                3. If footwear is provided, replace the model's shoes.
                4. Keep original items if no replacement is provided.
                
                ADDITIONAL SETTINGS:
                - ${poseInstruction}
                - ${backgroundInstruction}
                - ${fullBodyInstruction}
                
                Ensure realistic fit, shadows, lighting, and natural fabric folds. High quality output.`;
            }

            const response = await ai.models.generateContent({
                model: apiSettings.models.gemini,
                contents: { parts: [...parts, { text: instructions }] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            const firstPart = response.candidates?.[0]?.content?.parts?.[0];
            if (firstPart && firstPart.inlineData) {
                setFinalImage(`data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`);
            } else {
                throw new Error("AI không thể tạo ảnh. Vui lòng thử lại hoặc đổi Model.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi ghép đồ.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFixSkin = async () => {
        if (!checkProviderReady()) return;

        if (!skinFile) {
            setError('Vui lòng tải ảnh cần xử lý.');
            return;
        }

        setIsFixingSkin(true);
        setError(null);
        setSkinResult(null);

        try {
            if (apiSettings.provider !== 'gemini') {
                throw new Error("Tính năng phục hồi da cần khả năng Multimodal của Gemini để giữ danh tính khuôn mặt tốt nhất.");
            }

            const ai = new GoogleGenAI({ apiKey: apiSettings.keys.gemini });
            const imagePart = await fileToGenerativePart(skinFile);
            // Prompt kỹ thuật cao dựa trên cơ chế 9 bước
            const prompt = `
            ACT AS: A high-end dedicated image restoration engine specialized in "Anti-Plastic Skin" processing and physical skin texture reconstruction.

            INPUT ANALYSIS & EXECUTION PIPELINE:
            1.  **Semantic Face Parsing:** Identify facial regions (cheeks, forehead, chin) vs. sensitive features (eyes, lips, eyebrows, hair). Lock the identity embedding of the original face.
            2.  **Plasticity Detection:** Scan for areas with unnatural high-frequency loss (over-smoothed, wax-like, airbrushed look).
            3.  **Micro-Texture Synthesis:** Generate conditioned skin texture based on the subject's estimated age and gender. Add natural pores, micro-wrinkles, and subtle skin irregularities.
            4.  **Lighting & Subsurface Scattering:** Fix flat, oily specular highlights. Simulate light penetrating the skin layers (subsurface scattering) to create depth. Increase micro-contrast in shadows.
            5.  **Post-Processing:** Blend the new texture seamlessly. Add subtle film grain to match a high-quality optical camera sensor.

            STRICT CONSTRAINTS (Identity Preservation):
            - PRESERVE the original facial geometry (nose shape, jawline, eye distance) EXACTLY.
            - PRESERVE the original expression and gaze.
            - DO NOT perform "beautification" or aesthetic fixes.
            - DO NOT change the age or make the subject look younger.
            - DO NOT produce a CGI or 3D render look.

            MISSION:
            Restore realistic human skin texture. Remove over-smoothing artifacts. Add subtle natural pores, micro skin variations. Preserve original facial identity, geometry, expression.
            Negative prompt logic: "wax skin", "airbrushed", "beauty filter", "CGI look", "blur", "perfect skin".

            OUTPUT:
            A hyper-realistic photograph where the subject looks human, not plastic.
            `;

            const response = await ai.models.generateContent({
                model: apiSettings.models.gemini,
                contents: {
                    parts: [imagePart, { text: prompt }],
                },
                config: { responseModalities: [Modality.IMAGE] },
            });

            const firstPart = response.candidates?.[0]?.content?.parts?.[0];
            if (firstPart && firstPart.inlineData) {
                setSkinResult(`data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`);
            } else {
                throw new Error("Không thể xử lý ảnh. Vui lòng thử lại với ảnh khác.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi xử lý ảnh.');
        } finally {
            setIsFixingSkin(false);
        }
    };

    const handleBreastAugmentation = async () => {
        if (!checkProviderReady()) return;

        if (!breastAugFile) {
            setError('Vui lòng tải ảnh nhân vật.');
            return;
        }

        setIsBreastAugmenting(true);
        setError(null);
        setBreastAugResult(null);

        try {
            if (apiSettings.provider !== 'gemini') {
                throw new Error("Tính năng này tối ưu hóa cho Gemini.");
            }

            const ai = new GoogleGenAI({ apiKey: apiSettings.keys.gemini });
            const imagePart = await fileToGenerativePart(breastAugFile);
            const prompt = `
            ACT AS: Professional Photo Retoucher specializing in body aesthetics and natural enhancement.
            TASK: Naturally enhance the breast size and firmness of the person in the image.

            INSTRUCTIONS:
            1.  **Volumetric Enhancement:** Increase the breast volume to look fuller, rounder, and more lifted (approximately 1-2 cup sizes larger, or what is proportionally attractive for the body type).
            2.  **Natural Shape & Gravity:** Ensure the shape follows natural physics. They should look firm and perky but not like rigid plastic spheres.
            3.  **Clothing Adaptation:** Accurately adjust the clothing to fit the new volume. Create realistic fabric tension, stretch marks on fabric, and shadow casting based on the new contours.
            4.  **Cleavage & Shadowing:** Enhance the cleavage depth and lighting naturally if visible.

            STRICT CONSTRAINTS (Identity & Scene Preservation):
            - **IDENTITY LOCK:** The face, hair, makeup, expression, and skin tone MUST remain 100% IDENTICAL to the original.
            - **BACKGROUND LOCK:** Do not change or warp the background.
            - **STYLE LOCK:** Keep the original clothing style, color, and texture. Only the fit changes.
            - **REALISM:** The result must be photorealistic, matching the lighting and grain of the original photo. No cartoon/anime style unless the input is such.

            OUTPUT:
            A high-quality, photorealistic image with the requested enhancement.
            `;

            const response = await ai.models.generateContent({
                model: apiSettings.models.gemini,
                contents: {
                    parts: [imagePart, { text: prompt }],
                },
                config: { responseModalities: [Modality.IMAGE] },
            });

            const firstPart = response.candidates?.[0]?.content?.parts?.[0];
            if (firstPart && firstPart.inlineData) {
                setBreastAugResult(`data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`);
            } else {
                throw new Error("Không thể xử lý ảnh. Vui lòng thử lại với ảnh khác.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi xử lý ảnh.');
        } finally {
            setIsBreastAugmenting(false);
        }
    };

    const handleDownload = (imageUrl: string | null, filenamePrefix: string, quality: 'original' | 'hd' | '2k' | '4k') => {
        if (!imageUrl) return;
        setIsDownloadMenuOpen(false);
        const resolutions = { hd: 1920, '2k': 2560, '4k': 3840 };
        const triggerDownload = (href: string, filename: string) => {
            const link = document.createElement('a');
            link.href = href;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        if (quality === 'original') {
            triggerDownload(imageUrl, `${filenamePrefix}-original.png`);
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const target = resolutions[quality];
            const ratio = img.width / img.height;
            canvas.width = img.width >= img.height ? target : target * ratio;
            canvas.height = img.width >= img.height ? target / ratio : target;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            triggerDownload(canvas.toDataURL('image/png'), `${filenamePrefix}-${quality}.png`);
        };
        img.src = imageUrl;
    };

    return (
        <>
            <header className="app-header">
                <h1>AI Studio VIP</h1>
                <p>Bộ công cụ xử lý ảnh chuyên nghiệp</p>
                <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '8px 16px', marginTop: '10px', fontSize: '0.9rem' }}
                    onClick={() => setIsSettingsOpen(true)}
                >
                    ⚙️ Cài đặt AI
                </button>
            </header>

            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                settings={apiSettings} 
                onSave={handleSaveSettings} 
            />

            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'try-on' ? 'active' : ''}`}
                    onClick={() => handleTabChange('try-on')}
                >
                    👗 Virtual Try-On
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'skin-fix' ? 'active' : ''}`}
                    onClick={() => handleTabChange('skin-fix')}
                >
                    ✨ Fix Da Nhựa
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'breast-aug' ? 'active' : ''}`}
                    onClick={() => handleTabChange('breast-aug')}
                >
                    👙 AI Nâng Ngực
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {activeTab === 'try-on' && (
                <main className="workflow-container">
                    {/* Step 1: Manage Garments */}
                    <section className="step-card full-width">
                        <h2>
                            <span className="step-number">1</span> 
                            Chọn Chế Độ Thay Đồ
                        </h2>
                        
                        {/* Mode Switcher */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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

                        <div className="garment-source-container">
                            {tryOnMode === 'full' ? (
                                <>
                                    <div className="source-upload">
                                        <ImageUploader
                                            label="Ảnh Set Đồ (Quần + Áo + Phụ Kiện...)"
                                            image={fullOutfitPreview}
                                            onImageSelect={(e) => handleFileChange(e, setFullOutfitFile, setFullOutfitPreview)}
                                            onRemove={() => { setFullOutfitFile(null); setFullOutfitPreview(null); }}
                                        >
                                            <p>Tải ảnh chứa nguyên set đồ<br/>(AI sẽ lấy cả giày, trang sức nếu có)</p>
                                        </ImageUploader>
                                    </div>
                                    
                                    {/* Granular Selection Options - Moved to right column */}
                                    <div className="full-set-options-column" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div className="option-toggles-container" style={{ marginTop: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                                            
                                            {/* Item Selection Group */}
                                            <div className="options-group">
                                                <label className="uploader-label" style={{marginBottom: '1rem', display: 'block', fontSize: '1.1rem', borderBottom: '1px solid #333', paddingBottom: '8px'}}>1. Chọn mục cần thay:</label>
                                                <div className="option-toggles" style={{ flexDirection: 'column', gap: '10px' }}>
                                                    <button 
                                                        className={`option-btn ${fullSetOptions.clothing ? 'active' : ''}`}
                                                        onClick={() => toggleFullSetOption('clothing')}
                                                        style={{ padding: '12px', fontSize: '0.95rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                                                    >
                                                        <span>👗 Quần/Áo/Váy</span>
                                                        {fullSetOptions.clothing && <span>✓</span>}
                                                    </button>
                                                    <button 
                                                        className={`option-btn ${fullSetOptions.shoes ? 'active' : ''}`}
                                                        onClick={() => toggleFullSetOption('shoes')}
                                                        style={{ padding: '12px', fontSize: '0.95rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                                                    >
                                                        <span>👠 Giày/Dép</span>
                                                        {fullSetOptions.shoes && <span>✓</span>}
                                                    </button>
                                                    <button 
                                                        className={`option-btn ${fullSetOptions.jewelry ? 'active' : ''}`}
                                                        onClick={() => toggleFullSetOption('jewelry')}
                                                        style={{ padding: '12px', fontSize: '0.95rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                                                    >
                                                        <span>💎 Trang sức</span>
                                                        {fullSetOptions.jewelry && <span>✓</span>}
                                                    </button>
                                                    <button 
                                                        className={`option-btn ${fullSetOptions.bag ? 'active' : ''}`}
                                                        onClick={() => toggleFullSetOption('bag')}
                                                        style={{ padding: '12px', fontSize: '0.95rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                                                    >
                                                        <span>👜 Túi xách</span>
                                                        {fullSetOptions.bag && <span>✓</span>}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Advanced Settings Group */}
                                            <div className="options-group">
                                                <label className="uploader-label" style={{marginBottom: '1rem', display: 'block', fontSize: '1.1rem', borderBottom: '1px solid #333', paddingBottom: '8px'}}>2. Cài đặt tạo ảnh:</label>
                                                <div className="option-toggles" style={{ flexDirection: 'column', gap: '10px' }}>
                                                    <button 
                                                        className={`option-btn ${generationSettings.changePose ? 'active' : ''}`}
                                                        onClick={() => toggleGenerationSetting('changePose')}
                                                        style={{ padding: '12px', fontSize: '0.95rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                                                    >
                                                        <span>💃 Thay đổi tư thế</span>
                                                        {generationSettings.changePose && <span>✓</span>}
                                                    </button>
                                                    <button 
                                                        className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`}
                                                        onClick={() => toggleGenerationSetting('changeBackground')}
                                                        style={{ padding: '12px', fontSize: '0.95rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                                                    >
                                                        <span>🏞️ Đổi bối cảnh</span>
                                                        {generationSettings.changeBackground && <span>✓</span>}
                                                    </button>
                                                    <button 
                                                        className={`option-btn ${generationSettings.generateFullBody ? 'active' : ''}`}
                                                        onClick={() => toggleGenerationSetting('generateFullBody')}
                                                        style={{ padding: '12px', fontSize: '0.95rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                                                    >
                                                        <span>🧍 Tạo ảnh toàn thân</span>
                                                        {generationSettings.generateFullBody && <span>✓</span>}
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="source-upload">
                                        <ImageUploader
                                            label="Ảnh gốc để tách đồ"
                                            image={sourceGarmentPreview}
                                            onImageSelect={(e) => handleFileChange(e, setSourceGarmentFile, setSourceGarmentPreview)}
                                        >
                                            <p>Tải ảnh chứa đồ cần lấy</p>
                                        </ImageUploader>
                                        <div className="action-buttons">
                                            <button className="btn btn-secondary" onClick={() => handleExtract('top')} disabled={!sourceGarmentFile || isExtractingTop || isExtractingBottom || isExtractingShoes}>
                                                {isExtractingTop ? '⏳...' : '👕 Tách Áo'}
                                            </button>
                                            <button className="btn btn-secondary" onClick={() => handleExtract('bottom')} disabled={!sourceGarmentFile || isExtractingTop || isExtractingBottom || isExtractingShoes}>
                                                {isExtractingBottom ? '⏳...' : '👖 Tách Quần'}
                                            </button>
                                            <button className="btn btn-secondary" onClick={() => handleExtract('shoes')} disabled={!sourceGarmentFile || isExtractingTop || isExtractingBottom || isExtractingShoes}>
                                                {isExtractingShoes ? '⏳...' : '👟 Tách Giày'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="extracted-items-container">
                                        <div className="extracted-items">
                                            <ImageUploader
                                                label="Áo"
                                                image={topImage}
                                                onImageSelect={(e) => handleDirectGarmentUpload(e, 'top')}
                                                onRemove={() => handleRemoveGarment('top')}
                                            >
                                                <p>Chưa có áo</p>
                                            </ImageUploader>
                                            <ImageUploader
                                                label="Quần"
                                                image={bottomImage}
                                                onImageSelect={(e) => handleDirectGarmentUpload(e, 'bottom')}
                                                onRemove={() => handleRemoveGarment('bottom')}
                                            >
                                                <p>Chưa có quần</p>
                                            </ImageUploader>
                                            <ImageUploader
                                                label="Giày/Dép"
                                                image={shoesImage}
                                                onImageSelect={(e) => handleDirectGarmentUpload(e, 'shoes')}
                                                onRemove={() => handleRemoveGarment('shoes')}
                                            >
                                                <p>Chưa có giày</p>
                                            </ImageUploader>
                                        </div>

                                        {/* Mix Mode Advanced Options */}
                                        <div className="mix-mode-options" style={{ marginTop: '1.5rem', background: '#1e1e1e', padding: '1rem', borderRadius: '12px', border: '1px solid #333' }}>
                                            <label className="uploader-label" style={{marginBottom: '0.8rem', display: 'block'}}>Cài đặt nâng cao:</label>
                                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                <button 
                                                    className={`option-btn ${generationSettings.changePose ? 'active' : ''}`}
                                                    onClick={() => toggleGenerationSetting('changePose')}
                                                    style={{ flex: '1 1 30%', justifyContent: 'center' }}
                                                >
                                                    💃 Thay đổi tư thế
                                                </button>
                                                <button 
                                                    className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`}
                                                    onClick={() => toggleGenerationSetting('changeBackground')}
                                                    style={{ flex: '1 1 30%', justifyContent: 'center' }}
                                                >
                                                    🏞️ Đổi bối cảnh
                                                </button>
                                                <button 
                                                    className={`option-btn ${generationSettings.generateFullBody ? 'active' : ''}`}
                                                    onClick={() => toggleGenerationSetting('generateFullBody')}
                                                    style={{ flex: '1 1 30%', justifyContent: 'center' }}
                                                >
                                                    🧍 Tạo ảnh toàn thân
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Step 2: Model */}
                    <section className="step-card">
                        <h2><span className="step-number">2</span> Ảnh Người Mẫu</h2>
                        <ImageUploader
                            image={modelPreview}
                            onImageSelect={(e) => handleFileChange(e, setModelFile, setModelPreview)}
                        >
                            <p>+ Tải ảnh người mẫu</p>
                        </ImageUploader>
                    </section>

                    {/* Step 3: Finalize */}
                    <section className="step-card">
                        <h2><span className="step-number">3</span> Hoàn Tất</h2>
                        <div className="finalize-box">
                            <p>Cấu hình hiện tại: <strong>{tryOnMode === 'full' ? 'Full Set (Nguyên Bộ)' : 'Mix & Match'}</strong></p>
                            
                            {tryOnMode === 'mix' && (
                                <ul className="status-list">
                                    <li>Áo: {topImage ? '✅ Đã sẵn sàng' : '❌ Giữ nguyên gốc'}</li>
                                    <li>Quần: {bottomImage ? '✅ Đã sẵn sàng' : '❌ Giữ nguyên gốc'}</li>
                                    <li>Giày: {shoesImage ? '✅ Đã sẵn sàng' : '❌ Giữ nguyên gốc'}</li>
                                </ul>
                            )}
                            
                            {tryOnMode === 'full' && (
                                <ul className="status-list">
                                    <li>Set đồ: {fullOutfitFile ? '✅ Đã sẵn sàng' : '❌ Chưa có ảnh set'}</li>
                                    <li>Mục cần thay: 
                                        {[
                                            fullSetOptions.clothing ? 'Áo/Quần' : '',
                                            fullSetOptions.shoes ? 'Giày' : '',
                                            fullSetOptions.jewelry ? 'Trang sức' : '',
                                            fullSetOptions.bag ? 'Túi' : ''
                                        ].filter(Boolean).join(', ') || 'Chưa chọn'}
                                    </li>
                                </ul>
                            )}

                            <div className="generation-settings-summary" style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem', fontStyle: 'italic' }}>
                                {generationSettings.changePose ? '✅ Tư thế mới' : '🔒 Giữ nguyên tư thế'} • 
                                {generationSettings.changeBackground ? ' ✅ Bối cảnh mới' : ' 🔒 Giữ nguyên nền'} • 
                                {generationSettings.generateFullBody ? ' ✅ Toàn thân' : ' 🔒 Giữ khung hình'}
                            </div>

                            <button 
                                className="btn btn-primary" 
                                onClick={handleGenerateTryOn} 
                                disabled={
                                    isGenerating || 
                                    !modelFile || 
                                    (tryOnMode === 'mix' && !topImage && !bottomImage && !shoesImage) ||
                                    (tryOnMode === 'full' && (!fullOutfitFile || Object.values(fullSetOptions).every(v => !v)))
                                }
                            >
                                ✨ {isGenerating ? 'Đang mặc đồ...' : 'Bắt đầu ghép đồ'}
                            </button>
                        </div>
                    </section>
                </main>
            )}

            {activeTab === 'skin-fix' && (
                <main className="workflow-container">
                    <section className="step-card full-width">
                        <h2>✨ AI Phục Hồi Vật Lý Da (Plasticity Removal)</h2>
                        <p className="section-desc">
                            Công nghệ Semantic Texture Synthesis giúp khôi phục độ chân thực vật lý cho da. 
                            AI sẽ tái tạo lỗ chân lông, xử lý lại ánh sáng (Subsurface Scattering) và loại bỏ hiệu ứng "bóng sáp" 
                            mà vẫn <strong>giữ nguyên danh tính và biểu cảm gốc</strong> (Identity Preservation).
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                            <ImageUploader
                                label="Ảnh gốc (Bị da nhựa/Filter quá đà)"
                                image={skinPreview}
                                onImageSelect={(e) => handleFileChange(e, setSkinFile, setSkinPreview)}
                                onRemove={() => { setSkinFile(null); setSkinPreview(null); }}
                            >
                                <p>+ Tải ảnh cần xử lý</p>
                            </ImageUploader>
                            
                            <button 
                                className="btn btn-primary" 
                                onClick={handleFixSkin} 
                                disabled={!skinFile || isFixingSkin}
                                style={{ padding: '16px', fontSize: '1.1rem' }}
                            >
                                {isFixingSkin ? '🧬 Đang phân tích & tái tạo da...' : '🚀 Khôi phục độ chân thực'}
                            </button>
                        </div>
                    </section>
                </main>
            )}

            {activeTab === 'breast-aug' && (
                <main className="workflow-container">
                    <section className="step-card full-width">
                        <h2>AI Nâng Ngực To Và Căng Tự Nhiên</h2>
                        <p className="section-desc">
                            Tải ảnh nhân vật lên và AI sẽ làm cho nhân vật có bộ ngực to và căng tự nhiên. 
                            Hệ thống sẽ tự động điều chỉnh trang phục và ánh sáng để đảm bảo độ chân thực nhất.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                            <ImageUploader
                                label="Ảnh người mẫu (Model)"
                                image={breastAugPreview}
                                onImageSelect={(e) => handleFileChange(e, setBreastAugFile, setBreastAugPreview)}
                                onRemove={() => { setBreastAugFile(null); setBreastAugPreview(null); }}
                            >
                                <p>📷 Tải ảnh nhân vật</p>
                            </ImageUploader>
                            
                            <button 
                                className="btn btn-primary" 
                                onClick={handleBreastAugmentation} 
                                disabled={!breastAugFile || isBreastAugmenting}
                                style={{ padding: '16px', fontSize: '1.1rem' }}
                            >
                                {isBreastAugmenting ? '🍑 Đang nâng cấp vòng 1...' : '🚀 Tạo Ảnh AI'}
                            </button>
                        </div>
                    </section>
                </main>
            )}

            {/* Result Display for Try-On */}
            {activeTab === 'try-on' && (isGenerating || finalImage) && (
                <section className="result-card">
                    <h2>Kết Quả Virtual Try-On</h2>
                    <div className="image-container">
                        {isGenerating && (
                            <div className="loader-container">
                                <div className="spinner"></div>
                                <p>AI đang phối đồ và xử lý ánh sáng...</p>
                            </div>
                        )}
                        {finalImage && <img src={finalImage} alt="Final result" />}
                    </div>
                    {finalImage && (
                        <div className="download-container">
                            <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} className="btn btn-secondary">
                                💾 Tải kết quả (PNG)
                            </button>
                            {isDownloadMenuOpen && (
                                <div className="download-menu">
                                    <button onClick={() => handleDownload(finalImage, 'try-on', 'original')}>Chất lượng gốc</button>
                                    <button onClick={() => handleDownload(finalImage, 'try-on', 'hd')}>Full HD</button>
                                    <button onClick={() => handleDownload(finalImage, 'try-on', '2k')}>2K</button>
                                    <button onClick={() => handleDownload(finalImage, 'try-on', '4k')}>4K</button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* Result Display for Skin Fix */}
            {activeTab === 'skin-fix' && (isFixingSkin || skinResult) && (
                <section className="result-card">
                    <h2>Kết Quả Khôi Phục (Realism)</h2>
                    <div className="image-container">
                        {isFixingSkin && (
                            <div className="loader-container">
                                <div className="spinner"></div>
                                <p>Đang tái tạo texture vi mô & ánh sáng...</p>
                            </div>
                        )}
                        {skinResult && <img src={skinResult} alt="Skin fix result" />}
                    </div>
                    {skinResult && (
                        <div className="download-container">
                            <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} className="btn btn-secondary">
                                💾 Tải kết quả (PNG)
                            </button>
                            {isDownloadMenuOpen && (
                                <div className="download-menu">
                                    <button onClick={() => handleDownload(skinResult, 'skin-fix', 'original')}>Chất lượng gốc</button>
                                    <button onClick={() => handleDownload(skinResult, 'skin-fix', 'hd')}>Full HD</button>
                                    <button onClick={() => handleDownload(skinResult, 'skin-fix', '2k')}>2K</button>
                                    <button onClick={() => handleDownload(skinResult, 'skin-fix', '4k')}>4K</button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* Result Display for Breast Augmentation */}
            {activeTab === 'breast-aug' && (isBreastAugmenting || breastAugResult) && (
                <section className="result-card">
                    <h2>Kết Quả Nâng Cấp Vòng 1</h2>
                    <div className="image-container">
                        {isBreastAugmenting && (
                            <div className="loader-container">
                                <div className="spinner"></div>
                                <p>Đang xử lý hình thể và trang phục...</p>
                            </div>
                        )}
                        {breastAugResult && <img src={breastAugResult} alt="Breast Augmentation result" />}
                    </div>
                    {breastAugResult && (
                        <div className="download-container">
                            <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} className="btn btn-secondary">
                                💾 Tải kết quả (PNG)
                            </button>
                            {isDownloadMenuOpen && (
                                <div className="download-menu">
                                    <button onClick={() => handleDownload(breastAugResult, 'breast-aug', 'original')}>Chất lượng gốc</button>
                                    <button onClick={() => handleDownload(breastAugResult, 'breast-aug', 'hd')}>Full HD</button>
                                    <button onClick={() => handleDownload(breastAugResult, 'breast-aug', '2k')}>2K</button>
                                    <button onClick={() => handleDownload(breastAugResult, 'breast-aug', '4k')}>4K</button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}
        </>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
