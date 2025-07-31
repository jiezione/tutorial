// 2D游戏角色精灵动画组件
(function() {
    // 仓库信息识别（保持原有逻辑）
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

    // 配置（核心：精灵动画参数）
    const config = {
        // 精灵图配置（根据实际帧图调整）
        sprite: {
            width: 128,    // 单帧宽度
            height: 192,   // 单帧高度
            totalFrames: 4, // 总帧数
            frameRate: 100, // 每帧间隔(ms)
            // 角色动画帧图（替换为你的序列帧图片）
            imageUrl: "https://picsum.photos/id/237/512/192" // 示例：4帧横向排列的精灵图
        },
        speed: 2,       // 移动速度
        startX: window.innerWidth - 150, // 初始X（右下角）
        startY: window.innerHeight - 220 // 初始Y（右下角）
    };

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
        #game-character {
            position: fixed;
            z-index: 9999;
            cursor: move;
            user-select: none;
            width: ${config.sprite.width}px;
            height: ${config.sprite.height}px;
        }
        #game-character .sprite {
            width: 100%;
            height: 100%;
            background-size: ${config.sprite.totalFrames * 100}% 100%;
            background-image: url("${config.sprite.imageUrl}");
            transition: background-position 0.1s steps(1);
        }
        #game-character .tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-5px);
            background: #24292e;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
        }
        #game-character:hover .tooltip {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // 创建角色容器
    const container = document.createElement('div');
    container.id = 'game-character';
    container.style.left = `${config.startX}px`;
    container.style.top = `${config.startY}px`;
    const tooltipText = repoInfo ? `GitHub: ${repoInfo.username}/${repoInfo.repoName}` : 'GitHub 仓库';
    container.innerHTML = `
        <div class="tooltip">${tooltipText}</div>
        <div class="sprite"></div>
    `;
    document.body.appendChild(container);
    const sprite = container.querySelector('.sprite');

    // 动画状态
    const state = {
        currentFrame: 0,
        direction: 1, // 1:右, -1:左
        isDragging: false,
        offsetX: 0,
        offsetY: 0,
        velocityX: config.speed
    };

    // 精灵动画逻辑
    function animateSprite() {
        // 更新帧（循环切换）
        state.currentFrame = (state.currentFrame + 1) % config.sprite.totalFrames;
        // 计算背景位置（横向序列帧）
        const xPos = -state.currentFrame * (100 / (config.sprite.totalFrames - 1));
        sprite.style.backgroundPosition = `${xPos}% 0`;
        setTimeout(animateSprite, config.sprite.frameRate);
    }

    // 自动移动逻辑
    function moveCharacter() {
        if (state.isDragging) return;

        // 获取容器当前位置
        let currentX = parseFloat(container.style.left);
        const maxX = window.innerWidth - config.sprite.width;
        
        // 边界反弹
        if (currentX <= 0 || currentX >= maxX) {
            state.direction *= -1;
            // 翻转角色（左右方向）
            sprite.style.transform = state.direction > 0 ? 'scaleX(1)' : 'scaleX(-1)';
        }

        // 更新位置
        currentX += state.velocityX * state.direction;
        container.style.left = `${currentX}px`;
        requestAnimationFrame(moveCharacter);
    }

    // 拖动功能
    container.addEventListener('mousedown', (e) => {
        state.isDragging = true;
        const rect = container.getBoundingClientRect();
        state.offsetX = e.clientX - rect.left;
        state.offsetY = e.clientY - rect.top;
    });

    document.addEventListener('mousemove', (e) => {
        if (state.isDragging) {
            const x = e.clientX - state.offsetX + window.scrollX;
            const y = e.clientY - state.offsetY + window.scrollY;
            // 限制在窗口内
            const maxX = window.innerWidth - config.sprite.width;
            const maxY = window.innerHeight - config.sprite.height;
            container.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            container.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        state.isDragging = false;
    });

    // 点击跳转
    container.addEventListener('click', () => {
        if (repoInfo?.repoUrl) {
            window.open(repoInfo.repoUrl, '_blank');
        }
    });

    // 初始化动画
    animateSprite();
    moveCharacter();
})();