// 2D游戏风格卡通人物组件 - 右下角固定+拖动+动态表情
(function() {
    // 配置参数
    const config = {
        size: 100, // 角色大小
        moveSpeed: 2,
        boundaryPadding: 15,
        emotionInterval: 3000, // 表情切换间隔(ms)
        blinkInterval: 5000,   // 眨眼间隔(ms)
        colors: {
            skin: '#FFDBAC',
            hair: '#3D2314',
            eyes: '#333333',
            mouth: '#E53935'
        }
    };

    // 仓库信息识别逻辑（保持原有逻辑）
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

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
        #game-character {
            position: fixed;
            z-index: 9999;
            cursor: move;
            user-select: none;
            transition: transform 0.3s ease;
        }
        #game-character:active {
            cursor: grabbing;
        }
        #game-character:hover {
            transform: scale(1.05);
        }
        #game-character canvas {
            width: ${config.size}px;
            height: ${config.size}px;
        }
        #game-character .tooltip {
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
        #game-character:hover .tooltip {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
        }
    `;
    document.head.appendChild(style);

    // 创建角色容器
    const characterContainer = document.createElement('div');
    characterContainer.id = 'game-character';
    const tooltipText = repoInfo ? `GitHub: ${repoInfo.username}/${repoInfo.repoName}` : 'GitHub 仓库';
    characterContainer.innerHTML = `<div class="tooltip">${tooltipText}</div>`;
    document.body.appendChild(characterContainer);

    // 创建Canvas元素
    const canvas = document.createElement('canvas');
    canvas.width = config.size;
    canvas.height = config.size;
    characterContainer.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // 角色状态
    const characterState = {
        emotion: 'happy', // happy, surprised, sad, angry
        isBlinking: false,
        blinkTimer: null,
        emotionTimer: null,
        // 动画参数
        bounceY: 0,
        bounceSpeed: 0.05,
        bounceDirection: 1
    };

    // 绘制角色函数
    function drawCharacter() {
        // 清除画布
        ctx.clearRect(0, 0, config.size, config.size);

        // 计算弹跳位置（增加活泼感）
        characterState.bounceY += characterState.bounceSpeed * characterState.bounceDirection;
        if (characterState.bounceY > 3 || characterState.bounceY < -3) {
            characterState.bounceDirection *= -1;
        }

        // 保存当前状态
        ctx.save();
        // 应用弹跳效果
        ctx.translate(0, characterState.bounceY);

        // 绘制头部（圆形）
        ctx.beginPath();
        ctx.arc(config.size / 2, config.size / 2 - 10, config.size / 2.5, 0, Math.PI * 2);
        ctx.fillStyle = config.colors.skin;
        ctx.fill();
        ctx.strokeStyle = '#E0B080';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制头发
        ctx.beginPath();
        ctx.arc(config.size / 2, config.size / 2 - 15, config.size / 2.3, 0, Math.PI, true);
        ctx.fillStyle = config.colors.hair;
        ctx.fill();
        // 头发细节
        ctx.beginPath();
        ctx.moveTo(config.size / 2 - 30, config.size / 2 - 30);
        ctx.lineTo(config.size / 2 - 40, config.size / 2 - 10);
        ctx.lineTo(config.size / 2 - 20, config.size / 2 - 20);
        ctx.fillStyle = config.colors.hair;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(config.size / 2 + 30, config.size / 2 - 30);
        ctx.lineTo(config.size / 2 + 40, config.size / 2 - 10);
        ctx.lineTo(config.size / 2 + 20, config.size / 2 - 20);
        ctx.fillStyle = config.colors.hair;
        ctx.fill();

        // 绘制眼睛
        const eyeY = config.size / 2 - 5;
        const eyeSize = characterState.isBlinking ? 2 : 8;
        
        // 左眼
        ctx.beginPath();
        ctx.ellipse(
            config.size / 2 - 15, 
            eyeY, 
            10, 
            eyeSize, 
            0, 
            0, 
            Math.PI * 2
        );
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
            config.size / 2 - 15 + (characterState.emotion === 'surprised' ? 0 : 2), 
            eyeY + (characterState.emotion === 'surprised' ? 0 : 2), 
            5, 
            0, 
            Math.PI * 2
        );
        ctx.fillStyle = config.colors.eyes;
        ctx.fill();

        // 右眼
        ctx.beginPath();
        ctx.ellipse(
            config.size / 2 + 15, 
            eyeY, 
            10, 
            eyeSize, 
            0, 
            0, 
            Math.PI * 2
        );
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
            config.size / 2 + 15 + (characterState.emotion === 'surprised' ? 0 : 2), 
            eyeY + (characterState.emotion === 'surprised' ? 0 : 2), 
            5, 
            0, 
            Math.PI * 2
        );
        ctx.fillStyle = config.colors.eyes;
        ctx.fill();

        // 绘制嘴巴（根据表情变化）
        ctx.beginPath();
        switch(characterState.emotion) {
            case 'happy':
                ctx.arc(config.size / 2, config.size / 2 + 20, 15, 0, Math.PI, false);
                ctx.lineWidth = 3;
                ctx.strokeStyle = config.colors.mouth;
                ctx.stroke();
                break;
            case 'surprised':
                ctx.arc(config.size / 2, config.size / 2 + 25, 8, 0, Math.PI * 2);
                ctx.fillStyle = config.colors.mouth;
                ctx.fill();
                break;
            case 'sad':
                ctx.arc(config.size / 2, config.size / 2 + 30, 15, 0, Math.PI, true);
                ctx.lineWidth = 3;
                ctx.strokeStyle = config.colors.mouth;
                ctx.stroke();
                break;
            case 'angry':
                ctx.moveTo(config.size / 2 - 10, config.size / 2 + 25);
                ctx.lineTo(config.size / 2, config.size / 2 + 30);
                ctx.lineTo(config.size / 2 + 10, config.size / 2 + 25);
                ctx.lineWidth = 3;
                ctx.strokeStyle = config.colors.mouth;
                ctx.stroke();
                break;
        }

        // 恢复状态
        ctx.restore();

        // 继续动画循环
        requestAnimationFrame(drawCharacter);
    }

    // 表情切换逻辑
    function changeEmotion() {
        const emotions = ['happy', 'surprised', 'happy', 'angry', 'happy', 'sad'];
        characterState.emotion = emotions[Math.floor(Math.random() * emotions.length)];
    }

    // 眨眼逻辑
    function blink() {
        characterState.isBlinking = true;
        setTimeout(() => {
            characterState.isBlinking = false;
        }, 200);
    }

    // 启动表情和眨眼定时器
    characterState.emotionTimer = setInterval(changeEmotion, config.emotionInterval);
    characterState.blinkTimer = setInterval(blink, config.blinkInterval);

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
        currentX = maxX;
        currentY = maxY;
        updatePosition();
    }

    function updatePosition() {
        characterContainer.style.left = `${currentX}px`;
        characterContainer.style.top = `${currentY}px`;
    }

    // 自动移动逻辑（增加活泼感）
    function autoMove() {
        if (isDragging) return;

        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;

        // 边界反弹
        if (currentX <= config.boundaryPadding || currentX >= maxX) velocityX = -velocityX;
        if (currentY <= config.boundaryPadding || currentY >= maxY) velocityY = -velocityY;

        // 随机微调方向
        velocityX += (Math.random() - 0.5) * 0.3;
        velocityY += (Math.random() - 0.5) * 0.3;

        currentX += velocityX;
        currentY += velocityY;
        updatePosition();
        requestAnimationFrame(autoMove);
    }

    // 拖动功能
    characterContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = characterContainer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        characterContainer.style.transition = 'none';
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
            characterContainer.style.transition = 'transform 0.3s ease';
        }
    });

    // 点击跳转
    characterContainer.addEventListener('click', () => {
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
    drawCharacter();
    autoMove();
})();