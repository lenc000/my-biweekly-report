export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, images } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: '系統缺少 API Key，請檢查環境變數設定。' });
    }

    // 已替換為速度最快、不會超時且路徑正確的 Flash 模型
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `
你現在是我的「特殊選才/青年儲蓄帳戶升學戰略教練」兼「雙週誌編輯」。
請過濾我的冗言贅字，並轉化為符合以下固定欄位的精煉文字。

# 我的升學定位
背景：具備攝影、紀錄片與宜蘭地方創生實作經驗。
新動能：積極投入 AI 工具、資訊科技與程式學習。
敘事主軸：不分開談文化跟科技，而是寫出「我在進行影像或文化實作時，遇到什麼狀況，因此積極導入 AI 或程式解法」。展現跨域整合與主動學習。語氣客觀、專業、具體。

# 輸出格式 (嚴格遵守，勿加多餘對話)
## 【這兩週的學習主題】
(分類：志願服務/壯遊探索/達人見習/創業見習/社區見習/其他類型。並簡述一句話重點)

## 【到哪些地點】
(條列重要地點)

## 【遇到什麼樣的人事物】
(客觀描述專案、合作對象、實作任務。具體寫出使用的技術、實務狀況，以及嘗試導入的科技工具)

## 【學習、觀察到了什麼】
(整合文化觀光的洞察與科技資訊的解決方案。遇到什麼技術瓶頸？打算學什麼新技術突破？)
`;

    try {
        let contents = [
            {
                role: "user",
                parts: [
                    { text: systemInstruction + "\n\n以下是我的口語紀錄：\n" + (text || "無提供文字") }
                ]
            }
        ];

        if (images && images.length > 0) {
            images.forEach(base64Str => {
                contents[0].parts.push({
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Str
                    }
                });
            });
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: contents })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const resultText = data.candidates[0].content.parts[0].text;
        res.status(200).json({ result: resultText });

    } catch (error) {
        console.error('API 處理失敗:', error);
        res.status(500).json({ error: '生成內容失敗，請稍後再試。' });
    }
}
