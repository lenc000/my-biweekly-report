export const maxDuration = 60;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 接收新的 styleAdjustment 參數
        const { text, styleAdjustment, images } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: '缺少 API Key' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

        const systemInstruction = `
你現在是我的「青年儲蓄帳戶/特殊選才升學戰略教練」兼「雙週誌編輯」。
我的升學目標是「科技 × 影像 × 文化 × 地方創生」跨領域路線。主要瞄準：台科大/北科大資工系、北科文化發展系、文化大學文化觀光事業學系（9月首要目標）。
我的核心定位：「從電子與科技背景出發，進入影像創作與地方文化實作，進一步探索 AI、資訊科技與數位工具，思考如何將科技、影像、文化與地方發展結合。」

【寫作核心策略 - 必讀】
1. 拒絕流水帳：不要按時間順序重寫。請主動找出「我做了什麼 → 遇到什麼問題 → 如何解決(導入什麼科技/AI) → 得到什麼成果 → 產生什麼文化/觀光反思 → 下一步計畫」。
2. 一事多解（不虛構）：同一件事，請自然融合不同科系的亮點。
   - 資工視角：使用什麼 AI/數位工具、Prompt 設計、遇到什麼技術瓶頸、如何提升效率。
   - 文化發展視角：宜蘭/地方文化觀察、社區議題、與什麼人合作、影像如何保存地方文化。
   - 文化觀光視角：旅行與地方觀察、文化體驗、觀光如何影響地方、影像如何協助觀光傳播。
3. 五條成長線：請在文字中隱含科技線、影像線、文化線、觀光線與個人成長線的累積。

【輸出格式與嚴格規則】
規則 1：絕對禁止使用任何 Markdown 語法（例如 *、#、-、> 等符號），請全部使用純文字與全形中文標點符號排版。
規則 2：分類規則：在【這兩週的學習主題】中，盡量避免使用「其他類型」。只要有看展覽、出遊、參訪、走讀等行程，請一律優先歸類為「壯遊探索」。可選分類僅限：志願服務、壯遊探索、達人見習、創業見習、社區見習。
規則 3：請完全依照以下四個指定標題區塊輸出，方便我直接複製貼上，不要加上任何多餘的開場白或結語。

【這兩週的學習主題】
(請填入分類名稱，並用一句話簡述本週重點，展現跨域探索精神)

【到哪些地點】
(請直接用中文頓號分隔地點即可)

【遇到什麼樣的人事物】
(客觀描述專案、合作對象、實作任務。具體寫出使用的技術工具、AI 應用、實際拍攝或地方參與的狀況)

【學習、觀察到了什麼】
(這是最重要的部分。請整合上述的「資工/文化/觀光」視角，寫出我對文化觀光的洞察，以及科技資訊的解決方案。具體說明遇到什麼技術或執行瓶頸？想法有什麼改變？未來計畫學什麼新技術或深入什麼議題？)
`;

        // 判斷：如果使用者有填寫微調風格，就加上這段指令
        let extraStylePrompt = "";
        if (styleAdjustment && styleAdjustment.trim() !== "") {
            extraStylePrompt = `\n\n【🚀 本次特別微調要求】\n請在維持上述原則的前提下，本次的內容生成請特別遵循以下使用者要求：\n「${styleAdjustment}」\n`;
        }

        let contents = [
            {
                role: "user",
                parts: [
                    { text: systemInstruction + extraStylePrompt + "\n\n以下是我的原始口語與照片紀錄，請幫我提煉並轉化：\n" + (text || "無提供文字") }
                ]
            }
        ];

        if (images && images.length > 0) {
            images.forEach(imgStr => {
                const cleanBase64 = imgStr.replace(/^data:image\/\w+;base64,/, "");
                contents[0].parts.push({
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: cleanBase64
                    }
                });
            });
        }

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await apiResponse.json();
        
        if (!apiResponse.ok || data.error) {
            return res.status(500).json({ 
                error: `Google API 錯誤: ${data.error?.message || JSON.stringify(data)}` 
            });
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "無法解析回傳內容";
        return res.status(200).json({ result: resultText });

    } catch (error) {
        console.error('伺服器執行錯誤:', error);
        return res.status(500).json({ error: `伺服器例外錯誤: ${error.message}` });
    }
}
