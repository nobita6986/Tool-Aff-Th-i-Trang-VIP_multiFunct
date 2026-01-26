import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- CONSTANTS & DATA ---
const INFLUENCER_DATA = {
    genders: [
        { label: 'Nữ (Female)', value: 'Female' },
        { label: 'Nam (Male)', value: 'Male' },
        { label: 'Phi nhị nguyên (Non-binary)', value: 'Non-binary' },
        { label: 'Androgynous (Trung tính)', value: 'Androgynous' }
    ],
    ages: [
        { label: '18–20 (Teen/Young adult)', value: '18–20 years old (Teen/Young adult)' },
        { label: '20s (Trẻ)', value: '20s (Young Adult)' },
        { label: '30s (Trưởng thành)', value: '30s (Mature)' },
        { label: '40s (Chững chạc)', value: '40s (Experienced/Middle Age)' }
    ],
    ethnicities: [
        { label: 'Châu Á (Việt Nam)', value: 'Asian (Vietnamese)' },
        { label: 'Châu Á (Đông Á)', value: 'East Asian (Korean/Japanese/Chinese)' },
        { label: 'Châu Á (Đông Nam Á)', value: 'Southeast Asian' },
        { label: 'Âu (European)', value: 'Caucasian (European)' },
        { label: 'Mỹ Latin (Latina)', value: 'Latina/Hispanic' },
        { label: 'Trung Đông (Middle Eastern)', value: 'Middle Eastern' },
        { label: 'Phi (African)', value: 'Black/African Descent' }
    ],
    hairOptions: {
        lengths: [
            { label: 'Dài', value: 'Long' },
            { label: 'Ngang vai', value: 'Shoulder-length' },
            { label: 'Tóc Bob ngắn', value: 'Short bob' },
            { label: 'Tóc tém (Pixie)', value: 'Pixie cut' }
        ],
        colors: [
            { label: 'Đen tự nhiên', value: 'Natural black' },
            { label: 'Nâu Chocolate', value: 'Chocolate brown' },
            { label: 'Nâu hạt dẻ', value: 'Chestnut brown' },
            { label: 'Nâu khói', value: 'Ash brown' },
            { label: 'Vàng mật ong', value: 'Honey blonde' },
            { label: 'Vàng bạch kim', value: 'Platinum blonde' },
            { label: 'Đỏ rượu', value: 'Burgundy' },
            { label: 'Xám khói', value: 'Smoky gray' }
        ],
        textures: [
            { label: 'Thẳng mượt', value: 'Straight silky' },
            { label: 'Gợn sóng nhẹ', value: 'Soft wavy' },
            { label: 'Xoăn lơi', value: 'Loose curls' },
            { label: 'Xoăn xù', value: 'Tight curls' }
        ],
        bangs: [
            { label: 'Mái thưa Hàn Quốc', value: 'Airy bangs (Korean style)' },
            { label: 'Mái bằng', value: 'Blunt bangs' },
            { label: 'Mái bay', value: 'Curtain bangs' },
            { label: 'Không mái', value: 'No bangs' }
        ],
        presets: [
            { label: 'Dài đen thẳng mượt + mái thưa', value: 'Long Natural black Straight silky hair with Airy bangs' },
            { label: 'Dài nâu chocolate gợn sóng + mái bay', value: 'Long Chocolate brown Soft wavy hair with Curtain bangs' },
            { label: 'Bob ngắn đen + không mái', value: 'Short bob Natural black Straight hair, No bangs' },
            { label: 'Ngang vai nâu khói + mái thưa', value: 'Shoulder-length Ash brown hair with Airy bangs' },
            { label: 'Dài vàng mật ong + xoăn lơi + mái bay', value: 'Long Honey blonde Loose curls with Curtain bangs' }
        ]
    },
    eyes: [
        { label: 'Nâu (Brown)', value: 'Brown' },
        { label: 'Nâu đậm (Dark brown)', value: 'Dark brown' },
        { label: 'Hổ phách (Amber)', value: 'Amber' },
        { label: 'Xanh lá (Green)', value: 'Green' },
        { label: 'Xanh dương (Blue)', value: 'Blue' },
        { label: 'Xám (Gray)', value: 'Gray' }
    ],
    bodyTypes: [
        { label: 'Mảnh & fit (Slim & fit)', value: 'Slim & fit' },
        { label: 'Mảnh (Slim)', value: 'Slim/Slender' },
        { label: 'Cân đối (Balanced)', value: 'Balanced/Average' },
        { label: 'Thể thao (Athletic)', value: 'Athletic/Toned' },
        { label: 'Đường cong (Curvy)', value: 'Curvy/Hourglass' },
        { label: 'Cao & mảnh (Tall & slim)', value: 'Tall & slim (Model like)' },
        { label: 'Nhỏ nhắn (Petite)', value: 'Petite' }
    ],
    styles: [
        { label: 'Cute casual (Dễ thương đời thường)', value: 'Cute casual, comfortable, pastel tones' },
        { label: 'Modern luxury (Hiện đại sang)', value: 'Modern luxury, high-end fashion, old money vibe' },
        { label: 'Minimalist (Tối giản)', value: 'Minimalist, clean lines, neutral colors' },
        { label: 'Korean chic (Hàn Quốc thanh lịch)', value: 'Korean chic, trendy, layered outfit' },
        { label: 'Streetwear (Đường phố)', value: 'Streetwear, oversized, sneakers, edgy' },
        { label: 'Preppy (Học đường)', value: 'Preppy, academic, blazer, plaid skirt' },
        { label: 'Office core (Đi làm)', value: 'Office core, professional, blazer, trousers' },
        { label: 'Vintage (Cổ điển)', value: 'Vintage, retro aesthetic, 90s vibe' },
        { label: 'Y2K (Gen Z)', value: 'Y2K aesthetic, colorful, crop top, low rise' },
        { label: 'Coquette / Balletcore', value: 'Coquette aesthetic, balletcore, ribbons, lace, soft pink' }
    ],
    scenarios: {
        'Cafe & Lifestyle': [
            { label: 'Uống cà phê, nắng sáng', value: 'Drinking coffee in a cozy cafe, morning sunlight through window' },
            { label: 'Đọc sách cạnh cửa sổ', value: 'Reading a book by a large window, peaceful atmosphere' },
            { label: 'Đi dạo phố chiều tà', value: 'Walking on a city street during golden hour, evening stroll' }
        ],
        'Fashion Shots': [
            { label: 'OOTD trước gương', value: 'Mirror selfie in a modern bedroom, OOTD shot' },
            { label: 'Street style vỉa hè', value: 'Full body street style shot on an urban sidewalk, blurred city background' },
            { label: 'Lookbook nền trơn', value: 'Professional studio lookbook shot, seamless grey background, high fashion pose' }
        ],
        'Work / School': [
            { label: 'Sảnh văn phòng sáng', value: 'Standing in a modern office building lobby, morning light, holding a tablet' },
            { label: 'Đi học / Workshop', value: 'Sitting in a creative workshop or university campus, holding a notebook' }
        ],
        'Date / Event': [
            { label: 'Hẹn hò tối lãng mạn', value: 'Fine dining restaurant at night, candle light, romantic date night atmosphere' },
            { label: 'Sự kiện nhẹ (Cocktail)', value: 'Holding a cocktail glass at a casual social event, warm ambient lighting' }
        ]
    }
};

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

            const threshold = 230; 
            const isBackground = (idx: number) => {
                const r = data[idx];
                const g = data[idx+1];
                const b = data[idx+2];
                return r > threshold && g > threshold && b > threshold;
            };

            const stack: [number, number][] = [];
            const visited = new Uint8Array(w * h);
            const corners = [[0,0], [w-1, 0], [0, h-1], [w-1, h-1]];
            for(const [cx, cy] of corners) {
                const idx = (cy * w + cx) * 4;
                if(isBackground(idx)) {
                    stack.push([cx, cy]);
                    visited[cy * w + cx] = 1;
                }
            }

            while(stack.length > 0) {
                const [x, y] = stack.pop()!;
                const idx = (y * w + x) * 4;
                data[idx + 3] = 0; 

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
        img.onerror = () => resolve(imageSrc); 
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
type Expression = 'default' | 'happy' | 'serious' | 'surprised' | 'seductive';

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

    // Swap Face Mode State
    const [swapTargetFile, setSwapTargetFile] = useState<File | null>(null);
    const [swapTargetPreview, setSwapTargetPreview] = useState<string | null>(null);
    const [swapSourceFile, setSwapSourceFile] = useState<File | null>(null);
    const [swapSourcePreview, setSwapSourcePreview] = useState<string | null>(null);
    const [swapResultImage, setSwapResultImage] = useState<string | null>(null);
    const [isSwapping, setIsSwapping] = useState(false);

    // Skin Fix Mode State
    const [skinFixInputImage, setSkinFixInputImage] = useState<string | null>(null);
    const [skinFixResultImage, setSkinFixResultImage] = useState<string | null>(null);
    const [isFixingSkin, setIsFixingSkin] = useState(false);

    // Breast Lift Mode State
    const [breastLiftInputImage, setBreastLiftInputImage] = useState<string | null>(null);
    const [breastLiftResultImage, setBreastLiftResultImage] = useState<string | null>(null);
    const [isLiftingBreast, setIsLiftingBreast] = useState(false);

    // AI Influencer Mode State
    const [influencerSettings, setInfluencerSettings] = useState({
        gender: 'Female',
        age: '20s (Young Adult)',
        ethnicity: 'Asian (Vietnamese)',
        hair: 'Long Natural black Straight silky hair with Airy bangs (Korean style)',
        eyes: 'Dark brown',
        bodyType: 'Slim & fit',
        style: 'Modern luxury, high-end fashion, old money vibe',
        scenario: 'Drinking coffee in a cozy cafe, morning sunlight through window'
    });
    // State to manage individual hair components before constructing the full string
    const [hairBuilder, setHairBuilder] = useState({
        length: 'Long',
        color: 'Natural black',
        texture: 'Straight silky',
        bangs: 'Airy bangs (Korean style)'
    });
    
    const [influencerResultImage, setInfluencerResultImage] = useState<string | null>(null);
    const [isCreatingInfluencer, setIsCreatingInfluencer] = useState(false);

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
        transparentBackground: false,
        expression: 'default' as Expression
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

    // Update Hair String when builder changes
    useEffect(() => {
        // Only update if we are not manually overriding via typing
        // Ideally, we just sync them for now
        const hairStr = `${hairBuilder.length} ${hairBuilder.color} ${hairBuilder.texture} hair with ${hairBuilder.bangs}`;
        // We only auto-update if the user hasn't completely typed something else? 
        // For simplicity, let's make the builder drive the input, but input remains editable.
        // We won't use a dedicated effect to overwrite constantly, we'll use a handler.
    }, [hairBuilder]);

    const updateHairFromBuilder = (newPart: Partial<typeof hairBuilder>) => {
        const newBuilder = { ...hairBuilder, ...newPart };
        setHairBuilder(newBuilder);
        const hairStr = `${newBuilder.length} ${newBuilder.color} ${newBuilder.texture} hair with ${newBuilder.bangs}`;
        setInfluencerSettings(prev => ({ ...prev, hair: hairStr }));
    };

    const randomizeInfluencer = () => {
        const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
        const randomOption = (arr: {value: string}[]) => randomItem(arr).value;

        // Hair Random
        const len = randomItem(INFLUENCER_DATA.hairOptions.lengths);
        const col = randomItem(INFLUENCER_DATA.hairOptions.colors);
        const tex = randomItem(INFLUENCER_DATA.hairOptions.textures);
        const bng = randomItem(INFLUENCER_DATA.hairOptions.bangs);
        const hairStr = `${len.value} ${col.value} ${tex.value} hair with ${bng.value}`;
        setHairBuilder({ length: len.value, color: col.value, texture: tex.value, bangs: bng.value });

        // Scenario Random (Flatten)
        const allScenarios = Object.values(INFLUENCER_DATA.scenarios).flat();

        setInfluencerSettings({
            gender: randomOption(INFLUENCER_DATA.genders),
            age: randomOption(INFLUENCER_DATA.ages),
            ethnicity: randomOption(INFLUENCER_DATA.ethnicities),
            hair: hairStr,
            eyes: randomOption(INFLUENCER_DATA.eyes),
            bodyType: randomOption(INFLUENCER_DATA.bodyTypes),
            style: randomOption(INFLUENCER_DATA.styles),
            scenario: randomOption(allScenarios)
        });
    };

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

    const handleSwapImages = () => {
        // Swap file objects
        const tempFile = swapTargetFile;
        setSwapTargetFile(swapSourceFile);
        setSwapSourceFile(tempFile);

        // Swap preview strings
        const tempPreview = swapTargetPreview;
        setSwapTargetPreview(swapSourcePreview);
        setSwapSourcePreview(tempPreview);
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

    const setExpression = (expr: Expression) => {
        setGenerationSettings(prev => ({ ...prev, expression: expr }));
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

    const handleInfluencerSettingChange = (field: string, value: string) => {
        setInfluencerSettings(prev => ({
            ...prev,
            [field]: value
        }));
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

    const handleCreateInfluencer = async () => {
        setIsCreatingInfluencer(true);
        setInfluencerResultImage(null);
        setError(null);

        try {
            const { gender, age, ethnicity, hair, eyes, bodyType, style, scenario } = influencerSettings;
            const parts: any[] = [];

            let textPrompt = "TASK: Create a High-End Virtual Influencer (AI KOL) - Photorealistic Portrait.\n\n";
            
            textPrompt += "1. **CHARACTER SPECIFICATIONS**:\n";
            textPrompt += `   - **Gender**: ${gender}.\n`;
            textPrompt += `   - **Age**: ${age}.\n`;
            textPrompt += `   - **Ethnicity/Origin**: ${ethnicity}.\n`;
            textPrompt += `   - **Hair**: ${hair}.\n`;
            textPrompt += `   - **Eyes**: ${eyes}.\n`;
            textPrompt += `   - **Body Type**: ${bodyType}.\n`;
            textPrompt += `   - **Features**: Flawless skin texture, perfect symmetry, high-fashion makeup (if female), confident expression.\n\n`;

            textPrompt += "2. **STYLE & SCENARIO**:\n";
            textPrompt += `   - **Fashion Style**: ${style}.\n`;
            textPrompt += `   - **Setting/Activity**: ${scenario}.\n\n`;

            textPrompt += "3. **PHOTOGRAPHY QUALITY**:\n";
            textPrompt += "   - Style: Professional Editorial/Lifestyle Photography.\n";
            textPrompt += "   - Lighting: Soft, cinematic natural lighting or studio lighting as appropriate for scene.\n";
            textPrompt += "   - Details: 8k resolution, ultra-detailed skin pores, realistic hair physics, depth of field.\n";
            
            textPrompt += `\nOutput Aspect Ratio: ${generationSettings.aspectRatio}.`;
            
            // Strict No-Text Instruction
            textPrompt += "\n\n**CRITICAL OUTPUT RULE**: Return ONLY the generated image. Do NOT output any text.";

            parts.push({ text: textPrompt });

            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const modelName = 'gemini-2.5-flash-image';
                
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: { parts: parts },
                    config: {
                        // Use string literals for safety settings to ensure compatibility and loose typing if needed
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                        ]
                    }
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

                setInfluencerResultImage(finalUrl);
                return response;
            });

        } catch (err: any) {
            console.error(err);
            setError("Lỗi tạo Influencer: " + err.message);
        } finally {
            setIsCreatingInfluencer(false);
        }
    };

    const handleSwapFace = async () => {
        if (!swapTargetFile || !swapSourceFile) return;
        setIsSwapping(true);
        setSwapResultImage(null);
        setError(null);

        try {
            const parts: any[] = [];
            const targetB64 = await fileToBase64(swapTargetFile);
            const sourceB64 = await fileToBase64(swapSourceFile);

            // STRATEGY CHANGE: Provide Source Identity FIRST to anchor the model on the face features.
            parts.push({ text: "SOURCE IMAGE [IDENTITY]: Contains the face to swap. Focus on internal facial features (eyes, nose, mouth) and unique characteristics (moles, scars)." });
            parts.push({
                inlineData: { mimeType: swapSourceFile.type, data: sourceB64 }
            });

            parts.push({ text: "TARGET IMAGE [BODY/POSE]: Contains the body, pose, and background. The face here must be replaced." });
            parts.push({
                inlineData: { mimeType: swapTargetFile.type, data: targetB64 }
            });

            // UPDATED PROMPT: More technical, less chatty to avoid AI text refusal.
            let textPrompt = "TASK: Advanced Image Compositing & Identity Transfer.\n";
            textPrompt += "OBJECTIVE: Generate a photorealistic image by seamlessly compositing the facial features from the SOURCE IMAGE onto the body of the TARGET IMAGE.\n\n";

            textPrompt += "1. IDENTITY PRESERVATION (CRITICAL):\n";
            textPrompt += "   - Maintain facial features: eyes, nose, mouth shape from SOURCE.\n";
            textPrompt += "   - Preserve unique characteristics: moles, scars, wrinkles from SOURCE.\n";
            textPrompt += "   - Keep facial structure and proportions accurate to SOURCE.\n";

            textPrompt += "2. POSE & EXPRESSION MATCHING:\n";
            textPrompt += "   - Match head pose angle from TARGET (yaw, pitch, roll).\n";
            textPrompt += "   - Align face orientation exactly to the TARGET's neck and head shape.\n";

             // EXPRESSION LOGIC
            if (generationSettings.expression && generationSettings.expression !== 'default') {
                const expr = generationSettings.expression;
                textPrompt += `   - **EXPRESSION**: Change the facial expression to '${expr.toUpperCase()}'.\n`;
            } else {
                textPrompt += "   - Adapt facial expression to match the TARGET's original expression/vibe.\n";
            }

            textPrompt += "3. SEAMLESS BLENDING (High Priority):\n";
            textPrompt += "   - **Color Grading**: Match skin tone of the new face EXACTLY to the TARGET's neck and body.\n";
            textPrompt += "   - **Lighting**: Preserve TARGET's lighting direction, temperature, and shadows.\n";
            textPrompt += "   - **Texture**: Ensure natural skin texture and grain consistency.\n";
            textPrompt += "   - Blend face boundary smoothly without visible seams.\n";

            textPrompt += "4. CONTEXT PRESERVATION:\n";
            textPrompt += "   - Keep the TARGET's background, clothing, and hair UNCHANGED (unless hair obscures the face, then adapt naturally).\n";

             // POSE LOGIC OVERRIDE
            if (generationSettings.changePose) {
                textPrompt += "- **POSE OVERRIDE**: IGNORE the specific pose of TARGET. Generate a NEW, dynamic fashion pose for the subject (SOURCE Identity in TARGET Clothes).\n";
            } 
            
            // BACKGROUND LOGIC
            if (generationSettings.transparentBackground) {
                textPrompt += "- **BACKGROUND**: **SOLID WHITE**. Render on a flat white background for removal.\n";
            } else if (generationSettings.changeBackground) {
                textPrompt += "- **BACKGROUND**: Place the subject in a new high-end studio or luxury environment.\n";
            } else {
                textPrompt += "- **BACKGROUND**: Keep the original background of TARGET exactly as is.\n";
            }

            textPrompt += `\nOutput Aspect Ratio: ${generationSettings.aspectRatio}.`;
            textPrompt += "\nStyle: 8k resolution, Photorealistic, High Fidelity.";
            
            // Strict No-Text Instruction
            textPrompt += "\n\n**CRITICAL OUTPUT RULE**: Return ONLY the generated image. Do NOT output any text, explanation, or chat. Just the image.";

            parts.push({ text: textPrompt });

            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const modelName = 'gemini-2.5-flash-image';
                
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: { parts: parts },
                    config: {
                        // Use string literals for safety settings to ensure compatibility and loose typing if needed
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                        ]
                    }
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
                
                if (generationSettings.transparentBackground) {
                    finalUrl = await removeBackground(finalUrl);
                }

                setSwapResultImage(finalUrl);
                return response;
            });

        } catch (err: any) {
            console.error(err);
            setError("Lỗi Swap Face: " + err.message);
        } finally {
            setIsSwapping(false);
        }
    };

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
                        className={`nav-item nav-influencer ${activeTab === 'ai-influencer' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ai-influencer')}
                    >
                        🌟 Create AI Influencer
                    </button>
                    <button 
                        className={`nav-item nav-try-on ${activeTab === 'try-on' ? 'active' : ''}`}
                        onClick={() => setActiveTab('try-on')}
                    >
                        👗 Virtual Try-On
                    </button>
                    <button 
                        className={`nav-item nav-swap-face ${activeTab === 'swap-face' ? 'active' : ''}`}
                        onClick={() => setActiveTab('swap-face')}
                    >
                        🎭 Swap Face (Ghép Mặt)
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

            {/* --- GUIDE MODAL & SETTINGS MODAL (KEEP AS IS, omitted for brevity in change block if not changing) --- */}
            {/* ... GUIDE & SETTINGS ... */}
            {showGuide && (
                <div className="modal-overlay">
                    <div className="modal-content settings-modal-wide">
                        <div className="modal-header">
                            <h3>Hướng dẫn sử dụng & Giới thiệu</h3>
                            <button className="modal-close" onClick={() => setShowGuide(false)}>×</button>
                        </div>
                        <div className="modal-main guide-content">
                            {/* Keep guide content */}
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
                                <h4>2. Swap Face (Ghép mặt)</h4>
                                <ul>
                                    <li><strong>Ảnh Gốc (Target):</strong> Chọn ảnh chứa cơ thể, trang phục và bối cảnh bạn muốn giữ lại.</li>
                                    <li><strong>Ảnh Mặt (Source):</strong> Chọn ảnh chứa khuôn mặt người bạn muốn ghép vào.</li>
                                    <li>AI sẽ tự động đồng bộ màu da và ánh sáng. Bạn có thể chọn đổi tư thế hoặc bối cảnh nếu muốn sáng tạo thêm.</li>
                                </ul>
                            </div>

                            <div className="guide-section">
                                <h4>3. Fix Da Nhựa (Skin Enhancer)</h4>
                                <ul>
                                    <li>Công cụ chuyên dụng để xử lý các ảnh AI bị lỗi da "bóng loáng" hoặc "giả trân".</li>
                                    <li>AI sẽ tái tạo lại lỗ chân lông, thêm hạt (grain) và điều chỉnh ánh sáng để da trông như chụp bằng máy ảnh thật.</li>
                                </ul>
                            </div>

                             <div className="guide-section">
                                <h4>4. AI Nâng Ngực (Body Enhancer)</h4>
                                <ul>
                                    <li>Tự động nhận diện vùng ngực và điều chỉnh kích thước tự nhiên.</li>
                                    <li>AI tự động tính toán độ căng của vải và bóng đổ để đảm bảo tính vật lý chân thực.</li>
                                </ul>
                            </div>

                            <div className="guide-section">
                                <h4>5. Create AI Influencer (Tạo KOL ảo)</h4>
                                <ul>
                                    <li>Tạo nhân vật ảo (Virtual Influencer) chuyên nghiệp dựa trên các thông số tùy chỉnh.</li>
                                    <li>Chọn giới tính, tuổi, sắc tộc, phong cách và bối cảnh để AI tạo ra hình ảnh chân thực nhất.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showSettings && (
                 <div className="modal-overlay">
                    <div className="modal-content settings-modal-wide">
                        <div className="modal-header">
                            <h3>Quản lý API Key</h3>
                            <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
                        </div>
                        <div className="modal-body">
                           {/* Keep settings body */}
                            <div className="modal-sidebar">
                                <button className={`sidebar-item ${modalSelectedProvider === 'gemini' ? 'active' : ''}`} onClick={() => setModalSelectedProvider('gemini')}><span className="icon">💎</span> Gemini <span className="count-badge">{apiKeys.gemini.length}</span></button>
                                <button className={`sidebar-item ${modalSelectedProvider === 'openai' ? 'active' : ''}`} onClick={() => setModalSelectedProvider('openai')}><span className="icon">🌀</span> Open AI <span className="count-badge">{apiKeys.openai.length}</span></button>
                                <button className={`sidebar-item ${modalSelectedProvider === 'grok' ? 'active' : ''}`} onClick={() => setModalSelectedProvider('grok')}><span className="icon">🚀</span> Grok <span className="count-badge">{apiKeys.grok.length}</span></button>
                                <div className="active-provider-section"><label>Đang sử dụng:</label><select value={activeProvider} onChange={(e) => handleSetActiveProvider(e.target.value as Provider)} className="provider-select"><option value="gemini">Gemini (Khuyên dùng)</option><option value="openai">Open AI</option><option value="grok">Grok</option></select></div>
                            </div>
                            <div className="modal-main">
                                <h4 style={{marginTop: 0, marginBottom: '10px', textTransform: 'capitalize'}}>Quản lý Key {modalSelectedProvider}</h4>
                                <div className="api-input-group"><textarea value={tempKeyInput} onChange={(e) => setTempKeyInput(e.target.value)} placeholder={`Dán danh sách Key ${modalSelectedProvider}...`} className="api-textarea" rows={3}/><button className="btn btn-primary add-key-btn" onClick={addApiKeys}>+ Thêm</button></div>
                                <div className="key-list-container"><div className="key-list-header">Danh sách Key ({apiKeys[modalSelectedProvider].length})</div><div className="key-list">{apiKeys[modalSelectedProvider].length === 0 ? (<div className="empty-keys">Chưa có Key nào.</div>) : (apiKeys[modalSelectedProvider].map((k, i) => (<div key={i} className={`key-item ${modalSelectedProvider === activeProvider && i === currentKeyIndices.current[modalSelectedProvider] ? 'key-active' : ''}`}><div className="key-info"><span className={`key-status-dot ${modalSelectedProvider === activeProvider ? 'active' : 'inactive'}`}></span><span className="key-text">...{k.slice(-6)}</span></div><button className="delete-key-btn" onClick={() => removeApiKey(modalSelectedProvider, i)}>🗑️</button></div>)))}</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

             {error && <div className="error-message">{error}</div>}
             
             {/* --- VIRTUAL TRY ON TAB --- */}
             {activeTab === 'try-on' && (
                 <main className="workflow-container">
                    <div className="mode-switcher-container">
                        <Tooltip text="Chế độ thay toàn bộ trang phục từ một ảnh duy nhất.">
                            <button className={`btn ${tryOnMode === 'full' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTryOnMode('full'); setError(null); }}>✨ Full Set (Nguyên Bộ)</button>
                        </Tooltip>
                        <Tooltip text="Chế độ phối hợp nhiều món đồ lẻ (áo, quần, giày...) lên người mẫu.">
                            <button className={`btn ${tryOnMode === 'mix' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTryOnMode('mix'); setError(null); }}>🧩 Mix & Match (Lẻ)</button>
                        </Tooltip>
                    </div>

                    <section className="step-card full-width">
                        <h2><span className="step-number">1</span> Cấu hình & Dữ liệu</h2>
                        {tryOnMode === 'full' ? (
                            <div className="full-mode-container">
                                <div className="dual-upload-container">
                                    <div className="upload-box">
                                        <ImageUploader label="1. Ảnh Set Đồ" image={fullOutfitPreview} onImageSelect={(e) => handleFileChange(e, setFullOutfitFile, setFullOutfitPreview)} onRemove={() => {setFullOutfitFile(null); setFullOutfitPreview(null)}}>
                                            <p>Tải ảnh nguyên set đồ</p>
                                        </ImageUploader>
                                        <div className="reference-section" style={{marginTop:'10px'}}>
                                            <div className="reference-header"><label>Ảnh tham khảo (Tùy chọn)</label><span>{referenceFiles.length}/3</span></div>
                                            <div className="reference-grid">
                                                {referencePreviews.map((src, idx) => (
                                                    <div key={idx} className="reference-item"><img src={src} /><button onClick={() => removeReferenceImage(idx)}>×</button></div>
                                                ))}
                                                {referenceFiles.length < 3 && (<div className="reference-add-btn" onClick={() => document.getElementById('ref-upload')?.click()}>+</div>)}
                                                <input id="ref-upload" type="file" accept="image/*" onChange={handleReferenceUpload} style={{display: 'none'}} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="upload-box"><ImageUploader label="2. Ảnh Mẫu" image={modelPreview} onImageSelect={(e) => handleFileChange(e, setModelFile, setModelPreview)} onRemove={() => {setModelFile(null); setModelPreview(null)}}><p>Tải ảnh mẫu</p></ImageUploader></div>
                                </div>
                                <div className="settings-panel">
                                    <div className="settings-columns">
                                        <div className="settings-card">
                                            <div className="settings-card-header"><label>3. Chọn mục cần thay:</label></div>
                                            <div className="option-toggles-list">
                                                <button className={`option-btn ${fullSetOptions.clothing ? 'active' : ''}`} onClick={() => toggleFullSetOption('clothing')}><span>👗 Quần/Áo/Váy</span>{fullSetOptions.clothing && <span>✓</span>}</button>
                                                <button className={`option-btn ${fullSetOptions.shoes ? 'active' : ''}`} onClick={() => toggleFullSetOption('shoes')}><span>👠 Giày/Dép</span>{fullSetOptions.shoes && <span>✓</span>}</button>
                                                <button className={`option-btn ${fullSetOptions.jewelry ? 'active' : ''}`} onClick={() => toggleFullSetOption('jewelry')}><span>💎 Trang sức</span>{fullSetOptions.jewelry && <span>✓</span>}</button>
                                                <button className={`option-btn ${fullSetOptions.bag ? 'active' : ''}`} onClick={() => toggleFullSetOption('bag')}><span>👜 Túi xách</span>{fullSetOptions.bag && <span>✓</span>}</button>
                                            </div>
                                        </div>
                                        <div className="settings-card">
                                            <div className="settings-card-header"><label>4. Cài đặt tạo ảnh:</label></div>
                                            <div className="option-toggles-list">
                                                 <div className="aspect-ratio-selector">
                                                    <button className={`option-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setAspectRatio('9:16')}>📱 9:16</button>
                                                    <button className={`option-btn ${generationSettings.aspectRatio === '16:9' ? 'active' : ''}`} onClick={() => setAspectRatio('16:9')}>💻 16:9</button>
                                                </div>
                                                <div className="settings-grid-2col">
                                                    <button className={`option-btn ${generationSettings.changePose ? 'active' : ''}`} onClick={() => toggleGenerationSetting('changePose')}><span>💃 Đổi tư thế</span>{generationSettings.changePose && <span>✓</span>}</button>
                                                    <button className={`option-btn ${generationSettings.generateFullBody ? 'active' : ''}`} onClick={() => toggleGenerationSetting('generateFullBody')}><span>🧍 Toàn thân</span>{generationSettings.generateFullBody && <span>✓</span>}</button>
                                                    <button className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`} onClick={() => toggleGenerationSetting('changeBackground')} disabled={generationSettings.transparentBackground} style={generationSettings.transparentBackground ? {opacity: 0.5} : {}}><span>🏞️ Đổi nền</span>{generationSettings.changeBackground && !generationSettings.transparentBackground && <span>✓</span>}</button>
                                                    <button className={`option-btn ${generationSettings.transparentBackground ? 'active' : ''}`} onClick={() => toggleGenerationSetting('transparentBackground')}><span>🔳 Nền rỗng</span>{generationSettings.transparentBackground && <span>✓</span>}</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div className="mix-mode-grid">
                                 <div className="model-upload-center" style={{marginBottom: '20px'}}>
                                     <ImageUploader image={modelPreview} onImageSelect={(e) => handleFileChange(e, setModelFile, setModelPreview)}><p>+ Tải ảnh người mẫu</p></ImageUploader>
                                 </div>
                                 <div className="extracted-items">
                                     <ImageUploader label="Váy" image={dressImage} onImageSelect={(e)=>handleDirectGarmentUpload(e,'dress')} onRemove={()=>handleRemoveGarment('dress')} />
                                     <ImageUploader label="Áo" image={topImage} onImageSelect={(e)=>handleDirectGarmentUpload(e,'top')} onRemove={()=>handleRemoveGarment('top')} />
                                     <ImageUploader label="Quần" image={bottomImage} onImageSelect={(e)=>handleDirectGarmentUpload(e,'bottom')} onRemove={()=>handleRemoveGarment('bottom')} />
                                     <ImageUploader label="Giày" image={shoesImage} onImageSelect={(e)=>handleDirectGarmentUpload(e,'shoes')} onRemove={()=>handleRemoveGarment('shoes')} />
                                     <ImageUploader label="Trang sức" image={jewelryImage} onImageSelect={(e)=>handleDirectGarmentUpload(e,'jewelry')} onRemove={()=>handleRemoveGarment('jewelry')} />
                                     <ImageUploader label="Túi" image={bagImage} onImageSelect={(e)=>handleDirectGarmentUpload(e,'bag')} onRemove={()=>handleRemoveGarment('bag')} />
                                 </div>
                                 <div className="mix-mode-options">
                                     <div className="aspect-ratio-selector">
                                        <button className={`option-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setAspectRatio('9:16')}>📱 9:16</button>
                                        <button className={`option-btn ${generationSettings.aspectRatio === '16:9' ? 'active' : ''}`} onClick={() => setAspectRatio('16:9')}>💻 16:9</button>
                                    </div>
                                    <div className="settings-grid-2col" style={{marginTop:'10px'}}>
                                        <button className={`option-btn ${generationSettings.changePose ? 'active' : ''}`} onClick={() => toggleGenerationSetting('changePose')}>💃 Đổi tư thế</button>
                                        <button className={`option-btn ${generationSettings.generateFullBody ? 'active' : ''}`} onClick={() => toggleGenerationSetting('generateFullBody')}>🧍 Toàn thân</button>
                                        <button className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`} onClick={() => toggleGenerationSetting('changeBackground')} disabled={generationSettings.transparentBackground}>🏞️ Đổi nền</button>
                                        <button className={`option-btn ${generationSettings.transparentBackground ? 'active' : ''}`} onClick={() => toggleGenerationSetting('transparentBackground')}>🔳 Nền rỗng</button>
                                    </div>
                                 </div>
                             </div>
                        )}
                    </section>
                    
                    <section className="step-card full-width">
                        <h2><span className="step-number">{tryOnMode === 'full' ? '2' : '3'}</span> Hoàn Tất</h2>
                        <div className="finalize-box">
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
                                    {generationSettings.transparentBackground ? '✅ Nền trắng' : (generationSettings.changeBackground ? ' ✅ Bối cảnh mới' : ' 🔒 Giữ nền')} • 
                                    {generationSettings.generateFullBody ? ' ✅ Toàn thân' : ' 🔒 Giữ khung'} •
                                    {generationSettings.aspectRatio === '9:16' ? ' 📱 Dọc (9:16)' : ' 💻 Ngang (16:9)'}
                                </div>
                             </div>
                             <button className="btn btn-primary start-btn" onClick={handleGenerateTryOn} disabled={isGenerating || !modelFile}>
                                ✨ {isGenerating ? 'Đang xử lý...' : 'Bắt đầu ghép đồ'}
                             </button>
                        </div>
                    </section>

                    {(finalImage || isGenerating) && (<section className="step-card full-width"><h2>Kết quả</h2>{isGenerating ? <div style={{textAlign:'center'}}><div className="spinner"></div><p style={{marginTop:'10px', color:'#888'}}>Đang xử lý...</p></div> : <div style={{textAlign:'center'}}><img src={finalImage} style={{maxWidth:'100%', borderRadius:'8px'}}/><div style={{marginTop:'15px', display:'flex', gap:'10px', justifyContent:'center'}}><a href={finalImage} download="try-on-result.png" className="btn btn-primary" style={{textDecoration:'none'}}>💾 Tải về</a><button className="btn btn-secondary" onClick={()=>setFinalImage(null)}>🔄 Làm lại</button><button className="btn" style={{background:'#f59e0b', color:'white'}} onClick={()=>handleTransferToSkinFix(finalImage)}>✨ Fix da</button></div></div>}</section>)}
                 </main>
             )}

             {/* --- SWAP FACE TAB --- */}
             {activeTab === 'swap-face' && (
                 <main className="workflow-container">
                     <section className="step-card full-width">
                        <h2><span className="step-number">1</span> Dữ liệu Swap Face</h2>
                        <div className="dual-upload-container" style={{position:'relative', alignItems:'center'}}>
                            <button className="swap-btn" onClick={handleSwapImages} title="Đổi vị trí">↔️</button>
                            <div className="upload-box"><ImageUploader label="1. Body (Target)" image={swapTargetPreview} onImageSelect={(e) => handleFileChange(e, setSwapTargetFile, setSwapTargetPreview)} onRemove={()=>{setSwapTargetFile(null); setSwapTargetPreview(null)}}><p>Ảnh giữ Body</p></ImageUploader></div>
                            <div className="upload-box"><ImageUploader label="2. Face (Source)" image={swapSourcePreview} onImageSelect={(e) => handleFileChange(e, setSwapSourceFile, setSwapSourcePreview)} onRemove={()=>{setSwapSourceFile(null); setSwapSourcePreview(null)}}><p>Ảnh lấy Mặt</p></ImageUploader></div>
                        </div>

                        <div className="settings-panel">
                            <div className="settings-card">
                                <div className="settings-card-header"><label>Cài đặt tạo ảnh:</label></div>
                                <div className="option-toggles-list">
                                    <div className="aspect-ratio-selector">
                                        <button className={`option-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setAspectRatio('9:16')}>📱 9:16</button>
                                        <button className={`option-btn ${generationSettings.aspectRatio === '16:9' ? 'active' : ''}`} onClick={() => setAspectRatio('16:9')}>💻 16:9</button>
                                    </div>
                                    <div className="settings-grid-2col">
                                        <button className={`option-btn ${generationSettings.changePose ? 'active' : ''}`} onClick={() => toggleGenerationSetting('changePose')}><span>💃 Đổi tư thế</span>{generationSettings.changePose && <span>✓</span>}</button>
                                        <button className={`option-btn ${generationSettings.changeBackground ? 'active' : ''}`} onClick={() => toggleGenerationSetting('changeBackground')} disabled={generationSettings.transparentBackground}><span>🏞️ Đổi nền</span>{generationSettings.changeBackground && !generationSettings.transparentBackground && <span>✓</span>}</button>
                                        <button className={`option-btn ${generationSettings.transparentBackground ? 'active' : ''}`} onClick={() => toggleGenerationSetting('transparentBackground')}><span>🔳 Nền rỗng</span>{generationSettings.transparentBackground && <span>✓</span>}</button>
                                    </div>
                                    <div className="settings-card-header" style={{marginTop:'15px'}}><label>Biểu cảm:</label></div>
                                    <div className="aspect-ratio-selector" style={{flexWrap:'wrap'}}>
                                        <button className={`option-btn ${generationSettings.expression === 'default' ? 'active' : ''}`} onClick={() => setExpression('default')} style={{flex:1, minWidth:'80px'}}>😐 Gốc</button>
                                        <button className={`option-btn ${generationSettings.expression === 'happy' ? 'active' : ''}`} onClick={() => setExpression('happy')} style={{flex:1, minWidth:'80px'}}>😄 Vui</button>
                                        <button className={`option-btn ${generationSettings.expression === 'serious' ? 'active' : ''}`} onClick={() => setExpression('serious')} style={{flex:1, minWidth:'80px'}}>😎 Ngầu</button>
                                        <button className={`option-btn ${generationSettings.expression === 'surprised' ? 'active' : ''}`} onClick={() => setExpression('surprised')} style={{flex:1, minWidth:'80px'}}>😮 Wow</button>
                                        <button className={`option-btn ${generationSettings.expression === 'seductive' ? 'active' : ''}`} onClick={() => setExpression('seductive')} style={{flex:1, minWidth:'80px'}}>😏 Cuốn</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </section>

                     <section className="step-card full-width">
                        <h2><span className="step-number">2</span> Thực Hiện</h2>
                        <button className="btn btn-primary start-btn" onClick={handleSwapFace} disabled={isSwapping || !swapTargetFile || !swapSourceFile} style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
                            🎭 {isSwapping ? 'Đang xử lý...' : 'Bắt đầu Swap Face'}
                        </button>
                     </section>

                     {(swapResultImage || isSwapping) && (<section className="step-card full-width"><h2>Kết quả</h2>{isSwapping ? <div style={{textAlign:'center'}}><div className="spinner" style={{borderLeftColor:'#10b981'}}></div><p style={{marginTop:'10px', color:'#888'}}>Đang xử lý...</p></div> : <div style={{textAlign:'center'}}><img src={swapResultImage} style={{maxWidth:'100%', borderRadius:'8px'}}/><div style={{marginTop:'15px', display:'flex', gap:'10px', justifyContent:'center'}}><a href={swapResultImage} download="swap-result.png" className="btn btn-primary" style={{textDecoration:'none', background:'#10b981'}}>💾 Tải về</a><button className="btn btn-secondary" onClick={()=>setSwapResultImage(null)}>🔄 Làm lại</button><button className="btn" style={{background:'#f59e0b', color:'white'}} onClick={()=>handleTransferToSkinFix(swapResultImage)}>✨ Fix da</button></div></div>}</section>)}
                 </main>
             )}

            {/* --- FIX SKIN TAB --- */}
            {activeTab === 'fix-skin' && (
                <main className="workflow-container">
                    <button className="btn btn-secondary" onClick={() => setActiveTab('try-on')} style={{alignSelf: 'flex-start', marginBottom: '1rem'}}>← Quay lại Try-On</button>
                    <section className="step-card full-width">
                        <h2><span className="step-number">✨</span> Fix Da Nhựa (Skin Enhancer)</h2>
                        <div className="dual-upload-container" style={{alignItems: 'start'}}>
                            <div className="upload-box">
                                <h3 style={{color: '#a1a1aa', marginBottom: '10px', fontSize: '1rem'}}>Ảnh Gốc</h3>
                                <ImageUploader image={skinFixInputImage} onImageSelect={(e) => handleLocalImageUpload(e, setSkinFixInputImage, setSkinFixResultImage)} onRemove={()=>{setSkinFixInputImage(null); setSkinFixResultImage(null)}}><p>Tải ảnh để fix da</p></ImageUploader>
                                {skinFixInputImage && !isFixingSkin && !skinFixResultImage && (
                                     <button className="btn btn-primary" style={{width: '100%', marginTop: '10px'}} onClick={() => processSkinFix(skinFixInputImage)}>Bắt đầu Fix Da</button>
                                )}
                            </div>
                            <div className="upload-box">
                                <h3 style={{color: '#a1a1aa', marginBottom: '10px', fontSize: '1rem'}}>Kết Quả</h3>
                                {isFixingSkin ? (
                                    <div style={{textAlign: 'center', padding: '40px', background:'#252525', borderRadius:'10px'}}>
                                        <div className="spinner"></div>
                                        <p style={{marginTop: '15px', color: '#888'}}>Đang tái tạo bề mặt da...</p>
                                    </div>
                                ) : skinFixResultImage ? (
                                    <div>
                                        <img src={skinFixResultImage} style={{width: '100%', borderRadius: '8px'}} alt="Fixed" />
                                        <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                            <a href={skinFixResultImage} download="skin-fix-result.png" className="btn btn-primary" style={{textDecoration: 'none'}}>💾 Tải về</a>
                                             <button className="btn" style={{ background: 'linear-gradient(to right, #c084fc, #e879f9)', color: 'black', border: 'none', fontWeight: 600 }} onClick={() => handleTransferToBreastLift(skinFixResultImage)}>👙 Nâng Ngực Tiếp</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{padding: '40px', textAlign: 'center', color: '#666', background:'#252525', borderRadius:'10px', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>Chưa có kết quả</div>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
            )}
            
            {/* --- BREAST LIFT TAB --- */}
            {activeTab === 'breast-lift' && (
                <main className="workflow-container">
                    <button className="btn btn-secondary" onClick={() => setActiveTab('try-on')} style={{alignSelf: 'flex-start', marginBottom: '1rem'}}>← Quay lại Try-On</button>
                    <section className="step-card full-width">
                         <h2><span className="step-number">👙</span> AI Nâng Ngực (Body Enhancer)</h2>
                         <div className="dual-upload-container" style={{alignItems: 'start'}}>
                            <div className="upload-box">
                                <h3 style={{color: '#a1a1aa', marginBottom: '10px', fontSize: '1rem'}}>Ảnh Gốc</h3>
                                <ImageUploader image={breastLiftInputImage} onImageSelect={(e) => handleLocalImageUpload(e, setBreastLiftInputImage, setBreastLiftResultImage)} onRemove={()=>{setBreastLiftInputImage(null); setBreastLiftResultImage(null)}}><p>Tải ảnh để nâng ngực</p></ImageUploader>
                                {breastLiftInputImage && !isLiftingBreast && !breastLiftResultImage && (
                                     <button className="btn btn-primary" style={{width: '100%', marginTop: '10px'}} onClick={() => processBreastLift(breastLiftInputImage)}>Bắt đầu Nâng Ngực</button>
                                )}
                            </div>
                            <div className="upload-box">
                                <h3 style={{color: '#a1a1aa', marginBottom: '10px', fontSize: '1rem'}}>Kết Quả</h3>
                                {isLiftingBreast ? (
                                    <div style={{textAlign: 'center', padding: '40px', background:'#252525', borderRadius:'10px'}}>
                                        <div className="spinner"></div>
                                        <p style={{marginTop: '15px', color: '#888'}}>Đang chỉnh sửa hình thể...</p>
                                    </div>
                                ) : breastLiftResultImage ? (
                                    <div>
                                        <img src={breastLiftResultImage} style={{width: '100%', borderRadius: '8px'}} alt="Lifted" />
                                        <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                            <a href={breastLiftResultImage} download="body-lift-result.png" className="btn btn-primary" style={{textDecoration: 'none'}}>💾 Tải về</a>
                                            <button className="btn btn-secondary" onClick={() => {
                                                    const newImage = breastLiftResultImage;
                                                    setBreastLiftInputImage(newImage);
                                                    setBreastLiftResultImage(null);
                                                    processBreastLift(newImage);
                                            }}>🔄 Nâng tiếp</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{padding: '40px', textAlign: 'center', color: '#666', background:'#252525', borderRadius:'10px', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>Chưa có kết quả</div>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
            )}

            {/* --- AI INFLUENCER TAB --- */}
            {activeTab === 'ai-influencer' && (
                <div className="workflow-container">
                    <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
                         <button 
                            className="btn" 
                            style={{background: '#333', color: '#fff', fontSize: '0.9rem', padding: '8px 16px', border: '1px solid #444'}}
                            onClick={randomizeInfluencer}
                        >
                            🎲 Ngẫu nhiên hóa (Random)
                        </button>
                    </div>

                    <section className="step-card full-width">
                        <h2><span className="step-number">1</span> Thiết Kế Nhân Vật</h2>
                        
                        <div className="influencer-form-group">
                            <div className="form-row">
                                <div className="form-item">
                                    <label className="form-label">Giới tính</label>
                                    <select 
                                        className="form-select"
                                        value={influencerSettings.gender}
                                        onChange={(e) => handleInfluencerSettingChange('gender', e.target.value)}
                                    >
                                        {INFLUENCER_DATA.genders.map((opt, i) => (
                                            <option key={i} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-item">
                                    <label className="form-label">Độ tuổi</label>
                                    <select 
                                        className="form-select"
                                        value={influencerSettings.age}
                                        onChange={(e) => handleInfluencerSettingChange('age', e.target.value)}
                                    >
                                        {INFLUENCER_DATA.ages.map((opt, i) => (
                                            <option key={i} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-item">
                                    <label className="form-label">Sắc tộc / Xuất xứ</label>
                                    <select 
                                        className="form-select"
                                        value={influencerSettings.ethnicity}
                                        onChange={(e) => handleInfluencerSettingChange('ethnicity', e.target.value)}
                                    >
                                        {INFLUENCER_DATA.ethnicities.map((opt, i) => (
                                            <option key={i} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-item">
                                    <label className="form-label">Dáng người</label>
                                    <select 
                                        className="form-select"
                                        value={influencerSettings.bodyType}
                                        onChange={(e) => handleInfluencerSettingChange('bodyType', e.target.value)}
                                    >
                                        {INFLUENCER_DATA.bodyTypes.map((opt, i) => (
                                            <option key={i} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-item">
                                    <label className="form-label">Màu mắt</label>
                                    <select 
                                        className="form-select"
                                        value={influencerSettings.eyes}
                                        onChange={(e) => handleInfluencerSettingChange('eyes', e.target.value)}
                                    >
                                        {INFLUENCER_DATA.eyes.map((opt, i) => (
                                            <option key={i} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* HAIR BUILDER SECTION */}
                            <div style={{background: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333'}}>
                                <label className="form-label" style={{color: '#f59e0b', marginBottom: '10px'}}>Thiết kế kiểu tóc</label>
                                <div className="form-row" style={{marginBottom: '10px'}}>
                                    <div className="form-item">
                                        <select className="form-select" style={{fontSize: '0.85rem'}} value={hairBuilder.length} onChange={(e) => updateHairFromBuilder({length: e.target.value})}>
                                            {INFLUENCER_DATA.hairOptions.lengths.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-item">
                                        <select className="form-select" style={{fontSize: '0.85rem'}} value={hairBuilder.color} onChange={(e) => updateHairFromBuilder({color: e.target.value})}>
                                            {INFLUENCER_DATA.hairOptions.colors.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-item">
                                        <select className="form-select" style={{fontSize: '0.85rem'}} value={hairBuilder.texture} onChange={(e) => updateHairFromBuilder({texture: e.target.value})}>
                                            {INFLUENCER_DATA.hairOptions.textures.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-item">
                                        <select className="form-select" style={{fontSize: '0.85rem'}} value={hairBuilder.bangs} onChange={(e) => updateHairFromBuilder({bangs: e.target.value})}>
                                            {INFLUENCER_DATA.hairOptions.bangs.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-item" style={{flex: 2}}>
                                         <input 
                                            type="text" 
                                            className="form-input" 
                                            value={influencerSettings.hair}
                                            onChange={(e) => handleInfluencerSettingChange('hair', e.target.value)}
                                            placeholder="Mô tả tóc chi tiết (tiếng Anh hoặc Việt)..."
                                        />
                                    </div>
                                    <div className="form-item" style={{flex: 1}}>
                                        <select 
                                            className="form-select" 
                                            onChange={(e) => {
                                                if(e.target.value) handleInfluencerSettingChange('hair', e.target.value);
                                            }}
                                            value=""
                                        >
                                            <option value="" disabled>Chọn Mẫu Tóc...</option>
                                            {INFLUENCER_DATA.hairOptions.presets.map((p, i) => (
                                                <option key={i} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="step-card full-width">
                        <h2><span className="step-number">2</span> Phong Cách & Bối Cảnh</h2>
                        <div className="influencer-form-group">
                            <div className="form-item">
                                <label className="form-label">Phong cách thời trang</label>
                                <select 
                                    className="form-select"
                                    value={influencerSettings.style}
                                    onChange={(e) => handleInfluencerSettingChange('style', e.target.value)}
                                >
                                    {INFLUENCER_DATA.styles.map((opt, i) => (
                                        <option key={i} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-item">
                                <label className="form-label">Bối cảnh / Hoạt động</label>
                                <div className="form-row" style={{marginBottom: '10px'}}>
                                    <select 
                                        className="form-select"
                                        onChange={(e) => handleInfluencerSettingChange('scenario', e.target.value)}
                                        value=""
                                    >
                                        <option value="" disabled>Chọn bối cảnh mẫu...</option>
                                        {Object.entries(INFLUENCER_DATA.scenarios).map(([category, options]) => (
                                            <optgroup key={category} label={category}>
                                                {options.map((opt, i) => (
                                                    <option key={i} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <textarea 
                                    className="form-textarea" 
                                    value={influencerSettings.scenario}
                                    onChange={(e) => handleInfluencerSettingChange('scenario', e.target.value)}
                                    placeholder="Hoặc tự mô tả chi tiết bối cảnh..."
                                />
                            </div>
                            
                            <div className="form-item">
                                <label className="form-label">Tỉ lệ khung hình</label>
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
                                     <button 
                                        className={`option-btn ${generationSettings.aspectRatio === '1:1' ? 'active' : ''}`}
                                        onClick={() => setAspectRatio('1:1')}
                                    >
                                        ⏹ Vuông (1:1)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="step-card full-width">
                        <h2><span className="step-number">3</span> Tạo Influencer</h2>
                         <button 
                            className="btn btn-primary start-btn" 
                            style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}
                            onClick={handleCreateInfluencer} 
                            disabled={isCreatingInfluencer}
                        >
                            🌟 {isCreatingInfluencer ? 'Đang tạo nhân vật...' : 'Tạo AI Influencer'}
                        </button>
                    </section>

                    {(influencerResultImage || isCreatingInfluencer) && (
                        <section className="step-card full-width">
                            <h2><span className="step-number">✨</span> Kết Quả</h2>
                            <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                {isCreatingInfluencer ? (
                                    <div style={{textAlign: 'center'}}>
                                        <div className="spinner" style={{borderLeftColor: '#f59e0b'}}></div>
                                        <p style={{ marginTop: '15px', color: '#a1a1aa' }}>Đang vẽ nhân vật ảo...</p>
                                    </div>
                                ) : (
                                    influencerResultImage && (
                                        <div style={{ width: '100%', textAlign: 'center' }}>
                                            <img src={influencerResultImage} alt="Influencer Result" style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)' }} />
                                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                <a href={influencerResultImage} download={getDownloadFileName('ai-influencer')} className="btn btn-primary" style={{textDecoration: 'none', background: '#f59e0b'}}>💾 Tải về</a>
                                                <button className="btn btn-secondary" onClick={() => setInfluencerResultImage(null)}>🔄 Tạo lại</button>
                                                <button 
                                                    className="btn" 
                                                    style={{ background: '#3b82f6', color: 'white' }}
                                                    onClick={() => {
                                                        setModelPreview(influencerResultImage);
                                                        fetch(influencerResultImage)
                                                            .then(res => res.blob())
                                                            .then(blob => {
                                                                const file = new File([blob], "ai-influencer.png", { type: "image/png" });
                                                                setModelFile(file);
                                                                setActiveTab('try-on');
                                                            });
                                                    }}
                                                >
                                                    👗 Dùng làm Mẫu Try-On
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);