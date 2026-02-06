import React, { useState, useEffect, useRef, useId } from 'react';
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
    skinTones: [
        { label: 'Trắng sáng (Fair)', value: 'Fair/Pale skin' },
        { label: 'Trắng hồng (Light)', value: 'Light skin with pink undertone' },
        { label: 'Trung bình (Medium)', value: 'Medium/Tan skin' },
        { label: 'Ngăm (Olive)', value: 'Olive skin' },
        { label: 'Nâu (Brown)', value: 'Brown/Dark skin' },
        { label: 'Đen (Black)', value: 'Black/Very dark skin' }
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

const BACKGROUND_PRESETS = [
    { label: 'Cửa hàng thời trang cao cấp', value: 'A high-end luxury clothing store with warm lighting, shelves of clothes in the background, elegant interior design.' },
    { label: 'Quán cà phê ấm cúng', value: 'A cozy coffee shop with wooden furniture, warm ambient light, blurred customers in the background, peaceful atmosphere.' },
    { label: 'Bãi biển nắng vàng', value: 'A beautiful sunny beach with blue ocean water, white sand, bright natural sunlight, summer vibe.' },
    { label: 'Văn phòng hiện đại', value: 'A modern corporate office with glass walls, city view from the window, professional environment.' },
    { label: 'Đường phố đô thị', value: 'A busy urban street with city buildings, blurred traffic, daytime, street fashion vibe.' },
    { label: 'Studio tối giản (Xám)', value: 'A professional photo studio with a plain grey seamless background, soft studio lighting.' },
    { label: 'Tháp Eiffel (Paris)', value: 'Outdoor scene in Paris with the Eiffel Tower in the distance, romantic atmosphere, soft daylight.' },
    { label: 'Tokyo đêm đèn Neon', value: 'Tokyo street at night with bright neon signs, cyberpunk vibe, colorful lighting.' },
    { label: 'Công viên xanh mát', value: 'A green park with trees, flowers, soft sunlight filtering through leaves, nature background.' },
    { label: 'Sảnh khách sạn 5 sao', value: 'A 5-star hotel lobby with marble floors, chandeliers, expensive furniture, golden lighting.' },
    { label: 'Phòng Gym / Thể hình', value: 'A modern gym with workout equipment in the background, energetic atmosphere.' },
    { label: 'Thư viện / Nhà sách', value: 'A quiet library with rows of bookshelves, academic atmosphere, soft indoor lighting.' },
    { label: 'Quán Bar sân thượng', value: 'A rooftop bar at sunset with a cocktail in hand, city skyline view, chill vibe.' },
    { label: 'Nền Gradient trừu tượng', value: 'A soft abstract gradient background with pastel colors, modern and clean.' },
    { label: 'Căn phòng cổ điển (Vintage)', value: 'A vintage style room with retro furniture, warm colors, nostalgic mood.' },
    { label: 'Núi tuyết hùng vĩ', value: 'A winter landscape with snow-covered mountains, cold refreshing air, bright white daylight.' },
    { label: 'Cánh đồng hoa', value: 'A vast field of blooming flowers, bright colors, spring season vibe.' },
    { label: 'Tường gạch trắng', value: 'A simple white brick wall background, urban grunge but clean texture.' },
    { label: 'Nội thất xe sang', value: 'Sitting inside a luxury car with leather seats, dashboard visible.' },
    { label: 'Sự kiện thảm đỏ', value: 'A red carpet event with paparazzi flashlights in the background, glamorous night.' },
    // --- NEW PRESETS ---
    { label: 'Du thuyền sang trọng', value: 'On the deck of a luxury yacht cruising on the open sea, blue sky, white railing, expensive lifestyle.' },
    { label: 'Hồ bơi biệt thự', value: 'Poolside at a modern luxury villa, crystal clear blue water, lounge chairs, sunny day.' },
    { label: 'Sân bay quốc tế', value: 'Inside a modern international airport terminal, large glass windows with airplanes visible outside, traveler vibe.' },
    { label: 'Máy bay tư nhân', value: 'Interior of a luxury private jet, leather seats, champagne glass, view of clouds through the window.' },
    { label: 'Rừng nhiệt đới', value: 'Lush green tropical rainforest, ferns, sunlight filtering through canopy, nature exploration.' },
    { label: 'Sa mạc hoàng hôn', value: 'Vast sand dunes in the desert during sunset, golden and orange sky, dramatic shadows.' },
    { label: 'Thành phố tương lai', value: 'Futuristic sci-fi city with flying cars, holograms, tall skyscrapers, blue and purple neon lights.' },
    { label: 'Sân Golf', value: 'Green manicured golf course with sand traps, sunny day, country club atmosphere.' },
    { label: 'Sân Tennis', value: 'Professional hard court tennis court, bright blue surface, net in background, sporty vibe.' },
    { label: 'Phòng tranh nghệ thuật', value: 'Contemporary art gallery with white walls, abstract paintings, soft spotlighting.' },
    { label: 'Đường phố New York', value: 'Busy New York City street with yellow taxis, tall skyscrapers, Times Square billboards.' },
    { label: 'Santorini (Hy Lạp)', value: 'White buildings with blue domes in Santorini, Greece, overlooking the Aegean Sea, bright sunlight.' },
    { label: 'Cánh đồng lúa chín', value: 'Golden rice paddy fields ready for harvest, peaceful countryside scenery.' },
    { label: 'Phố cổ Hội An', value: 'Ancient street in Hoi An with yellow walls, colorful lanterns glowing at night, traditional vibe.' },
    { label: 'Cầu Vàng (Đà Nẵng)', value: 'The Golden Bridge in Da Nang held by giant stone hands, misty mountains in the background.' },
    { label: 'Mùa thu Hàn Quốc', value: 'Street lined with yellow ginkgo trees in autumn, fallen leaves on the ground, romantic atmosphere.' },
    { label: 'Hoa anh đào Nhật Bản', value: 'Park filled with blooming pink cherry blossom trees, petals falling, spring season.' },
    { label: 'Thảo nguyên xanh', value: 'Endless green grass steppe under a blue sky with fluffy white clouds, freedom vibe.' },
    { label: 'Nhà thờ Gothic', value: 'In front of a majestic ancient Gothic cathedral with intricate stone carvings, dramatic lighting.' },
    { label: 'Cầu thang xoắn ốc', value: 'Artistic shot on a grand spiral staircase, elegant architecture, high angle view.' },
    { label: 'Phòng ngủ ấm cúng', value: 'A cozy bedroom with unmade bed, soft morning light, white sheets, lazy sunday vibe.' },
    { label: 'Bếp hiện đại', value: 'A clean modern kitchen with marble countertops, stainless steel appliances, bright lighting.' },
    { label: 'Siêu thị', value: 'Aisle of a well-stocked supermarket with colorful products on shelves, everyday lifestyle.' },
    { label: 'Tiệm hoa', value: 'Inside a flower shop surrounded by buckets of colorful fresh flowers, rustic and charming.' },
    { label: 'Sân khấu ca nhạc', value: 'On a concert stage with spotlights beaming down, smoke effects, rockstar atmosphere.' },
    { label: 'Bến cảng', value: 'A harbor dock with fishing boats or sailboats, wooden pier, calm water.' },
    { label: 'Khu cắm trại', value: 'Camping site in the woods with a tent, campfire, string lights, cozy evening.' },
    { label: 'Đường hầm ánh sáng', value: 'A tunnel illuminated with LED lights, creating a leading line, artistic and modern.' },
    { label: 'Vũ trụ / Phi thuyền', value: 'Inside a sci-fi spaceship corridor or looking out into the galaxy with stars and planets.' },
    { label: 'Dưới nước', value: 'Underwater concept with blue water, bubbles, light rays from surface, ethereal dreamlike quality.' }
];

const VIDEO_PROMPT_TEMPLATES = [
    "Một video thời trang dài 8 giây, cô gái đứng giữa khung hình, mặc váy nhẹ nhàng, hai tay thả lỏng, xoay nhẹ thân người, ánh mắt nhìn camera tự tin, camera pan ngang mượt, ánh sáng mềm điện ảnh",
    "Một video thời trang dài 8 giây, cô gái bước chậm về phía camera, váy chuyển động theo từng bước chân, gương mặt thư giãn, camera dolly-in nhẹ tạo cảm giác cao cấp",
    "Một video thời trang dài 8 giây, cô gái đứng trước gương toàn thân, một tay cầm điện thoại, tay còn lại chạm nhẹ vạt váy, xoay nhẹ người, ánh mắt nhìn vào gương, camera trượt ngang",
    "Một video thời trang dài 8 giây, cô gái đứng nghiêng 48 độ, tay đặt lên hông làm nổi bật form váy, quay đầu nhìn camera với nụ cười tinh tế, camera pan chậm, ánh sáng studio",
    "Một video thời trang dài 8 giây, cô gái bước ngang khung hình, dừng lại giữa cảnh, váy bay nhẹ theo chuyển động, ánh mắt nhìn trực diện camera, camera theo chuyển động mượt",
    "Một video thời trang dài 8 giây, cô gái đứng yên, khẽ xoay vai và thân trên để lộ chi tiết váy, ánh mắt dịu dàng nhìn camera, camera zoom nhẹ tạo chiều sâu",
    "Một video thời trang dài 8 giây, cô gái đứng cạnh cửa sổ, ánh sáng tự nhiên chiếu vào, cô xoay nhẹ người, váy bắt sáng mềm mại, camera pan ngang phong cách cinematic",
    "Một video thời trang dài 8 giây, cô gái quay lưng về phía camera, sau đó từ từ quay đầu lại, váy chuyển động nhẹ, ánh mắt chạm ống kính, camera di chuyển vòng cung",
    "Một video thời trang dài 8 giây, cô gái bước xuống bậc thềm, váy rũ tự nhiên theo từng bước, quay đầu nhìn camera với nụ cười nhẹ, camera góc thấp tạo cảm giác thời trang",
    "Một video thời trang dài 8 giây, cô gái đứng trước gương lớn, một tay đặt lên eo, tay còn lại thả lỏng, xoay nhẹ thân người, camera pan ngang làm nổi bật form dáng váy",
    "Một video thời trang dài 8 giây, cô gái đứng giữa khung hình, gió nhẹ làm váy bay tự nhiên, ánh mắt nhìn camera bình thản, camera trượt ngang chậm",
    "Một video thời trang dài 8 giây, cô gái nâng nhẹ vạt váy, xoay người nửa vòng, ánh mắt luôn hướng về camera, camera dolly theo chuyển động tạo cảm giác cao cấp",
    "Một video thời trang dài 8 giây, cô gái bước một bước về phía trước, váy chuyển động mềm mại, dừng lại và nhìn camera tự tin, camera dolly-in mượt",
    "Một video thời trang dài 8 giây, cô gái đứng nghiêng, tay chạm nhẹ vào chi tiết váy, đầu hơi nghiêng, nụ cười mỉm, camera zoom nhẹ nhấn mạnh sản phẩm",
    "Một video thời trang dài 8 giây, cô gái quay nhẹ tại chỗ, váy xoay theo chuyển động, ánh mắt gặp camera ở cuối vòng xoay, camera theo vòng tròn mượt",
    "Một video thời trang dài 8 giây, cô gái đứng cạnh lan can, một tay đặt lên lan can, tay kia thả lỏng, váy rũ tự nhiên, camera pan nhẹ kết hợp ánh sáng tự nhiên",
    "Một video thời trang dài 8 giây, cô gái bước chéo khung hình, váy bay nhẹ, dừng lại và xoay mặt về camera, biểu cảm tự tin, camera theo chuyển động",
    "Một video thời trang dài 8 giây, cô gái đứng yên, khẽ chỉnh lại vạt váy, sau đó nhìn lên camera với ánh mắt cuốn hút, camera tiến gần để nhấn chi tiết",
    "Một video thời trang dài 8 giây, cô gái đứng giữa không gian tối giản, váy màu trung tính, xoay nhẹ thân trên, ánh mắt nhìn camera với thần thái model, camera pan mượt",
    "Một video thời trang dài 8 giây, cô gái bước chậm về phía trước, váy chuyển động mềm theo từng bước, dừng lại giữa khung hình và mỉm cười nhẹ, camera dolly-in điện ảnh"
];

// --- UTILS ---
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

// Stable Image Uploader using useId
const ImageUploader = ({ label, image, onImageSelect, onRemove, children, onRemoveBg }: { 
    label?: string; 
    image: string | null; 
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    onRemove?: () => void;
    onRemoveBg?: () => void;
    children?: React.ReactNode;
}) => {
    const uniqueId = useId();
    const inputId = `file-upload-${uniqueId}`;

    return (
        <div className="uploader-wrapper">
             {label && <span className="vip-upload-label">{label}</span>}
             <div className="vip-upload-area" onClick={() => document.getElementById(inputId)?.click()}>
                 {image ? (
                     <>
                        <img src={image} alt="Preview" />
                        <button onClick={(e) => { e.stopPropagation(); onRemove && onRemove(); }} style={{position: 'absolute', top: 5, right: 5, background: 'rgba(255,0,0,0.8)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: 'white', cursor: 'pointer'}}>×</button>
                     </>
                 ) : (
                     <div style={{textAlign: 'center', color: '#666', fontSize: '0.9rem'}}>
                         {children || <span>+ Tải ảnh</span>}
                     </div>
                 )}
                 <input id={inputId} type="file" accept="image/*" onChange={onImageSelect} className="hidden-input" />
             </div>
        </div>
    );
};

// Helper to safely extract image from Gemini response
const extractImageFromResponse = (response: any): string | null => {
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
};

// Function to handle download
const handleDownload = (url: string, prefix: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

type Expression = 'default' | 'happy' | 'serious' | 'surprised' | 'seductive' | 'angry' | 'sad' | 'pout';

const EXPRESSION_OPTIONS: { id: Expression; label: string; icon: string }[] = [
    { id: 'default', label: 'Gốc', icon: '😐' },
    { id: 'happy', label: 'Vui', icon: '😄' },
    { id: 'serious', label: 'Ngầu', icon: '😎' },
    { id: 'surprised', label: 'Wow', icon: '😮' },
    { id: 'seductive', label: 'Cuốn', icon: '😏' },
    { id: 'angry', label: 'Giận', icon: '😠' },
    { id: 'sad', label: 'Buồn', icon: '😢' },
    { id: 'pout', label: 'Dỗi', icon: '🥺' },
];

const VIDEO_MODELS = [
    { value: 'veo-3.1-generate-preview', label: 'Veo 3.1 Pro (High Quality - 1080p Ready)' },
    { value: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast (Preview Speed)' }
];

// --- RECOMMENDED MODELS ---
const RECOMMENDED_MODELS = [
    { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image (Tốc độ cao - Nano Banana)' },
    { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image (Chất lượng cao - Nano Banana Pro)' },
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Đa năng - Text/Code)' },
    { value: 'veo-3.1-generate-preview', label: 'Veo 3.1 Pro (Video HQ)' },
    { value: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast (Video Fast)' }
];

const App = () => {
    // --- API MANAGEMENT STATE ---
    const [modelName, setModelName] = useState('gemini-2.5-flash-image'); // Default per system instructions
    const [showSettings, setShowSettings] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    
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

    // Change Background Mode State
    const [bgSourceFile, setBgSourceFile] = useState<File | null>(null);
    const [bgSourcePreview, setBgSourcePreview] = useState<string | null>(null);
    const [bgCustomFile, setBgCustomFile] = useState<File | null>(null);
    const [bgCustomPreview, setBgCustomPreview] = useState<string | null>(null);
    const [bgSelectedPreset, setBgSelectedPreset] = useState<string>('');
    const [bgResultImage, setBgResultImage] = useState<string | null>(null);
    const [isChangingBg, setIsChangingBg] = useState(false);

    // Create Video (Veo) Mode State
    const [videoPrompt, setVideoPrompt] = useState('');
    const [videoInputFile, setVideoInputFile] = useState<File | null>(null);
    const [videoInputPreview, setVideoInputPreview] = useState<string | null>(null);
    const [videoResultUrl, setVideoResultUrl] = useState<string | null>(null);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoProgress, setVideoProgress] = useState<string>('');
    const [videoModel, setVideoModel] = useState('veo-3.1-fast-generate-preview'); 
    const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('720p');


    // AI Influencer Mode State (Unchanged functionality)
    const [influencerSettings, setInfluencerSettings] = useState({
        gender: 'Female',
        age: '20s (Young Adult)',
        ethnicity: 'Asian (Vietnamese)',
        skinTone: 'Light skin with pink undertone',
        hair: 'Long Natural black Straight silky hair with Airy bangs (Korean style)',
        eyes: 'Dark brown',
        bodyType: 'Slim & fit',
        style: 'Modern luxury, high-end fashion, old money vibe',
        scenario: 'Drinking coffee in a cozy cafe, morning sunlight through window'
    });
    const [influencerHistory, setInfluencerHistory] = useState<typeof influencerSettings[]>([]);
    const [influencerRefFile, setInfluencerRefFile] = useState<File | null>(null);
    const [influencerRefPreview, setInfluencerRefPreview] = useState<string | null>(null);
    const [influencerRefOptions, setInfluencerRefOptions] = useState({ style: false, face: false, body: false, outfit: false });
    const [hairBuilder, setHairBuilder] = useState({ length: 'Long', color: 'Natural black', texture: 'Straight silky', bangs: 'Airy bangs (Korean style)' });
    const [influencerResultImage, setInfluencerResultImage] = useState<string | null>(null);
    const [isCreatingInfluencer, setIsCreatingInfluencer] = useState(false);

    // Full Mode State
    const [fullOutfitFile, setFullOutfitFile] = useState<File | null>(null);
    const [fullOutfitPreview, setFullOutfitPreview] = useState<string | null>(null);
    const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
    const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
    const [modelEditPrompt, setModelEditPrompt] = useState('');
    const [productEditPrompt, setProductEditPrompt] = useState('');
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [fullSetOptions, setFullSetOptions] = useState({ clothing: true, shoes: false, jewelry: false, bag: false });

    // Mix Mode State
    const [dressImage, setDressImage] = useState<string | null>(null);
    const [topImage, setTopImage] = useState<string | null>(null);
    const [bottomImage, setBottomImage] = useState<string | null>(null);
    const [shoesImage, setShoesImage] = useState<string | null>(null);
    const [jewelryImage, setJewelryImage] = useState<string | null>(null);
    const [bagImage, setBagImage] = useState<string | null>(null);
    const [mixFiles, setMixFiles] = useState<{ [key: string]: File | null }>({});

    const [generationSettings, setGenerationSettings] = useState({
        aspectRatio: '9:16',
        changePose: false,
        changeBackground: false,
        generateFullBody: false,
        transparentBackground: false,
        expression: 'default' as Expression
    });

    // --- INITIALIZATION ---
    useEffect(() => {
        const storedModelName = localStorage.getItem('gemini_model_name');
        
        if (storedModelName) {
            setModelName(storedModelName);
        }
    }, []);

    const handleModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setModelName(newName);
        localStorage.setItem('gemini_model_name', newName);
    };

    const updateHairFromBuilder = (newPart: Partial<typeof hairBuilder>) => {
        const newBuilder = { ...hairBuilder, ...newPart };
        setHairBuilder(newBuilder);
        const hairStr = `${newBuilder.length} ${newBuilder.color} ${newBuilder.texture} hair with ${newBuilder.bangs}`;
        setInfluencerSettings(prev => ({ ...prev, hair: hairStr }));
    };

    const randomizeInfluencer = () => {
        setInfluencerHistory(prev => [...prev, influencerSettings]);
        const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
        const randomOption = (arr: {value: string}[]) => randomItem(arr).value;
        const len = randomItem(INFLUENCER_DATA.hairOptions.lengths);
        const col = randomItem(INFLUENCER_DATA.hairOptions.colors);
        const tex = randomItem(INFLUENCER_DATA.hairOptions.textures);
        const bng = randomItem(INFLUENCER_DATA.hairOptions.bangs);
        const hairStr = `${len.value} ${col.value} ${tex.value} hair with ${bng.value}`;
        setHairBuilder({ length: len.value, color: col.value, texture: tex.value, bangs: bng.value });
        const allScenarios = Object.values(INFLUENCER_DATA.scenarios).flat();
        setInfluencerSettings({
            gender: randomOption(INFLUENCER_DATA.genders),
            age: randomOption(INFLUENCER_DATA.ages),
            ethnicity: randomOption(INFLUENCER_DATA.ethnicities),
            skinTone: randomOption(INFLUENCER_DATA.skinTones),
            hair: hairStr,
            eyes: randomOption(INFLUENCER_DATA.eyes),
            bodyType: randomOption(INFLUENCER_DATA.bodyTypes),
            style: randomOption(INFLUENCER_DATA.styles),
            scenario: randomOption(allScenarios)
        });
    };

    const undoRandomize = () => {
        if (influencerHistory.length === 0) return;
        const previousState = influencerHistory[influencerHistory.length - 1];
        setInfluencerSettings(previousState);
        setInfluencerHistory(prev => prev.slice(0, -1));
    };

    const toggleInfluencerRefOption = (option: keyof typeof influencerRefOptions) => {
        setInfluencerRefOptions(prev => ({ ...prev, [option]: !prev[option] }));
    };

    const executeWithRotation = async <T,>(operation: (apiKey: string) => Promise<T>): Promise<T> => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key chưa được cấu hình (process.env.API_KEY).");
        
        try {
            return await operation(apiKey);
        } catch (err: any) {
             if (err.message && (err.message.includes("AI không trả về ảnh") || err.message.includes("Safety"))) {
                 throw err; 
            }
            throw new Error(`Lỗi API: ${err.message}`);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void, setPreview: (s: string | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleMixFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMixFiles(prev => ({ ...prev, [category]: file }));
            const url = URL.createObjectURL(file);
            if(category === 'dress') setDressImage(url);
            if(category === 'top') setTopImage(url);
            if(category === 'bottom') setBottomImage(url);
            if(category === 'shoes') setShoesImage(url);
            if(category === 'jewelry') setJewelryImage(url);
            if(category === 'bag') setBagImage(url);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === 'string') resolve(reader.result.split(',')[1]);
                else reject(new Error("Failed to read file"));
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSwapImages = () => {
        const tempFile = swapTargetFile; setSwapTargetFile(swapSourceFile); setSwapSourceFile(tempFile);
        const tempPreview = swapTargetPreview; setSwapTargetPreview(swapSourcePreview); setSwapSourcePreview(tempPreview);
    };

    const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (referenceFiles.length >= 3) { alert("Tối đa 3 ảnh tham khảo."); return; }
            const file = e.target.files[0];
            setReferenceFiles(prev => [...prev, file]);
            setReferencePreviews(prev => [...prev, URL.createObjectURL(file)]);
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

    const toggleFullSetOption = (key: keyof typeof fullSetOptions) => setFullSetOptions(prev => ({ ...prev, [key]: !prev[key] }));
    const setAspectRatio = (ratio: string) => setGenerationSettings(prev => ({ ...prev, aspectRatio: ratio }));
    const setExpression = (expr: Expression) => setGenerationSettings(prev => ({ ...prev, expression: expr }));
    const toggleGenerationSetting = (key: keyof typeof generationSettings) => setGenerationSettings(prev => ({ ...prev, [key]: !prev[key] }));

    const handleInfluencerSettingChange = (field: string, value: string) => setInfluencerSettings(prev => ({ ...prev, [field]: value }));

    const handleCreateInfluencer = async () => {
        setIsCreatingInfluencer(true); setInfluencerResultImage(null); setError(null);
        try {
            const { gender, age, ethnicity, skinTone, hair, eyes, bodyType, style, scenario } = influencerSettings;
            const parts: any[] = [];
             if (influencerRefFile) {
                const refB64 = await fileToBase64(influencerRefFile);
                let refPrompt = "REFERENCE IMAGE INSTRUCTIONS:\n";
                if (influencerRefOptions.style) refPrompt += "- **STYLE/LIGHTING**: Mimic the lighting, color grading, and photography style of this reference image.\n";
                if (influencerRefOptions.face) refPrompt += "- **FACE**: Use the facial features and identity from this image as the base (blended with text description).\n";
                if (influencerRefOptions.body) refPrompt += "- **POSE/BODY**: Replicate the exact pose and body structure shown here.\n";
                if (influencerRefOptions.outfit) refPrompt += "- **OUTFIT**: Wear the clothing shown in this image.\n";
                parts.push({ text: refPrompt });
                parts.push({ inlineData: { mimeType: influencerRefFile.type, data: refB64 } });
            }
            let textPrompt = `TASK: Create a High-End Virtual Influencer (AI KOL). ${gender}, ${age}, ${ethnicity}, ${skinTone}, ${hair}, ${eyes}, ${bodyType}. Style: ${style}. Scenario: ${scenario}. High quality photography.`;
            parts.push({ text: textPrompt });
            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await ai.models.generateContent({ model: modelName, contents: { parts: parts } });
                const finalUrl = extractImageFromResponse(response);
                if (!finalUrl) throw new Error("AI không trả về ảnh (Model có thể chỉ trả về text)");
                setInfluencerResultImage(finalUrl);
                return response;
            });
        } catch (err: any) { setError("Lỗi tạo Influencer: " + err.message); } finally { setIsCreatingInfluencer(false); }
    };

    const handleSwapFace = async () => {
        if (!swapTargetFile || !swapSourceFile) return;
        setIsSwapping(true); setSwapResultImage(null); setError(null);
        try {
            const parts: any[] = [];
            const targetB64 = await fileToBase64(swapTargetFile);
            const sourceB64 = await fileToBase64(swapSourceFile);
            parts.push({ text: "SOURCE IMAGE [IDENTITY]: Focus on internal facial features." });
            parts.push({ inlineData: { mimeType: swapSourceFile.type, data: sourceB64 } });
            parts.push({ text: "TARGET IMAGE [BODY/POSE]: Replace face here." });
            parts.push({ inlineData: { mimeType: swapTargetFile.type, data: targetB64 } });
            let textPrompt = `TASK: Swap Face. Expression: ${generationSettings.expression}. Pose: ${generationSettings.changePose ? 'New' : 'Keep'}. Bg: ${generationSettings.transparentBackground ? 'White' : (generationSettings.changeBackground ? 'New' : 'Keep')}. Ratio: ${generationSettings.aspectRatio}.`;
            parts.push({ text: textPrompt });
            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await ai.models.generateContent({ model: modelName, contents: { parts: parts } });
                 const finalUrl = extractImageFromResponse(response);
                if (!finalUrl) throw new Error("AI không trả về ảnh");
                let resUrl = finalUrl;
                if (generationSettings.transparentBackground) resUrl = await removeBackground(resUrl);
                setSwapResultImage(resUrl);
                return response;
            });
        } catch (err: any) { setError("Lỗi Swap Face: " + err.message); } finally { setIsSwapping(false); }
    };

    const handleGenerateTryOn = async () => {
        setIsGenerating(true); setFinalImage(null); setError(null);
        try {
            const parts: any[] = [];
            if (modelFile) {
                const modelB64 = await fileToBase64(modelFile);
                parts.push({ text: "IMAGE A [TARGET MODEL]" });
                parts.push({ inlineData: { mimeType: modelFile.type, data: modelB64 } });
            }
            if (tryOnMode === 'full' && fullOutfitFile) {
                const outfitB64 = await fileToBase64(fullOutfitFile);
                parts.push({ text: "IMAGE B [CLOTHING]" });
                parts.push({ inlineData: { mimeType: fullOutfitFile.type, data: outfitB64 } });
                for (const f of referenceFiles) {
                    const b64 = await fileToBase64(f);
                    parts.push({ inlineData: { mimeType: f.type, data: b64 } });
                }
            } else if (tryOnMode === 'mix') {
                 for (const [key, file] of Object.entries(mixFiles)) {
                    if (file) {
                        const b64 = await fileToBase64(file as File);
                        parts.push({ text: `ITEM [${key}]` });
                        parts.push({ inlineData: { mimeType: (file as File).type, data: b64 } });
                    }
                }
            }
            let textPrompt = `TASK: Virtual Try-On. Dress Image A with items. Pose: ${generationSettings.changePose ? 'New' : 'Keep'}. Bg: ${generationSettings.transparentBackground ? 'White' : (generationSettings.changeBackground ? 'New' : 'Keep')}. FullBody: ${generationSettings.generateFullBody}. Ratio: ${generationSettings.aspectRatio}.`;
            parts.push({ text: textPrompt });
            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await ai.models.generateContent({ model: modelName, contents: { parts: parts } });
                const finalUrl = extractImageFromResponse(response);
                if (!finalUrl) throw new Error("AI không trả về ảnh");
                let resUrl = finalUrl;
                if (generationSettings.transparentBackground) resUrl = await removeBackground(resUrl);
                setFinalImage(resUrl);
                return response;
            });
        } catch (err: any) { setError("Lỗi tạo ảnh: " + err.message); } finally { setIsGenerating(false); }
    };

    const handleChangeBackground = async () => {
        if (!bgSourceFile) return;
        setIsChangingBg(true); setBgResultImage(null); setError(null);
        try {
            const parts: any[] = [];
            const sourceB64 = await fileToBase64(bgSourceFile);
            parts.push({ text: "SUBJECT IMAGE (Keep person/object identity):" });
            parts.push({ inlineData: { mimeType: bgSourceFile.type, data: sourceB64 } });

            // Construct prompt based on settings
            let prompt = "TASK: Change Background/Environment.";
            
            if (bgCustomFile) {
                const bgB64 = await fileToBase64(bgCustomFile);
                parts.push({ text: "NEW BACKGROUND IMAGE:" });
                parts.push({ inlineData: { mimeType: bgCustomFile.type, data: bgB64 } });
                prompt += " Composite the subject into the provided background image.";
            } else {
                 let bgDesc = bgSelectedPreset || "Random realistic background";
                if (bgSelectedPreset === 'random') {
                    const randomPreset = BACKGROUND_PRESETS[Math.floor(Math.random() * BACKGROUND_PRESETS.length)];
                    bgDesc = randomPreset.value;
                }
                prompt += ` Place the subject into this setting: ${bgDesc}.`;
            }

            // Add new options to prompt
            prompt += `\n- Aspect Ratio: ${generationSettings.aspectRatio}.`;
            prompt += `\n- Pose: ${generationSettings.changePose ? 'Change pose to fit environment naturaly' : 'Keep original pose'}.`;
            prompt += `\n- Expression: ${generationSettings.expression}.`;
            prompt += "\nEnsure realistic lighting, shadows, and high quality photorealism.";

            parts.push({ text: prompt });

            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await ai.models.generateContent({ model: modelName, contents: { parts: parts } });
                const finalUrl = extractImageFromResponse(response);
                if (!finalUrl) throw new Error("AI không trả về ảnh");
                setBgResultImage(finalUrl);
                return response;
            });
        } catch (err: any) { setError("Lỗi đổi nền: " + err.message); } finally { setIsChangingBg(false); }
    };

    const handleGenerateVideo = async (overrideModel?: string, overrideRes?: string) => {
        if (!videoPrompt.trim()) { alert("Vui lòng nhập mô tả video."); return; }
        setIsGeneratingVideo(true); 
        // Only reset result if we are NOT upscaling
        if (!overrideModel) setVideoResultUrl(null); 
        setError(null); 
        setVideoProgress('Đang kiểm tra API Key...');
        
        try {
            // 1. Veo Key Selection
            if (window.aistudio) {
                try {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    if (!hasKey) {
                        await window.aistudio.openSelectKey();
                    }
                } catch (e) {
                    console.warn("AI Studio Key selection check failed", e);
                }
            }

            // Priority: process.env.API_KEY
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("Vui lòng nhập API Key (Paid Project) để sử dụng tính năng này.");

            const ai = new GoogleGenAI({ apiKey: apiKey });
            
            let imagePart = undefined;
            if (videoInputFile) {
                const b64 = await fileToBase64(videoInputFile);
                imagePart = { imageBytes: b64, mimeType: videoInputFile.type };
            }

            const modelToUse = overrideModel || videoModel;
            const resToUse = overrideRes || videoResolution;

            setVideoProgress(`Đang gửi yêu cầu tạo video (${modelToUse.includes('fast') ? 'Fast' : 'Pro'} - ${resToUse})...`);

            // Veo Generation Call
            let operation = await ai.models.generateVideos({
                model: modelToUse, 
                prompt: videoPrompt,
                image: imagePart,
                config: {
                    numberOfVideos: 1,
                    resolution: resToUse as '720p' | '1080p',
                    aspectRatio: generationSettings.aspectRatio as '16:9' | '9:16'
                }
            });

            setVideoProgress('Đang xử lý (quá trình này có thể mất vài phút)...');

            // Polling Loop - Increased to 10s per guidelines
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000)); 
                operation = await ai.operations.getVideosOperation({operation: operation});
            }

            if (operation.error) throw new Error(operation.error.message || "Video generation failed");

            // Check both response and result for robustness
            const videoResponse = operation.response || (operation as any).result;
            const downloadLink = videoResponse?.generatedVideos?.[0]?.video?.uri;

            if (!downloadLink) {
                console.error("No download link found in operation:", operation);
                throw new Error("Không tìm thấy link video trong kết quả (API không trả về URI).");
            }

            // Fetch video blob
            setVideoProgress('Đang tải video về...');
            const response = await fetch(`${downloadLink}&key=${apiKey}`);
            if (!response.ok) throw new Error("Failed to download video file.");
            
            const blob = await response.blob();
            const videoUrl = URL.createObjectURL(blob);
            setVideoResultUrl(videoUrl);

        } catch (err: any) {
            console.error("Video generation error:", err);
            let msg = err.message;
            
            if (msg.includes('Requested entity was not found')) {
                 if (window.aistudio) {
                     await window.aistudio.openSelectKey();
                     msg = "Vui lòng chọn lại API Key và thử lại.";
                 } else {
                     msg = "API Key không hợp lệ hoặc đã hết hạn.";
                 }
            } else if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
                msg = `Lỗi 403 (Permission Denied): Model chưa được cấp quyền. Hãy thử chuyển sang model 'Veo Fast' hoặc kiểm tra quyền truy cập.`;
            } else if (msg.includes('Billing')) {
                msg = "Lỗi Billing: Tính năng Video yêu cầu API Key của dự án có trả phí (Pay-as-you-go).";
            }
            setError(msg);
        } finally {
            setIsGeneratingVideo(false);
            setVideoProgress('');
        }
    };

    const processSkinFix = async (imageSrc: string) => {
        setIsFixingSkin(true); setError(null); setSkinFixResultImage(null);
        try {
            const base64Data = imageSrc.split(',')[1];
            const mimeType = imageSrc.match(/data:(.*?);base64/)?.[1] || 'image/png';
            const parts = [{ inlineData: { mimeType: mimeType, data: base64Data } }, { text: "TASK: Skin Restoration. Remove plastic/waxy look. Add realistic skin texture/pores. Keep identity." }];
            await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await ai.models.generateContent({ model: modelName, contents: { parts: parts } });
                const finalUrl = extractImageFromResponse(response);
                if (!finalUrl) throw new Error("AI không trả về ảnh");
                setSkinFixResultImage(finalUrl);
                return response;
            });
        } catch (e: any) { setError("Lỗi: " + e.message); } finally { setIsFixingSkin(false); }
    };

    const processBreastLift = async (imageSrc: string) => {
        setIsLiftingBreast(true); setError(null); setBreastLiftResultImage(null);
        try {
            const base64Data = imageSrc.split(',')[1];
            const mimeType = imageSrc.match(/data:(.*?);base64/)?.[1] || 'image/png';
            const parts = [{ inlineData: { mimeType: mimeType, data: base64Data } }, { text: "TASK: Body Transformation. Increase bust size significantly (+5 cup). Keep identity and background." }];
             await executeWithRotation(async (key) => {
                const ai = new GoogleGenAI({ apiKey: key });
                const response = await ai.models.generateContent({ model: modelName, contents: { parts: parts } });
                const finalUrl = extractImageFromResponse(response);
                if (!finalUrl) throw new Error("AI không trả về ảnh");
                setBreastLiftResultImage(finalUrl);
                return response;
            });
        } catch (e: any) { setError("Lỗi: " + e.message); } finally { setIsLiftingBreast(false); }
    };

    const handleTransferToSkinFix = async (imageSrc: string) => { setSkinFixInputImage(imageSrc); setActiveTab('fix-skin'); await processSkinFix(imageSrc); };
    const handleTransferToBreastLift = async (imageSrc: string) => { setBreastLiftInputImage(imageSrc); setActiveTab('breast-lift'); await processBreastLift(imageSrc); };

    // Status Helper
    const isModelReady = !!modelFile;
    const isOutfitReady = tryOnMode === 'full' ? !!fullOutfitFile : Object.values(mixFiles).some(f => f);

    return (
        <div className="container">
            <header className="main-header">
                <h1 className="app-title">AI Studio VIP</h1>
                <p className="app-subtitle">Bộ công cụ xử lý ảnh chuyên nghiệp</p>
                <div className="header-actions">
                    <button className="settings-btn" onClick={() => setShowSettings(true)}><span>⚙️</span><span>Cài đặt Model</span></button>
                    <button className="guide-btn" onClick={() => setShowGuide(true)}><span>📖</span><span>Hướng dẫn</span></button>
                </div>
                <nav className="main-nav">
                    <button className={`nav-item nav-try-on ${activeTab === 'try-on' ? 'active' : ''}`} onClick={() => setActiveTab('try-on')}>👗 Virtual Try-On</button>
                    <button className={`nav-item nav-swap-face ${activeTab === 'swap-face' ? 'active' : ''}`} onClick={() => setActiveTab('swap-face')}>🎭 Swap Face</button>
                    <button className={`nav-item ${activeTab === 'change-bg' ? 'active' : ''}`} style={{borderColor: '#f59e0b', color: activeTab === 'change-bg' ? '#fff' : '#f59e0b', background: activeTab === 'change-bg' ? '#f59e0b' : 'transparent'}} onClick={() => setActiveTab('change-bg')}>🌄 Đổi Bối Cảnh</button>
                    <button className={`nav-item ${activeTab === 'create-video' ? 'active' : ''}`} style={{borderColor: '#ef4444', color: activeTab === 'create-video' ? '#fff' : '#ef4444', background: activeTab === 'create-video' ? '#ef4444' : 'transparent'}} onClick={() => setActiveTab('create-video')}>🎬 Tạo Video (Veo)</button>
                    <button className={`nav-item nav-fix-skin ${activeTab === 'fix-skin' ? 'active' : ''}`} onClick={() => setActiveTab('fix-skin')}>✨ Fix Da</button>
                    <button className={`nav-item nav-breast-lift ${activeTab === 'breast-lift' ? 'active' : ''}`} onClick={() => setActiveTab('breast-lift')}>👙 Nâng Ngực</button>
                    <button className={`nav-item nav-influencer ${activeTab === 'ai-influencer' ? 'active' : ''}`} onClick={() => setActiveTab('ai-influencer')}>🌟 Create Influencer</button>
                </nav>
            </header>

            {/* MODALS */}
            {showSettings && (
                 <div className="modal-overlay">
                    <div className="modal-content settings-modal-wide">
                        <div className="modal-header"><h3>Cài đặt Model AI</h3><button className="modal-close" onClick={() => setShowSettings(false)}>×</button></div>
                        <div className="modal-body">
                            <div className="modal-main">
                                <div style={{marginBottom: '15px', padding: '10px', background: '#111', borderRadius: '8px', border: '1px solid #333'}}>
                                    <label className="vip-label" style={{color:'#f59e0b'}}>Cấu hình Model Gemini:</label>
                                    
                                    <div style={{marginBottom:'10px'}}>
                                        <label className="vip-label" style={{fontSize:'0.8rem', color:'#888'}}>Chọn nhanh:</label>
                                        <select 
                                            className="vip-select" 
                                            onChange={(e) => {
                                                if(e.target.value) {
                                                    setModelName(e.target.value);
                                                    localStorage.setItem('gemini_model_name', e.target.value);
                                                }
                                            }}
                                            value={RECOMMENDED_MODELS.some(m => m.value === modelName) ? modelName : ""}
                                        >
                                            <option value="" disabled>-- Chọn Model từ danh sách --</option>
                                            {RECOMMENDED_MODELS.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                            <option value="custom">Tùy chỉnh (Nhập tay bên dưới)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="vip-label" style={{fontSize:'0.8rem', color:'#888'}}>Tên Model (Editable):</label>
                                        <input 
                                            type="text" 
                                            className="vip-input" 
                                            value={modelName} 
                                            onChange={handleModelNameChange} 
                                            placeholder="Nhập tên model..." 
                                        />
                                    </div>
                                    
                                    <div style={{fontSize:'0.8rem', color:'#666', marginTop:'5px'}}>
                                        *Nếu gặp lỗi "404 Not Found" hoặc "Safety", hãy thử chuyển sang <strong>Gemini 2.5 Flash Image</strong>.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
             {error && (
                <div className="error-message">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="error-close-btn">×</button>
                </div>
             )}
             
             {/* ================= VIRTUAL TRY-ON TAB ================= */}
             {activeTab === 'try-on' && (
                 <main className="workflow-container">
                    <div className="mode-switcher-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                         <button className={`nav-item nav-try-on ${tryOnMode === 'full' ? 'active' : ''}`} style={{borderRadius:'8px', margin: '0 10px'}} onClick={() => setTryOnMode('full')}>✨ Full Set (Nguyên Bộ)</button>
                         <button className={`nav-item nav-influencer ${tryOnMode === 'mix' ? 'active' : ''}`} style={{borderRadius:'8px', margin: '0 10px'}} onClick={() => setTryOnMode('mix')}>🧩 Mix & Match (Lẻ)</button>
                    </div>

                    <div className="vip-card">
                        <div className="vip-card-header">
                            <div className="vip-step-badge">1</div>
                            <h3 className="vip-card-title">Cấu hình & Dữ liệu</h3>
                        </div>

                        <div className="vip-grid-container">
                            {/* LEFT COL: Outfit */}
                            <div>
                                {tryOnMode === 'full' ? (
                                    <>
                                        <ImageUploader label="1. Ảnh Set Đồ (Chính)" image={fullOutfitPreview} onImageSelect={(e) => handleFileChange(e, setFullOutfitFile, setFullOutfitPreview)} onRemove={() => {setFullOutfitFile(null); setFullOutfitPreview(null)}}><p style={{color:'#666'}}>Tải ảnh chứa nguyên set đồ</p></ImageUploader>
                                        <div className="vip-ref-area">
                                            <div className="vip-ref-header">
                                                <span>Ảnh tham khảo (Tùy chọn)</span>
                                                <span>{referenceFiles.length}/3</span>
                                            </div>
                                            <div className="vip-ref-grid">
                                                <div className="vip-ref-slot" onClick={() => document.getElementById('ref-upload')?.click()}>
                                                    +
                                                </div>
                                                {referencePreviews.map((src, i) => (
                                                    <div key={i} className="vip-ref-slot">
                                                        <img src={src} />
                                                        <button className="vip-ref-remove" onClick={(e) => {e.stopPropagation(); removeReferenceImage(i);}}>×</button>
                                                    </div>
                                                ))}
                                                <input id="ref-upload" type="file" accept="image/*" onChange={handleReferenceUpload} className="hidden-input" />
                                            </div>
                                            <div style={{fontSize:'0.7rem', color:'#555', marginTop:'8px'}}>*Upload thêm góc nhìn khác để AI hiểu rõ hơn.</div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                                         <ImageUploader label="Váy (Dress)" image={dressImage} onImageSelect={(e) => handleMixFileChange(e, 'dress')} onRemove={() => { setDressImage(null); setMixFiles(p => ({...p, dress: null}))}} />
                                         <ImageUploader label="Áo (Top)" image={topImage} onImageSelect={(e) => handleMixFileChange(e, 'top')} onRemove={() => { setTopImage(null); setMixFiles(p => ({...p, top: null}))}} />
                                         <ImageUploader label="Quần (Bottom)" image={bottomImage} onImageSelect={(e) => handleMixFileChange(e, 'bottom')} onRemove={() => { setBottomImage(null); setMixFiles(p => ({...p, bottom: null}))}} />
                                         <ImageUploader label="Giày (Shoes)" image={shoesImage} onImageSelect={(e) => handleMixFileChange(e, 'shoes')} onRemove={() => { setShoesImage(null); setMixFiles(p => ({...p, shoes: null}))}} />
                                         <ImageUploader label="Túi (Bag)" image={bagImage} onImageSelect={(e) => handleMixFileChange(e, 'bag')} onRemove={() => { setBagImage(null); setMixFiles(p => ({...p, bag: null}))}} />
                                         <ImageUploader label="Phụ kiện" image={jewelryImage} onImageSelect={(e) => handleMixFileChange(e, 'jewelry')} onRemove={() => { setJewelryImage(null); setMixFiles(p => ({...p, jewelry: null}))}} />
                                    </div>
                                )}
                            </div>
                            
                            {/* RIGHT COL: Model */}
                            <div>
                                <ImageUploader label="2. Ảnh Người Mẫu" image={modelPreview} onImageSelect={(e) => handleFileChange(e, setModelFile, setModelPreview)} onRemove={() => {setModelFile(null); setModelPreview(null)}}><p style={{color:'#666'}}>Tải ảnh người mẫu</p></ImageUploader>
                            </div>

                            {/* BOTTOM LEFT: Selection */}
                            <div>
                                <label className="vip-upload-label">3. Chọn mục cần thay:</label>
                                <div className="vip-option-list">
                                    <div className={`vip-option-item ${fullSetOptions.clothing ? 'active' : ''}`} onClick={() => toggleFullSetOption('clothing')}>
                                        <span>👗 Quần/Áo/Váy</span>
                                        {fullSetOptions.clothing && <span>✓</span>}
                                    </div>
                                    <div className={`vip-option-item ${fullSetOptions.shoes ? 'active' : ''}`} onClick={() => toggleFullSetOption('shoes')}>
                                        <span>👠 Giày/Dép</span>
                                        {fullSetOptions.shoes && <span>✓</span>}
                                    </div>
                                    <div className={`vip-option-item ${fullSetOptions.jewelry ? 'active' : ''}`} onClick={() => toggleFullSetOption('jewelry')}>
                                        <span>💎 Trang sức</span>
                                        {fullSetOptions.jewelry && <span>✓</span>}
                                    </div>
                                    <div className={`vip-option-item ${fullSetOptions.bag ? 'active' : ''}`} onClick={() => toggleFullSetOption('bag')}>
                                        <span>👜 Túi xách</span>
                                        {fullSetOptions.bag && <span>✓</span>}
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM RIGHT: Settings */}
                            <div>
                                <label className="vip-upload-label">4. Cài đặt tạo ảnh:</label>
                                <div className="vip-settings-box">
                                     <div className="vip-toggle-row">
                                         <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setAspectRatio('9:16')}>📱 Dọc (9:16)</button>
                                         <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '16:9' ? 'active-blue' : ''}`} onClick={() => setAspectRatio('16:9')}>💻 Ngang (16:9)</button>
                                     </div>
                                     <div className="vip-toggle-row">
                                         <button className={`vip-toggle-btn ${generationSettings.changePose ? 'active' : ''}`} onClick={() => toggleGenerationSetting('changePose')}>💃 Đổi tư thế {generationSettings.changePose && '✓'}</button>
                                         <button className={`vip-toggle-btn ${generationSettings.generateFullBody ? 'active' : ''}`} onClick={() => toggleGenerationSetting('generateFullBody')}>🧍 Toàn thân {generationSettings.generateFullBody && '✓'}</button>
                                     </div>
                                     <div className="vip-toggle-row">
                                         <button className={`vip-toggle-btn ${generationSettings.changeBackground ? 'active' : ''}`} onClick={() => toggleGenerationSetting('changeBackground')}>🏞️ Đổi nền {generationSettings.changeBackground && '✓'}</button>
                                         <button className={`vip-toggle-btn ${generationSettings.transparentBackground ? 'active' : ''}`} onClick={() => toggleGenerationSetting('transparentBackground')}>🔳 Nền rỗng {generationSettings.transparentBackground && '✓'}</button>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Status & Action */}
                    <div className="vip-footer-card">
                        <div className="vip-card-header">
                            <div className="vip-step-badge">2</div>
                            <h3 className="vip-card-title">Hoàn Tất</h3>
                        </div>
                        <div className="vip-status-box">
                            <span className="vip-status-line">Cấu hình hiện tại: <strong>{tryOnMode === 'full' ? 'Full Set (Nguyên Bộ)' : 'Mix Mode'}</strong></span>
                            <br/>
                            <span className="vip-status-line">Set đồ: {isOutfitReady ? <span className="vip-status-ok">✔ Sẵn sàng</span> : <span className="vip-status-err">✘ Thiếu</span>}</span>
                            <span className="vip-status-line">Mẫu: {isModelReady ? <span className="vip-status-ok">✔ Sẵn sàng</span> : <span className="vip-status-err">✘ Thiếu</span>}</span>
                            <span className="vip-status-line">Thay: {Object.keys(fullSetOptions).filter(k => (fullSetOptions as any)[k]).join(', ') || 'Chưa chọn'}</span>
                        </div>
                        <div className="vip-tags">
                            <span className={`vip-tag ${generationSettings.changePose ? 'active' : ''}`}>✔ Tư thế mới</span>
                            <span className={`vip-tag ${generationSettings.changeBackground ? 'active' : ''}`}>✔ Bối cảnh mới</span>
                            <span className="vip-tag active">🔒 Giữ khung</span>
                            <span className="vip-tag active">📱 Dọc (9:16)</span>
                        </div>
                        <button 
                            className={`vip-action-btn btn-blue-glow ${!isGenerating && isOutfitReady && isModelReady ? 'ready' : ''}`} 
                            onClick={handleGenerateTryOn} 
                            disabled={isGenerating || !isOutfitReady || !isModelReady}
                        >
                            {isGenerating ? <><div className="spinner"></div> Đang ghép đồ...</> : '✨ Bắt đầu ghép đồ'}
                        </button>
                    </div>

                    {finalImage && (
                        <div className="vip-card">
                            <div className="vip-card-header"><h3 className="vip-card-title">Kết Quả</h3></div>
                            <img src={finalImage} style={{maxWidth:'100%', borderRadius:'8px', display:'block', margin:'0 auto'}} />
                            <div style={{textAlign:'center', marginTop:'15px'}}>
                                <button className="btn-download" onClick={() => handleDownload(finalImage!, 'TryOn_Result')}>
                                    ⬇️ Download 4K PNG
                                </button>
                                <button className="btn btn-secondary" style={{marginTop:'10px'}} onClick={()=>handleTransferToSkinFix(finalImage!)}>Chuyển sang Fix Da ✨</button>
                            </div>
                        </div>
                    )}
                 </main>
             )}

             {/* ================= SWAP FACE TAB ================= */}
             {activeTab === 'swap-face' && (
                 <main className="workflow-container">
                     <div className="vip-card">
                         <div className="vip-card-header">
                            <div className="vip-step-badge">1</div>
                            <h3 className="vip-card-title">Dữ Liệu & Cấu Hình</h3>
                        </div>

                        {/* Combined Upload Section */}
                        <div className="swap-container" style={{marginBottom: '20px'}}>
                            <div className="swap-box">
                                <ImageUploader label="1. Ảnh Gốc (Body/Target)" image={swapTargetPreview} onImageSelect={(e) => handleFileChange(e, setSwapTargetFile, setSwapTargetPreview)} onRemove={()=>{setSwapTargetFile(null); setSwapTargetPreview(null)}}><p style={{color:'#666'}}>Tải ảnh gốc (giữ body)</p></ImageUploader>
                            </div>
                            <button className="swap-arrow-btn" onClick={handleSwapImages} title="Đổi vị trí">↔</button>
                            <div className="swap-box">
                                <ImageUploader label="2. Ảnh Khuôn Mặt (Source)" image={swapSourcePreview} onImageSelect={(e) => handleFileChange(e, setSwapSourceFile, setSwapSourcePreview)} onRemove={()=>{setSwapSourceFile(null); setSwapSourcePreview(null)}}><p style={{color:'#666'}}>Tải ảnh khuôn mặt</p></ImageUploader>
                            </div>
                        </div>

                        {/* Streamlined Settings Box */}
                        <div className="vip-settings-box">
                             <div className="vip-grid-container" style={{marginBottom: 0, gap: '20px'}}>
                                 <div>
                                     <label className="vip-upload-label">Tỉ lệ & Background:</label>
                                     <div className="vip-toggle-row">
                                         <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setAspectRatio('9:16')}>📱 9:16</button>
                                         <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '16:9' ? 'active-blue' : ''}`} onClick={() => setAspectRatio('16:9')}>💻 16:9</button>
                                     </div>
                                      <div className="vip-toggle-row">
                                         <button className={`vip-toggle-btn ${generationSettings.changeBackground ? 'active-blue' : ''}`} onClick={() => toggleGenerationSetting('changeBackground')} disabled={generationSettings.transparentBackground}>🏞️ Đổi nền {generationSettings.changeBackground && '✓'}</button>
                                         <button className={`vip-toggle-btn ${generationSettings.transparentBackground ? 'active' : ''}`} onClick={() => toggleGenerationSetting('transparentBackground')}>🔳 Nền rỗng</button>
                                     </div>
                                 </div>
                                 <div>
                                     <label className="vip-upload-label">Biểu cảm khuôn mặt:</label>
                                      <div className="vip-expression-bar" style={{flexWrap: 'wrap'}}>
                                         {EXPRESSION_OPTIONS.map((opt) => (
                                             <button 
                                                key={opt.id}
                                                className={`vip-expr-btn ${generationSettings.expression === opt.id ? 'active' : ''}`}
                                                onClick={() => setExpression(opt.id)}
                                                style={{minWidth: '70px', padding: '8px 12px', fontSize:'0.85rem'}}
                                             >
                                                 {opt.icon} {opt.label}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                        </div>
                     </div>

                     <div className="vip-card">
                         <div className="vip-card-header">
                            <div className="vip-step-badge">2</div>
                            <h3 className="vip-card-title">Thực Hiện</h3>
                        </div>
                        <button 
                            className="vip-action-btn btn-green-glow" 
                            onClick={handleSwapFace} 
                            disabled={isSwapping || !swapTargetFile || !swapSourceFile}
                        >
                            {isSwapping ? <><div className="spinner"></div> Đang xử lý...</> : '🎭 Bắt đầu Swap Face'}
                        </button>
                     </div>

                     {swapResultImage && (
                        <div className="vip-card">
                             <div className="vip-card-header">
                                <div className="vip-step-badge">3</div>
                                <h3 className="vip-card-title">Kết Quả</h3>
                            </div>
                            <img src={swapResultImage} style={{maxWidth:'100%', borderRadius:'8px', display:'block', margin:'0 auto'}} />
                            <div style={{textAlign:'center', marginTop:'15px'}}>
                                <button className="btn-download" onClick={() => handleDownload(swapResultImage!, 'SwapFace_Result')}>
                                    ⬇️ Download 4K PNG
                                </button>
                            </div>
                        </div>
                     )}
                 </main>
             )}

             {/* ================= CHANGE BACKGROUND TAB ================= */}
             {activeTab === 'change-bg' && (
                <main className="workflow-container">
                    <div className="vip-card">
                        <div className="vip-card-header">
                            <div className="vip-step-badge">1</div>
                            <h3 className="vip-card-title">Dữ Liệu & Bối Cảnh</h3>
                        </div>

                        <div className="vip-grid-container">
                            {/* Input Source */}
                            <div>
                                <ImageUploader label="1. Ảnh Gốc (Người/Vật thể)" image={bgSourcePreview} onImageSelect={(e) => handleFileChange(e, setBgSourceFile, setBgSourcePreview)} onRemove={() => { setBgSourceFile(null); setBgSourcePreview(null); }}>
                                    <p style={{color:'#666'}}>Tải ảnh người hoặc sản phẩm</p>
                                </ImageUploader>
                            </div>

                            {/* Background Selection */}
                            <div>
                                <label className="vip-upload-label">2. Chọn Bối Cảnh Mới:</label>
                                <div style={{background: '#1a1a1a', padding: '15px', borderRadius: '12px'}}>
                                    
                                    {/* Option A: Upload Custom */}
                                    <div style={{marginBottom: '20px'}}>
                                        <div style={{fontSize: '0.9rem', color: '#fff', marginBottom: '8px', fontWeight: 'bold'}}>🅰️ Tải ảnh nền (Custom)</div>
                                        <ImageUploader image={bgCustomPreview} onImageSelect={(e) => {
                                            handleFileChange(e, setBgCustomFile, setBgCustomPreview);
                                            setBgSelectedPreset(''); // Clear preset if custom uploaded
                                        }} onRemove={() => { setBgCustomFile(null); setBgCustomPreview(null); }}>
                                            <p style={{color:'#666', fontSize:'0.8rem'}}>Upload ảnh nền của bạn</p>
                                        </ImageUploader>
                                    </div>

                                    <div style={{textAlign: 'center', color: '#666', margin: '10px 0'}}>— HOẶC —</div>

                                    {/* Option B: Preset */}
                                    <div>
                                        <div style={{fontSize: '0.9rem', color: '#fff', marginBottom: '8px', fontWeight: 'bold'}}>🅱️ Chọn bối cảnh có sẵn</div>
                                        <select 
                                            className="vip-select" 
                                            value={bgSelectedPreset} 
                                            onChange={(e) => {
                                                setBgSelectedPreset(e.target.value);
                                                setBgCustomFile(null); setBgCustomPreview(null); // Clear custom if preset selected
                                            }}
                                            disabled={!!bgCustomFile}
                                        >
                                            <option value="">-- Chọn Bối Cảnh --</option>
                                            <option value="random">🎲 Ngẫu Nhiên (Random)</option>
                                            {BACKGROUND_PRESETS.map((bg, i) => (
                                                <option key={i} value={bg.value}>{bg.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Settings Section */}
                        <div style={{marginTop: '20px', padding: '15px', background: '#1a1a1a', borderRadius: '12px'}}>
                            <label className="vip-upload-label">3. Cấu hình nâng cao:</label>
                            <div className="vip-grid-container" style={{marginBottom: 0, gap: '20px'}}>
                                <div>
                                    <label className="vip-label" style={{fontSize: '0.8rem'}}>Tỉ lệ & Tư thế:</label>
                                    <div className="vip-toggle-row">
                                        <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setAspectRatio('9:16')}>📱 9:16</button>
                                        <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '16:9' ? 'active-blue' : ''}`} onClick={() => setAspectRatio('16:9')}>💻 16:9</button>
                                    </div>
                                    <div className="vip-toggle-row">
                                        <button className={`vip-toggle-btn ${generationSettings.changePose ? 'active' : ''}`} onClick={() => toggleGenerationSetting('changePose')}>💃 Đổi tư thế {generationSettings.changePose && '✓'}</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="vip-label" style={{fontSize: '0.8rem'}}>Biểu cảm:</label>
                                    <div className="vip-expression-bar" style={{flexWrap: 'wrap'}}>
                                        {EXPRESSION_OPTIONS.map((opt) => (
                                             <button 
                                                key={opt.id}
                                                className={`vip-expr-btn ${generationSettings.expression === opt.id ? 'active' : ''}`}
                                                onClick={() => setExpression(opt.id)}
                                                style={{minWidth: '70px', padding: '8px 12px', fontSize:'0.85rem'}}
                                             >
                                                 {opt.icon} {opt.label}
                                             </button>
                                         ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="vip-footer-card">
                         <div className="vip-card-header">
                            <div className="vip-step-badge">2</div>
                            <h3 className="vip-card-title">Thực Hiện</h3>
                        </div>
                        <div className="vip-status-box">
                             <span className="vip-status-line">Ảnh gốc: {bgSourceFile ? <span className="vip-status-ok">✔ Đã có</span> : <span className="vip-status-err">✘ Thiếu</span>}</span>
                             <span className="vip-status-line">Bối cảnh: {bgCustomFile ? <span className="vip-status-ok">✔ Ảnh Custom</span> : (bgSelectedPreset ? <span className="vip-status-ok">✔ Preset: {bgSelectedPreset === 'random' ? 'Ngẫu nhiên' : 'Đã chọn'}</span> : <span className="vip-status-err">✘ Chưa chọn</span>)}</span>
                        </div>
                        <div className="vip-tags">
                            <span className={`vip-tag ${generationSettings.changePose ? 'active' : ''}`}>✔ Tư thế mới</span>
                            <span className="vip-tag active">Biểu cảm: {generationSettings.expression}</span>
                            <span className="vip-tag active">Tỉ lệ: {generationSettings.aspectRatio}</span>
                        </div>
                        <button 
                            className="vip-action-btn btn-orange-glow" 
                            onClick={handleChangeBackground} 
                            disabled={isChangingBg || !bgSourceFile || (!bgCustomFile && !bgSelectedPreset)}
                        >
                            {isChangingBg ? <><div className="spinner"></div> Đang xử lý...</> : '🌄 Đổi Bối Cảnh Ngay'}
                        </button>
                    </div>

                    {bgResultImage && (
                        <div className="vip-card">
                            <div className="vip-card-header"><h3 className="vip-card-title">Kết Quả</h3></div>
                            <img src={bgResultImage} style={{maxWidth:'100%', borderRadius:'8px', display:'block', margin:'0 auto'}} />
                            <div style={{textAlign:'center', marginTop:'15px'}}>
                                <button className="btn-download" onClick={() => handleDownload(bgResultImage!, 'ChangeBg_Result')}>
                                    ⬇️ Download 4K PNG
                                </button>
                            </div>
                        </div>
                    )}
                </main>
             )}

             {/* ================= CREATE VIDEO (VEO) TAB ================= */}
             {activeTab === 'create-video' && (
                 <main className="workflow-container">
                     <div className="vip-card">
                         <div className="vip-card-header">
                            <div className="vip-step-badge">1</div>
                            <h3 className="vip-card-title">🎬 Tạo Video Chuyển Động (Veo)</h3>
                        </div>

                        <div className="vip-grid-container" style={{gridTemplateColumns: '1fr 1fr'}}>
                             {/* Input Image */}
                            <div>
                                <ImageUploader label="Ảnh khởi đầu (Start Frame - Optional)" image={videoInputPreview} onImageSelect={(e) => handleFileChange(e, setVideoInputFile, setVideoInputPreview)} onRemove={()=>{setVideoInputFile(null); setVideoInputPreview(null)}}>
                                    <p style={{color:'#666'}}>Tải ảnh để tạo chuyển động từ ảnh đó</p>
                                </ImageUploader>
                                <div style={{marginTop: '15px'}}>
                                    <label className="vip-label">🪄 Prompt Mẫu (Click để chọn):</label>
                                    <div className="prompt-scroll-box">
                                        {VIDEO_PROMPT_TEMPLATES.map((p, i) => (
                                            <div 
                                                key={i} 
                                                className="prompt-item"
                                                onClick={() => setVideoPrompt(p)}
                                            >
                                                <span style={{color: '#f59e0b', fontWeight: 'bold', marginRight: '5px'}}>{i+1}.</span>
                                                {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Prompt & Config */}
                            <div>
                                <div className="vip-form-group">
                                    <label className="vip-label">Chọn Model:</label>
                                    <select 
                                        className="vip-select" 
                                        value={videoModel} 
                                        onChange={(e) => setVideoModel(e.target.value)}
                                    >
                                        {VIDEO_MODELS.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                    <div style={{fontSize:'0.8rem', color:'#aaa', marginTop:'5px'}}>
                                        *Nếu gặp lỗi 403, hãy thử chuyển sang model Fast.
                                    </div>
                                </div>

                                <div className="vip-form-group">
                                    <label className="vip-label">Mô tả video (Prompt):</label>
                                    <textarea 
                                        className="vip-textarea" 
                                        value={videoPrompt} 
                                        onChange={(e) => setVideoPrompt(e.target.value)} 
                                        placeholder="Mô tả chi tiết chuyển động bạn muốn (Ví dụ: A cyberpunk city with flying cars, cinematic lighting...)"
                                        style={{height: '120px'}}
                                    />
                                </div>
                                <div className="vip-form-group">
                                    <label className="vip-label">Cấu hình video:</label>
                                    <div style={{display:'flex', gap:'10px', flexDirection:'column'}}>
                                        <div className="vip-toggle-row">
                                            <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setAspectRatio('9:16')}>📱 Dọc (9:16)</button>
                                            <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '16:9' ? 'active-blue' : ''}`} onClick={() => setAspectRatio('16:9')}>💻 Ngang (16:9)</button>
                                        </div>
                                        <div className="vip-toggle-row">
                                            <button className={`vip-toggle-btn ${videoResolution === '720p' ? 'active' : ''}`} onClick={() => setVideoResolution('720p')}>SD 720p</button>
                                            <button className={`vip-toggle-btn ${videoResolution === '1080p' ? 'active-orange' : ''}`} onClick={() => setVideoResolution('1080p')}>HD 1080p</button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{fontSize:'0.8rem', color:'#f59e0b', marginTop:'10px', background:'#2a1a00', padding:'10px', borderRadius:'6px'}}>
                                    ⚠️ Lưu ý: Tính năng này yêu cầu <strong>API Key có trả phí (Billing enabled)</strong>. Key miễn phí sẽ không hoạt động.
                                </div>
                            </div>
                        </div>
                     </div>

                     <div className="vip-footer-card">
                         <div className="vip-status-box" style={{color: '#fff'}}>
                            {isGeneratingVideo && <div style={{textAlign:'center', padding:'10px'}}><div className="spinner"></div><br/>{videoProgress}</div>}
                            {!isGeneratingVideo && "Sẵn sàng tạo video clip (~5-8 giây)"}
                         </div>
                        <button 
                            className="vip-action-btn btn-blue-glow" 
                            onClick={() => handleGenerateVideo()} 
                            disabled={isGeneratingVideo || !videoPrompt}
                        >
                            {isGeneratingVideo ? '🎥 Đang render video...' : '🎬 Tạo Video Ngay'}
                        </button>
                     </div>

                     {videoResultUrl && (
                        <div className="vip-card">
                             <div className="vip-card-header">
                                <h3 className="vip-card-title">Kết Quả Video</h3>
                            </div>
                            <video controls src={videoResultUrl} style={{width:'100%', maxHeight:'500px', borderRadius:'8px', display:'block', margin:'0 auto', background:'#000'}} />
                            <div style={{textAlign:'center', marginTop:'15px', display:'flex', gap:'10px', justifyContent:'center'}}>
                                <a href={videoResultUrl} download={`Veo_Video_${Date.now()}.mp4`} className="btn-download" style={{textDecoration:'none', flex: 1, maxWidth:'200px'}}>
                                    ⬇️ Download MP4
                                </a>
                                {videoResolution === '720p' && !isGeneratingVideo && (
                                    <button 
                                        className="btn btn-primary" 
                                        style={{flex: 1, maxWidth:'200px', background: 'linear-gradient(45deg, #FFD700, #DAA520)', color:'#000', fontWeight:'bold', border:'none'}}
                                        onClick={() => handleGenerateVideo('veo-3.1-generate-preview', '1080p')}
                                    >
                                        ✨ Upscale lên 1080p
                                    </button>
                                )}
                            </div>
                        </div>
                     )}
                 </main>
             )}

             {/* ================= FIX SKIN / BREAST LIFT TAB ================= */}
             {(activeTab === 'fix-skin' || activeTab === 'breast-lift') && (
                 <main className="workflow-container">
                     <button className="btn btn-secondary" style={{width:'fit-content', marginBottom:'10px'}} onClick={() => setActiveTab('try-on')}>← Quay lại Try-On</button>

                     <div className="vip-card">
                         <div className="vip-card-header">
                             {activeTab === 'fix-skin' ? (
                                 <><span style={{fontSize:'1.5rem'}}>✨</span><h3 className="vip-card-title">Fix Da Nhựa (Skin Enhancer)</h3></>
                             ) : (
                                 <><span style={{fontSize:'1.5rem'}}>👙</span><h3 className="vip-card-title">AI Nâng Ngực (Body Enhancer)</h3></>
                             )}
                         </div>

                         <div className="compare-container">
                             <div className="compare-box">
                                 <h4>Ảnh Gốc</h4>
                                 <div className="compare-img-area">
                                     {activeTab === 'fix-skin' ? (
                                         <ImageUploader image={skinFixInputImage} onImageSelect={(e) => handleLocalImageUpload(e, setSkinFixInputImage, setSkinFixResultImage)} onRemove={()=>{setSkinFixInputImage(null); setSkinFixResultImage(null)}} />
                                     ) : (
                                         <ImageUploader image={breastLiftInputImage} onImageSelect={(e) => handleLocalImageUpload(e, setBreastLiftInputImage, setBreastLiftResultImage)} onRemove={()=>{setBreastLiftInputImage(null); setBreastLiftResultImage(null)}} />
                                     )}
                                 </div>
                             </div>
                             <div className="compare-box">
                                 <h4>Kết Quả</h4>
                                 <div className="compare-img-area" style={{borderStyle:'solid', borderColor:'#333'}}>
                                     {(activeTab === 'fix-skin' ? isFixingSkin : isLiftingBreast) ? (
                                         <div className="spinner"></div>
                                     ) : (activeTab === 'fix-skin' ? skinFixResultImage : breastLiftResultImage) ? (
                                         <img src={activeTab === 'fix-skin' ? skinFixResultImage! : breastLiftResultImage!} />
                                     ) : (
                                         <span className="result-placeholder">Chưa có kết quả</span>
                                     )}
                                 </div>
                                  {(activeTab === 'fix-skin' ? skinFixResultImage : breastLiftResultImage) && (
                                     <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                         <button className="btn-download" style={{marginTop: 0, flex: 1}} onClick={() => handleDownload((activeTab === 'fix-skin' ? skinFixResultImage : breastLiftResultImage)!, 'Enhanced_Result')}>
                                            ⬇️ Download 4K PNG
                                         </button>
                                         {activeTab === 'fix-skin' && (
                                             <button className="btn btn-pink-glow" style={{flex: 1, borderRadius: '8px', fontSize:'0.95rem', fontWeight:600}} onClick={() => handleTransferToBreastLift(skinFixResultImage!)}>
                                                 👙 Nâng ngực ngay
                                             </button>
                                         )}
                                     </div>
                                  )}
                             </div>
                         </div>
                         
                         {activeTab === 'fix-skin' ? (
                             <button 
                                className="vip-action-btn btn-purple-glow" 
                                onClick={() => skinFixInputImage && processSkinFix(skinFixInputImage)}
                                disabled={isFixingSkin || !skinFixInputImage}
                             >
                                 {isFixingSkin ? <><div className="spinner"></div> Đang xử lý...</> : 'Bắt đầu Fix Da'}
                             </button>
                         ) : (
                             <button 
                                className="vip-action-btn btn-pink-glow" 
                                onClick={() => breastLiftInputImage && processBreastLift(breastLiftInputImage)}
                                disabled={isLiftingBreast || !breastLiftInputImage}
                             >
                                 {isLiftingBreast ? <><div className="spinner"></div> Đang xử lý...</> : 'Bắt đầu Nâng Ngực'}
                             </button>
                         )}
                     </div>
                 </main>
             )}

             {/* ================= INFLUENCER TAB ================= */}
             {activeTab === 'ai-influencer' && (
                <div className="workflow-container">
                     <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px'}}>
                         {influencerHistory.length > 0 && <button className="btn btn-secondary" onClick={undoRandomize}>↩️ Hoàn tác</button>}
                         <button className="btn btn-secondary" onClick={randomizeInfluencer}>🎲 Ngẫu nhiên</button>
                    </div>

                    <div className="vip-card">
                        <div className="vip-card-header">
                            <div className="vip-step-badge">1</div>
                            <h3 className="vip-card-title">Thiết Kế Nhân Vật</h3>
                        </div>
                        
                        <div className="vip-form-grid-3">
                            <div className="vip-form-group">
                                <label className="vip-label">Giới tính</label>
                                <select className="vip-select" value={influencerSettings.gender} onChange={(e) => handleInfluencerSettingChange('gender', e.target.value)}>
                                    {INFLUENCER_DATA.genders.map((opt, i) => (<option key={i} value={opt.value}>{opt.label}</option>))}
                                </select>
                            </div>
                            <div className="vip-form-group">
                                <label className="vip-label">Độ tuổi</label>
                                <select className="vip-select" value={influencerSettings.age} onChange={(e) => handleInfluencerSettingChange('age', e.target.value)}>
                                    {INFLUENCER_DATA.ages.map((opt, i) => (<option key={i} value={opt.value}>{opt.label}</option>))}
                                </select>
                            </div>
                             <div className="vip-form-group">
                                <label className="vip-label">Sắc tộc</label>
                                <select className="vip-select" value={influencerSettings.ethnicity} onChange={(e) => handleInfluencerSettingChange('ethnicity', e.target.value)}>
                                    {INFLUENCER_DATA.ethnicities.map((opt, i) => (<option key={i} value={opt.value}>{opt.label}</option>))}
                                </select>
                            </div>
                        </div>

                         <div className="vip-form-grid-3">
                            <div className="vip-form-group">
                                <label className="vip-label">Dáng người</label>
                                <select className="vip-select" value={influencerSettings.bodyType} onChange={(e) => handleInfluencerSettingChange('bodyType', e.target.value)}>
                                    {INFLUENCER_DATA.bodyTypes.map((opt, i) => (<option key={i} value={opt.value}>{opt.label}</option>))}
                                </select>
                            </div>
                             <div className="vip-form-group">
                                <label className="vip-label">Màu da</label>
                                <select className="vip-select" value={influencerSettings.skinTone} onChange={(e) => handleInfluencerSettingChange('skinTone', e.target.value)}>
                                    {INFLUENCER_DATA.skinTones.map((opt, i) => (<option key={i} value={opt.value}>{opt.label}</option>))}
                                </select>
                            </div>
                             <div className="vip-form-group">
                                <label className="vip-label">Màu mắt</label>
                                <select className="vip-select" value={influencerSettings.eyes} onChange={(e) => handleInfluencerSettingChange('eyes', e.target.value)}>
                                    {INFLUENCER_DATA.eyes.map((opt, i) => (<option key={i} value={opt.value}>{opt.label}</option>))}
                                </select>
                            </div>
                        </div>

                        {/* Reference Image Section */}
                        <div style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px'}}>
                             <label className="vip-label" style={{color: '#f59e0b', fontSize:'1rem'}}>📸 Ảnh tham chiếu (Tùy chọn)</label>
                             <div className="vip-grid-container" style={{gridTemplateColumns: '1fr 2fr', marginTop:'15px'}}>
                                <ImageUploader image={influencerRefPreview} onImageSelect={(e) => handleFileChange(e, setInfluencerRefFile, setInfluencerRefPreview)} onRemove={() => { setInfluencerRefFile(null); setInfluencerRefPreview(null); }}>
                                    <p style={{color:'#666', fontSize: '0.8rem'}}>Upload ảnh mẫu</p>
                                </ImageUploader>
                                <div>
                                    <label className="vip-label">AI nên lấy đặc điểm gì?</label>
                                    <div className="vip-grid-container" style={{gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 0}}>
                                        <button className={`vip-toggle-btn ${influencerRefOptions.style ? 'active-orange' : ''}`} onClick={() => toggleInfluencerRefOption('style')} disabled={!influencerRefFile}>🎨 Phong cách {influencerRefOptions.style && '✓'}</button>
                                        <button className={`vip-toggle-btn ${influencerRefOptions.face ? 'active-orange' : ''}`} onClick={() => toggleInfluencerRefOption('face')} disabled={!influencerRefFile}>👤 Khuôn mặt {influencerRefOptions.face && '✓'}</button>
                                        <button className={`vip-toggle-btn ${influencerRefOptions.body ? 'active-orange' : ''}`} onClick={() => toggleInfluencerRefOption('body')} disabled={!influencerRefFile}>💃 Dáng / Pose {influencerRefOptions.body && '✓'}</button>
                                        <button className={`vip-toggle-btn ${influencerRefOptions.outfit ? 'active-orange' : ''}`} onClick={() => toggleInfluencerRefOption('outfit')} disabled={!influencerRefFile}>👗 Trang phục {influencerRefOptions.outfit && '✓'}</button>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Hair Section */}
                         <div style={{marginTop: '20px', background: '#151515', padding: '15px', borderRadius: '8px', border:'1px dashed #333'}}>
                            <label className="vip-label" style={{color: '#ec4899', fontSize:'1rem', marginBottom:'15px'}}>Thiết kế kiểu tóc</label>
                            <div className="vip-form-grid-4" style={{marginBottom: '15px'}}>
                                 <select className="vip-select" value={hairBuilder.length} onChange={(e) => updateHairFromBuilder({length: e.target.value})}>{INFLUENCER_DATA.hairOptions.lengths.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                                 <select className="vip-select" value={hairBuilder.color} onChange={(e) => updateHairFromBuilder({color: e.target.value})}>{INFLUENCER_DATA.hairOptions.colors.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                                 <select className="vip-select" value={hairBuilder.texture} onChange={(e) => updateHairFromBuilder({texture: e.target.value})}>{INFLUENCER_DATA.hairOptions.textures.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                                 <select className="vip-select" value={hairBuilder.bangs} onChange={(e) => updateHairFromBuilder({bangs: e.target.value})}>{INFLUENCER_DATA.hairOptions.bangs.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                            </div>
                            <input type="text" className="vip-input" value={influencerSettings.hair} onChange={(e) => handleInfluencerSettingChange('hair', e.target.value)} placeholder="Mô tả tóc chi tiết..." />
                        </div>
                    </div>

                    <div className="vip-card">
                        <div className="vip-card-header">
                            <div className="vip-step-badge">2</div>
                            <h3 className="vip-card-title">Phong Cách & Bối Cảnh</h3>
                        </div>
                         <div className="vip-form-grid-2">
                            <div className="vip-form-group">
                                <label className="vip-label">Phong cách</label>
                                <select className="vip-select" value={influencerSettings.style} onChange={(e) => handleInfluencerSettingChange('style', e.target.value)}>
                                    {INFLUENCER_DATA.styles.map((opt, i) => (<option key={i} value={opt.value}>{opt.label}</option>))}
                                </select>
                            </div>
                             <div className="vip-form-group">
                                <label className="vip-label">Bối cảnh</label>
                                <select className="vip-select" onChange={(e) => handleInfluencerSettingChange('scenario', e.target.value)} value="">
                                    <option value="" disabled>Chọn bối cảnh mẫu...</option>
                                    {Object.entries(INFLUENCER_DATA.scenarios).map(([category, options]) => (<optgroup key={category} label={category}>{options.map((opt, i) => (<option key={i} value={opt.value}>{opt.label}</option>))}</optgroup>))}
                                </select>
                            </div>
                         </div>
                         <div className="vip-form-group">
                             <textarea className="vip-textarea" value={influencerSettings.scenario} onChange={(e) => handleInfluencerSettingChange('scenario', e.target.value)} placeholder="Mô tả chi tiết bối cảnh..."></textarea>
                         </div>
                         <div className="vip-form-group">
                            <label className="vip-label">Tỉ lệ khung hình</label>
                            <div className="vip-toggle-row" style={{maxWidth: '300px'}}>
                                <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '9:16' ? 'active' : ''}`} onClick={() => setAspectRatio('9:16')}>📱 Dọc (9:16)</button>
                                <button className={`vip-toggle-btn ${generationSettings.aspectRatio === '16:9' ? 'active-blue' : ''}`} onClick={() => setAspectRatio('16:9')}>💻 Ngang (16:9)</button>
                            </div>
                        </div>
                    </div>

                    <div className="vip-footer-card">
                         <button 
                            className="vip-action-btn btn-orange-glow" 
                            onClick={handleCreateInfluencer} 
                            disabled={isCreatingInfluencer}
                        >
                            {isCreatingInfluencer ? <><div className="spinner"></div> Đang tạo ảnh...</> : '🌟 Tạo Influencer'}
                        </button>
                    </div>

                    {(influencerResultImage || isCreatingInfluencer) && (
                        <div className="vip-card">
                            <div className="vip-card-header"><h3 className="vip-card-title">Kết quả</h3></div>
                            <div className="compare-img-area" style={{height:'auto', minHeight:'300px', background:'#151515'}}>
                                 {isCreatingInfluencer ? <div className="spinner"></div> : influencerResultImage && <img src={influencerResultImage} style={{maxWidth:'100%', borderRadius:'8px'}}/>}
                            </div>
                            {influencerResultImage && (
                                <div style={{textAlign:'center'}}>
                                    <button className="btn-download" onClick={() => handleDownload(influencerResultImage!, 'Influencer_Result')}>
                                        ⬇️ Download 4K PNG
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);