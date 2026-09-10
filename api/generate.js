<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>00後翻譯機</title>
    <style>
        /* 整體背景：墨蘭迪綠到墨蘭迪藍的漸層 */
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, 'PingFang TC', '微軟正黑體', sans-serif; 
            background: linear-gradient(135deg, #8ba89f 0%, #7e99b0 100%); 
            min-height: 100vh; 
            margin: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            padding: 20px; 
            box-sizing: border-box; 
        }
        
        /* 主體卡片美化 */
        .container { 
            background: rgba(255, 255, 255, 0.95); 
            padding: 40px 35px; 
            border-radius: 16px; 
            box-shadow: 0 15px 35px rgba(0,0,0,0.15); 
            width: 100%; 
            max-width: 800px; 
        }
        
        /* 標題：00後翻譯機 (墨蘭迪藍漸層、粗體) */
        h1 { 
            text-align: center; 
            margin-top: 0; 
            margin-bottom: 25px;
            font-size: 32px;
            font-weight: 900;
            background: linear-gradient(135deg, #6c8aa3 0%, #4b6a85 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 2px;
        }

        .form-group { margin-bottom: 25px; }
        label { display: block; margin-bottom: 10px; font-weight: bold; color: #444; font-size: 15px; }
        
        /* 輸入框美化 */
        textarea { 
            width: 100%; 
            height: 160px; 
            padding: 15px; 
            border: 1.5px solid #d1d5db; 
            border-radius: 10px; 
            resize: vertical; 
            box-sizing: border-box; 
            font-size: 16px; 
            line-height: 1.6;
            transition: border-color 0.3s, box-shadow 0.3s;
        }
        textarea:focus {
            outline: none;
            border-color: #8ba89f;
            box-shadow: 0 0 0 3px rgba(139, 168, 159, 0.2);
        }
        
        /* 選擇檔案按鈕美化 (墨蘭迪綠) */
        input[type="file"] { margin-bottom: 10px; font-family: inherit; }
        input[type="file"]::file-selector-button {
            background-color: #8ba89f;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.3s;
            font-weight: bold;
            margin-right: 15px;
            font-size: 14px;
        }
        input[type="file"]::file-selector-button:hover {
            background-color: #759289;
        }
        
        /* 預覽區塊樣式 */
        #preview-container { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 15px; }
        .preview-box { 
            width: 90px; 
            height: 90px; 
            position: relative; 
            border-radius: 10px; 
            overflow: hidden; 
            box-shadow: 0 3px 8px rgba(0,0,0,0.1); 
            border: 1px solid #e5e7eb; 
            background: #fff;
        }
        .preview-box img { width: 100%; height: 100%; object-fit: cover; }
        
        /* 灰色叉叉，預設隱藏，hover時浮現 */
        .delete-btn { 
            position: absolute; 
            top: 4px; 
            right: 4px; 
            background: rgba(100, 100, 100, 0.85); 
            color: white; 
            border: none; 
            border-radius: 50%; 
            width: 24px; 
            height: 24px; 
            font-size: 12px; 
            cursor: pointer; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            padding: 0; 
            opacity: 0; 
            transition: opacity 0.2s ease, background 0.2s;
        }
        .preview-box:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { background: rgba(70, 70, 70, 0.95); }

        /* 送出按鈕美化 (墨蘭迪藍) */
        button#submitBtn { 
            width: 100%; 
            padding: 16px; 
            background: #7e99b0; 
            color: white; 
            border: none; 
            border-radius: 10px; 
            font-size: 18px; 
            font-weight: bold; 
            cursor: pointer; 
            transition: background-color 0.3s, transform 0.1s; 
            letter-spacing: 1px;
        }
        button#submitBtn:hover { background: #6c8aa3; }
        button#submitBtn:active { transform: translateY(2px); }
        button#submitBtn:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; }
        
        #result-container { margin-top: 30px; }
        .result-box { 
            background: #f8fafc; 
            padding: 25px; 
            border-radius: 10px; 
            border: 1px solid #e2e8f0; 
            white-space: pre-wrap; 
            line-height: 1.7; 
            font-size: 16px; 
            min-height: 120px; 
            color: #334155; 
        }
    </style>
</head>
<body>

<div class="container">
    <h1>00後翻譯機</h1>
    
    <div class="form-group">
        <label>1. 貼上你的語音文字稿：</label>
        <textarea id="textInput" placeholder="請在此貼上紀錄內容..."></textarea>
    </div>

    <div class="form-group">
        <label>2. 上傳相關照片：</label>
        <input type="file" id="imageInput" multiple accept="image/*">
        <!-- 縮圖預覽區 -->
        <div id="preview-container"></div>
    </div>

    <button id="submitBtn">產出結果</button>

    <div id="result-container">
        <label>產出結果 (請直接複製貼上至繳交網站)：</label>
        <div id="result" class="result-box">尚未產出...</div>
    </div>
</div>

<script>
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('preview-container');
    const submitBtn = document.getElementById('submitBtn');
    const resultBox = document.getElementById('result');
    
    let selectedFiles = [];

    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        selectedFiles = selectedFiles.concat(files);
        imageInput.value = '';
        renderPreviews();
    });

    function renderPreviews() {
        previewContainer.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const box = document.createElement('div');
                box.className = 'preview-box';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '✖';
                deleteBtn.onclick = () => {
                    selectedFiles.splice(index, 1);
                    renderPreviews();
                };

                box.appendChild(img);
                box.appendChild(deleteBtn);
                previewContainer.appendChild(box);
            };
            reader.readAsDataURL(file);
        });
    }

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    submitBtn.addEventListener('click', async () => {
        const text = document.getElementById('textInput').value;
        if (!text && selectedFiles.length === 0) {
            alert('請至少輸入文字或上傳一張照片！');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = '處理中，請稍候...';
        resultBox.innerText = 'AI 正在分析與撰寫中...';

        try {
            const base64Images = await Promise.all(selectedFiles.map(file => getBase64(file)));

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, images: base64Images })
            });

            const data = await response.json();

            if (response.ok) {
                resultBox.innerText = data.result;
            } else {
                resultBox.innerText = `發生錯誤: ${data.error}`;
            }
        } catch (error) {
            resultBox.innerText = `連線失敗: ${error.message}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = '產出結果';
        }
    });
</script>

</body>
</html>
