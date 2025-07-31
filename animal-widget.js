// 卡通人组件 - 右下角固定+拖动+表情切换
(function() {
    // 配置参数（新增表情图片数组）
    const config = {
        // 多个表情图片，实现表情变化效果
       表情图片: [
            "https://cdn-icons-png.flaticon.com/128/1804/1804417.png", // 开心
            "https://cdn-icons-png.flaticon.com/128/1804/1804425.png", // 眨眼
            "https://cdn-icons-png.flaticon.com/128/1804/1804433.png", // 惊讶
            "https://cdn-icons-png.flaticon.com/128/1804/1804445.png"  // 调皮
        ],
        size: 80, // 卡通人大小
        moveSpeed: 2, // 自动移动速度（拖动时会暂停）
        boundaryPadding: 15,
        表情切换间隔: 3000 // 3秒切换一次表情
    };

    // 仓库信息识别逻辑（保持不变）
    function detectRepoInfo() {
        const repoMeta = document.querySelector('meta[name="github-repo"]');
        if (repoMeta && repoMeta.content) {
            const [username, repoName] = repoMeta.content.split('/');
            return username && repoName ? {
                username, repoName, repoUrl: `https://github.com/${username}/${repoName}`
            } : null;
        }
        const repoRegex = /github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
        const links = document.getElementsByTagName('a');
        for (let link of links) {
            const match = link.href.match(repoRegex);
            if (match && match[1] && match[2]) return {
                username: match[1], repoName: match[2], repoUrl: link.href
            };
        }
        return null;
    }
    const repoInfo = detectRepoInfo();

    // 创建样式（优化卡通人显示效果）
    const style = document.createElement('style');
    style.textContent = `
        #cartoon-character {
            position: fixed;
            z-index: 9999;
            cursor: move;
            user-select: none;
            transition: transform 0.3s ease;
        }
        #cartoon-character:active {
            cursor: grabbing;
        }
        #cartoon-character:hover {
            transform: scale(1.1) rotate(3deg); /* hover时轻微放大旋转 */
        }
        #cartoon-character img {
            width: ${config.size}px;
            height: ${config.size}px;
            border-radius: 50%; /* 圆形头像效果 */
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: all 0.5s ease; /* 表情切换动画 */
        }
        #cartoon-character .tooltip {
            position: absolute;
            right: 100%;
            top: 50%;
            transform: translateY(-50%) translateX(-10px);
            background: #24292e;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
        }
        #cartoon-character:hover .tooltip {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
        }
    `;
    document.head.appendChild(style);

    // 创建卡通人元素
    const cartoon = document.createElement('div');
    cartoon.id = 'cartoon-character';
    const tooltipText = repoInfo ? `GitHub: ${repoInfo.username}/${repoInfo.repoName}` : 'GitHub 仓库';
    cartoon.innerHTML = `
        <div class="tooltip">${tooltipText}</div>
        <img src="${config.表情图片[0]}" alt="卡通人">
    `;
    document.body.appendChild(cartoon);
    const imgElement = cartoon.querySelector('img');

    // 表情切换逻辑
    let currentEmotionIndex = 0;
    function changeEmotion() {
        currentEmotionIndex = (currentEmotionIndex + 1) % config.表情图片.length;
        imgElement.style.opacity = 0; // 淡出效果
        setTimeout(() => {
            imgElement.src = config.表情图片[currentEmotionIndex];
            imgElement.style.opacity = 1; // 淡入效果
        }, 300);
    }
    // 定时切换表情
    const emotionInterval = setInterval(changeEmotion, config.表情切换间隔);

    // 位置控制（固定右下角初始化）
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let currentX = 0;
    let currentY = 0;
    let velocityX = config.moveSpeed;
    let velocityY = config.moveSpeed;

    // 初始化到右下角
    function initPosition() {
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        // 固定在右下角
        currentX = maxX;
        currentY = maxY;
        updatePosition();
    }

    function updatePosition() {
        cartoon.style.left = `${currentX}px`;
        cartoon.style.top = `${currentY}px`;
    }

    // 自动移动逻辑（保持活泼感）
    function autoMove() {
        if (isDragging) return;

        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;

        // 边界反弹
        if (currentX <= config.boundaryPadding || currentX >= maxX) velocityX = -velocityX;
        if (currentY <= config.boundaryPadding || currentY >= maxY) velocityY = -velocityY;

        // 随机微调方向（增加活泼感）
        velocityX += (Math.random() - 0.5) * 0.3;
        velocityY += (Math.random() - 0.5) * 0.3;

        currentX += velocityX;
        currentY += velocityY;
        updatePosition();
        requestAnimationFrame(autoMove);
    }

    // 拖动功能
    cartoon.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = cartoon.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        cartoon.style.transition = 'none'; // 拖动时取消动画
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX - offsetX + window.scrollX;
        currentY = e.clientY - offsetY + window.scrollY;

        // 限制在可视区域内
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        currentX = Math.max(config.boundaryPadding, Math.min(currentX, maxX));
        currentY = Math.max(config.boundaryPadding, Math.min(currentY, maxY));
        updatePosition();
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            cartoon.style.transition = 'transform 0.3s ease'; // 恢复动画
        }
    });

    // 点击跳转
    cartoon.addEventListener('click', () => {
        window.open(repoInfo?.repoUrl || 'https://github.com', '_blank');
    });

    // 窗口大小改变时重新限制位置
    window.addEventListener('resize', () => {
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        currentX = Math.max(config.boundaryPadding, Math.min(currentX, maxX));
        currentY = Math.max(config.boundaryPadding, Math.min(currentY, maxY));
        updatePosition();
    });

    // 初始化
    initPosition();
    autoMove();
})();