export const maxDuration = 60;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, images } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: '系統缺少 API Key，請檢查環境變數設定。' });
        }

        // 💡 終極解法：先去向 Google 詢問「這個金鑰目前有權限使用哪些模型？」
        const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listResponse = await fetch(listModelsUrl);
        const listData = await listResponse.json();
        
        if (listData.error) {
            return res.status(500).json({ error: `獲取模型列表失敗: ${listData.error.message}` });
        }

        // 💡 自動過濾出可以「生成內容」的模型
        const availableModels = listData.models || [];
        const supportedModels = availableModels.filter(m => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
        );

        if (supportedModels.length === 0) {
            return res.status(500).json({ error: '您的 API Key 目前沒有支援任何模型。' });
        }

        // 💡 自動挑選邏輯：優先找 flash，沒有就找 pro，再沒有就隨便拿第一個能用的
        let targetModelObj = supportedModels.find(m => m.name.includes("flash")) 
                          || supportedModels.find(m => m.name.includes("pro")) 
                          || supportedModels[0];
                          
        const targetModel = targetModelObj.name; // 系統會自動抓到正確名稱，例如 models/gemini-1.5-pro-002

        // 💡 使用自動找到的安全模型名稱發送請求
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`;

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

        let contents = [
            {
                role: "user",
                parts: [
                    { text: systemInstruction + "\n\n以下是我的口語紀錄：\n" + (text || "無提供文字") }
                ]
            }
        ];

        // 處理照片
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

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await apiResponse.json();
        
        if (data.error) {
            return res.status(500).json({ error: `AI 處理失敗 (${targetModel}): ${data.error.message}` });
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "無法解析回傳內容";
        return res.status(200).json({ result: resultText });

    } catch (error) {
        console.error('伺服器執行錯誤:', error);
        return res.status(500).json({ error: '伺服器發生異常錯誤: ' + error.message });
    }
}
