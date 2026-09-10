export const maxDuration = 60;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, images } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: '缺少 API Key' });
        }

        // 鎖定唯一且最穩定的 Flash 模型
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        let contents = [
            {
                role: "user",
                parts: [{ text: text || "測試" }]
            }
        ];

        // 處理圖片：強制濾除前端可能帶入的 base64 前綴，避免 Google API 解析錯誤
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
        
        // 診斷關鍵：如果 Google 報錯，直接把最原始的錯誤訊息吐給前端
        if (!apiResponse.ok || data.error) {
            return res.status(500).json({ 
                error: `Google API 拒絕請求。真實原因: ${JSON.stringify(data.error)}` 
            });
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "無法解析回傳內容";
        return res.status(200).json({ result: resultText });

    } catch (error) {
        console.error('伺服器執行錯誤:', error);
        return res.status(500).json({ error: `伺服器例外錯誤: ${error.message}` });
    }
}
