// api/generate.js

export default async function handler(req, res) {
  // ============================================================
  // 1. 只允許 POST 請求
  // ============================================================
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed",
    });
  }

  try {
    // ============================================================
    // 2. 取得 Gemini API Key
    // ============================================================
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");

      return res.status(500).json({
        success: false,
        error: "伺服器尚未設定 GEMINI_API_KEY。",
      });
    }

    // ============================================================
    // 3. 取得前端傳入資料
    // ============================================================
    const body = req.body || {};

    const text =
      typeof body.text === "string"
        ? body.text.trim()
        : "";

    const images = Array.isArray(body.images)
      ? body.images
      : [];

    if (!text && images.length === 0) {
      return res.status(400).json({
        success: false,
        error: "請至少提供文字或圖片。",
      });
    }

    // ============================================================
    // 4. 升學雙週誌 System Instruction
    // ============================================================
    const systemInstruction = `
你是一名專門協助台灣高中畢業生準備大學特殊選才、
青年學習體驗、壯遊計畫與雙週誌的升學顧問。

你的主要任務，是把使用者提供的口語化紀錄、
工作經驗、影像創作、攝影、科技學習、旅行、
地方創生、文化觀察、人物交流與生活經驗，
整理成具有真實性、學習性與升學價值的雙週誌。

【最重要原則】

1. 絕對不能捏造使用者沒有提供的事實。
2. 不可以自行創造人物姓名、地點、活動、作品、
   獎項、數據、工作內容或學習成果。
3. 可以整理、歸納、修飾語句，
   但不能把推測寫成已經發生的事情。
4. 保留使用者原本的真實經驗與個人特色。
5. 不要寫成一般旅遊日記。
6. 不要寫成流水帳。
7. 不要過度使用官腔或空泛的升學用語。
8. 優先呈現「實際做了什麼」、
   「遇到什麼問題」、
   「觀察到什麼」、
   「學會什麼」、
   「產生什麼新的想法」。
9. 如果內容涉及科技、影像、文化、
   地方創生、旅行或職涯探索，
   可以分析這些領域之間的關聯。
10. 如果資料不足，不要自行補充不存在的內容。

【升學思考方向】

請特別注意使用者可能同時具有：
- 影像創作
- 攝影與攝影技術
- 影片製作
- 剪輯
- 科技與電子
- AI
- 文化
- 地方創生
- 旅行
- 社會觀察
- 實作
- 職涯探索

等跨領域經驗。

整理時不要強行把所有事情都連在一起。
只有在原始資料真的存在關聯時，
才指出不同領域之間的連結。

【固定四個欄位】

每次輸出都必須完整包含以下四個欄位：

【一、這兩週的學習主題】

說明這兩週最核心的學習、探索或實作主題。

不要只是重複活動名稱，
而是要指出這些經驗背後真正累積的能力、
問題意識或思考。

【二、到哪些地點】

整理這兩週實際去過的重要地點。

如果原始資料沒有明確提供地點，
不要自行創造。

【三、遇到什麼樣的人事物】

整理這兩週接觸到的重要：
- 人
- 工作夥伴
- 老師
- 前輩
- 同學
- 地方居民
- 客戶
- 產業
- 設備
- 作品
- 活動
- 事件

如果沒有提供人物姓名，
可以使用「前輩」、「工作夥伴」、
「影像工作者」等一般稱呼。

【四、學習觀察到了什麼】

這是整篇最重要的部分。

請從實際經驗中整理：

- 看見了什麼現象
- 遇到什麼問題
- 學會了什麼
- 發現自己原本的想法有什麼改變
- 發現自己還缺少什麼
- 對未來升學有什麼思考
- 對未來工作有什麼思考
- 對自己能力有什麼新的認識

盡可能建立：

「實際行動 → 遭遇 → 觀察 → 思考 → 學習 → 下一步」

的邏輯。

【文字風格】

請使用自然、真實、成熟但不要過度正式的中文。

不要讓文章看起來像 AI 生成的制式作文。

避免：
「透過此次活動，我深刻體會到……」
「這次經驗讓我受益良多……」
「我更加了解團隊合作的重要性……」

除非原始內容真的支持這些結論。

優先使用具體事件與具體觀察。

【輸出格式】

請嚴格按照以下格式輸出：

【一、這兩週的學習主題】
...

【二、到哪些地點】
...

【三、遇到什麼樣的人事物】
...

【四、學習觀察到了什麼】
...

不要在最前面加入額外開場白。

不要在最後加入額外評論。
`;

    // ============================================================
    // 5. 建立 Gemini Parts
    // ============================================================
    const parts = [];

    // ------------------------------------------------------------
    // 文字
    // ------------------------------------------------------------
    if (text) {
      parts.push({
        text: text,
      });
    }

    // ------------------------------------------------------------
    // 圖片
    // ------------------------------------------------------------
    for (const image of images) {
      if (typeof image !== "string" || image.length === 0) {
        continue;
      }

      let mimeType = "image/jpeg";
      let base64Data = image;

      // ----------------------------------------------------------
      // 如果前端傳的是：
      // data:image/jpeg;base64,XXXXXX
      // ----------------------------------------------------------
      if (image.startsWith("data:")) {
        const match = image.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
        );

        if (!match) {
          console.warn("Invalid image data URL skipped.");
          continue;
        }

        mimeType = match[1];
        base64Data = match[2];
      }

      // 移除 Base64 中可能存在的空白
      base64Data = base64Data.replace(/\s/g, "");

      // ----------------------------------------------------------
      // 基本 Base64 格式檢查
      // ----------------------------------------------------------
      if (
        !/^[A-Za-z0-9+/]+={0,2}$/.test(base64Data)
      ) {
        console.warn("Invalid Base64 image skipped.");
        continue;
      }

      // ----------------------------------------------------------
      // Gemini 多模態圖片格式
      // ----------------------------------------------------------
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }

    // ============================================================
    // 6. 確認至少有一個有效 Part
    // ============================================================
    if (parts.length === 0) {
      return res.status(400).json({
        success: false,
        error: "沒有收到有效的文字或圖片資料。",
      });
    }

    // ============================================================
    // 7. Gemini Request Body
    // ============================================================
    const requestBody = {
      systemInstruction: {
        parts: [
          {
            text: systemInstruction,
          },
        ],
      },

      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],

      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2500,
      },
    };

    // ============================================================
    // 8. Gemini API Endpoint
    //
    // 使用目前官方文件中的 Flash 模型
    // ============================================================
    const model = "gemini-3.7-flash";

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // ============================================================
    // 9. 呼叫 Gemini API
    // ============================================================
    const response = await fetch(endpoint, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(requestBody),
    });

    // ============================================================
    // 10. 讀取 Gemini 回應
    // ============================================================
    const data = await response.json();

    // ============================================================
    // 11. Gemini API 錯誤
    // ============================================================
    if (!response.ok) {
      console.error("Gemini API Error:", {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });

      return res.status(502).json({
        success: false,
        error:
          data?.error?.message ||
          `Gemini API 發生錯誤（HTTP ${response.status}）。`,
      });
    }

    // ============================================================
    // 12. 取得 Gemini 生成的文字
    // ============================================================
    const generatedText =
      data?.candidates?.[0]?.content?.parts
        ?.filter((part) => typeof part?.text === "string")
        ?.map((part) => part.text)
        ?.join("")
        ?.trim();

    // ============================================================
    // 13. Gemini 沒有回傳文字
    // ============================================================
    if (!generatedText) {
      console.error(
        "Gemini returned no usable text:",
        JSON.stringify(data, null, 2)
      );

      return res.status(502).json({
        success: false,
        error: "Gemini 沒有回傳有效的文字內容。",
      });
    }

    // ============================================================
    // 14. 成功回傳
    //
    // 同時提供 text / result，
    // 避免前端原本使用不同欄位名稱造成 undefined。
    // ============================================================
    return res.status(200).json({
      success: true,
      text: generatedText,
      result: generatedText,
    });
  } catch (error) {
    // ============================================================
    // 15. 最外層錯誤捕捉
    // ============================================================
    console.error("Server Error:", error);

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "伺服器發生未知錯誤，請稍後再試。",
    });
  }
}
