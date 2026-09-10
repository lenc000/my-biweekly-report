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

        // 建立穩定模型備援清單，按順序自動嘗試
        const modelsToTry = [
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro-latest",
            "gemini-1.5-pro",
            "gemini-pro-vision"
        ];

        let lastErrorMessage = "";

        // 執行備援迴圈
        for (const modelName of modelsToTry) {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            
            try {
                const apiResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents })
                });

                const data = await apiResponse.json();
                
                if (!data.error) {
                    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "無法解析回傳內容";
                    return res.status(200).json({ result: resultText });
                } else {
                    lastErrorMessage = data.error.message;
                    console.log(`模型 ${modelName} 遭到阻擋或失敗: ${lastErrorMessage}`);
                    // 失敗則自動進入下一次迴圈嘗試下一個模型
                }
            } catch (fetchError) {
                lastErrorMessage = fetchError.message;
                console.log(`模型 ${modelName} 連線失敗: ${lastErrorMessage}`);
            }
        }

        // 若清單內所有模型皆失敗才回傳錯誤
        return res.status(500).json({ error: `所有模型皆無權限或嘗試失敗。最後錯誤: ${lastErrorMessage}` });

    } catch (error) {
        console.error('伺服器執行錯誤:', error);
        return res.status(500).json({ error: '伺服器發生異常錯誤' });
    }
}
