export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: '缺少 API Key' });

        // 直接向 Google 請求該金鑰可用的模型清單
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listResponse.json();

        if (listData.error) {
            return res.status(500).json({ error: `獲取名單失敗: ${listData.error.message}` });
        }

        // 過濾出可以用來生成內容 (generateContent) 的模型
        const models = listData.models || [];
        const genModels = models
            .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
            .map(m => m.name.replace('models/', ''));

        if (genModels.length === 0) {
            return res.status(200).json({ result: "您的金鑰目前沒有支援任何生成模型，請檢查 Google AI Studio 帳單或帳號狀態。" });
        }

        // 將名單直接回傳給前端畫面
        return res.status(200).json({
            result: `【診斷成功】您的 API Key 支援以下模型，請將這串名單複製給我：\n\n${genModels.join('\n')}`
        });

    } catch (error) {
        return res.status(500).json({ error: `系統錯誤: ${error.message}` });
    }
}
