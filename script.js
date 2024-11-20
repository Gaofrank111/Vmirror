// 预先获取DOM元素
const imageInput = document.getElementById('imageInput');
const imageDisplayArea = document.getElementById('imageDisplayArea');
const originalImage = document.getElementById('originalImage');
const mirrorCanvas = document.getElementById('mirrorImage');
const ctx = mirrorCanvas.getContext('2d', { alpha: false, willReadFrequently: true });

// 添加加载提示
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
loadingIndicator.innerHTML = '图片处理中...';
document.querySelector('.container').appendChild(loadingIndicator);

// 图片处理队列
let processingImage = false;

// 文件大小限制（3MB）
const MAX_FILE_SIZE = 3 * 1024 * 1024;

// 处理图片上传
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    // 检查文件是否存在且是图片
    if (!file || !file.type.startsWith('image/')) {
        alert('请选择有效的图片文件！');
        imageInput.value = ''; // 清空输入
        return;
    }
    
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
        alert('图片大小不能超过3MB，请选择较小的图片！');
        imageInput.value = ''; // 清空输入
        return;
    }

    if (processingImage) return; // 防止重复处理
    processingImage = true;

    try {
        loadingIndicator.style.display = 'block';
        
        // 快速预览
        const objectUrl = URL.createObjectURL(file);
        imageDisplayArea.classList.remove('hidden');
        originalImage.src = objectUrl;

        // 使用 createImageBitmap 加速图片处理
        createImageBitmap(file).then(bitmap => {
            const { width, height } = calculateDimensions(bitmap.width, bitmap.height, 600);
            
            // 设置画布尺寸
            mirrorCanvas.width = width;
            mirrorCanvas.height = height;
            
            // 使用 requestAnimationFrame 优化渲染
            requestAnimationFrame(() => {
                // 绘制镜像
                ctx.save();
                ctx.translate(width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(bitmap, 0, 0, width, height);
                ctx.restore();
                
                // 清理资源
                bitmap.close();
                URL.revokeObjectURL(objectUrl);
                
                // 重置状态
                loadingIndicator.style.display = 'none';
                processingImage = false;
            });
        }).catch(error => {
            console.error('图片处理失败:', error);
            loadingIndicator.style.display = 'none';
            processingImage = false;
            imageInput.value = ''; // 清空输入
            alert('图片处理失败，请重试');
        });
        
    } catch (error) {
        console.error('图片处理出错:', error);
        loadingIndicator.style.display = 'none';
        processingImage = false;
        imageInput.value = ''; // 清空输入
        alert('图片处理失败，请重试');
    }
});

// 优化的尺寸计算函数
function calculateDimensions(width, height, maxSize) {
    const ratio = width / height;
    
    if (width <= maxSize && height <= maxSize) {
        return { width, height };
    }
    
    return width > height
        ? { width: maxSize, height: Math.round(maxSize / ratio) }
        : { width: Math.round(maxSize * ratio), height: maxSize };
}

// 访问量检查优化
let lastCount = 0;
let checkTimer = null;

function checkVisitorCount() {
    const pvElement = document.getElementById('busuanzi_value_site_pv');
    if (pvElement?.innerText) {
        const count = parseInt(pvElement.innerText);
        if (count !== lastCount && count % 10 === 0) {
            const welcomeMessage = document.getElementById('welcomeMessage');
            welcomeMessage.textContent = `🎉 热烈欢迎第 ${count} 位访客！`;
            welcomeMessage.style.display = 'block';
        } else if (count !== lastCount) {
            document.getElementById('welcomeMessage').style.display = 'none';
        }
        lastCount = count;
    }
}

// 初始化函数
function initializeCanvas() {
    const size = 300; // 减小初始画布大小
    mirrorCanvas.width = size;
    mirrorCanvas.height = size;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, size, size);
}

// 页面加载优化
document.addEventListener('DOMContentLoaded', () => {
    // 立即初始化画布
    initializeCanvas();
    
    // 使用 RAF 进行访问量检查
    let rafId;
    function checkLoop() {
        checkVisitorCount();
        rafId = requestAnimationFrame(checkLoop);
    }
    checkLoop();
    
    // 30秒后切换到 setInterval 以节省资源
    setTimeout(() => {
        cancelAnimationFrame(rafId);
        setInterval(checkVisitorCount, 1000);
    }, 30000);
});

// 优化的窗口大小改变处理
let resizeTimeout;
window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    
    resizeTimeout = setTimeout(() => {
        if (!imageDisplayArea.classList.contains('hidden') && originalImage.src) {
            const img = new Image();
            img.onload = function() {
                const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight, 600);
                
                requestAnimationFrame(() => {
                    mirrorCanvas.width = width;
                    mirrorCanvas.height = height;
                    
                    ctx.save();
                    ctx.translate(width, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, 0, 0, width, height);
                    ctx.restore();
                });
            };
            img.src = originalImage.src;
        }
    }, 100);
}); 