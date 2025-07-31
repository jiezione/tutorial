// 动态创建小动物元素并添加到页面
(function() {
    // 尝试自动获取GitHub信息
    function getGitHubInfo() {
        // 1. 优先从meta标签获取（推荐用于自定义域名）
        const githubMeta = document.querySelector('meta[name="github-repo"]');
        if (githubMeta && githubMeta.content) {
            return `https://github.com/${githubMeta.content}`;
        }
        
        // 2. 从GitHub解析（适用于github.io域名）
        const hostname = window.location.hostname;
        if (hostname.endsWith('.github.io')) {
            const username = hostname.split('.')[0];
            // 提取仓库名（如果URL中有路径）
            const pathParts = window.location.pathname.split('/').filter(part => part);
            const repoName = pathParts.length > 0 ? pathParts[0] : '';
            
            return repoName ? `https://github.com/${username}/${repoName}` : `https://github.com/${username}`;
        }
        
        // 3. 如果都无法识别，返回null
        return null;
    }

    // 配置参数
    const config = {
        githubUrl: getGitHubInfo(), // 自动获取GitHub链接
        fallbackUrl: "https://github.com", // 无法识别时的备用链接
        animalImage: "https://cdn-icons-png.flaticon.com/128/237/237921.png", // 小动物图片
        size: 60, // 小动物尺寸（像素）
        moveSpeed: 2, // 移动速度
        changeDirInterval: 3000, // 改变方向间隔（毫秒）
        boundaryPadding: 20 // 边界内边距
    };

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
        #dynamic-animal {
            position: fixed;
            z-index: 9999;
            cursor: move;
            user-select: none;
            transition: transform 0.2s ease;
        }
        #dynamic-animal:active {
            cursor: grabbing;
        }
        #dynamic-animal img {
            width: ${config.size}px;
            height: ${config.size}px;
            filter: drop-shadow(0 3px 4px rgba(0,0,0,0.15));
        }
        .animal-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
        }
        #dynamic-animal:hover .animal-tooltip {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // 创建小动物元素（包含提示信息）
    const animal = document.createElement('div');
    animal.id = 'dynamic-animal';
    // 显示将要跳转的链接（隐藏域名，只显示用户/仓库部分）
    const displayUrl = config.githubUrl 
        ? config.githubUrl.replace('https://github.com/', '')
        : 'GitHub';
    animal.innerHTML = `
        <div class="animal-tooltip">跳转到 ${displayUrl}</div>
        <img src="${config.animalImage}" alt="动态小动物">
    `;
    document.body.appendChild(animal);

    // 状态变量
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let currentX = 0;
    let currentY = 0;
    let velocityX = config.moveSpeed;
    let velocityY = config.moveSpeed;
    let isClick = true;

    // 初始化位置（随机在可视区域内）
    function initPosition() {
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        currentX = Math.random() * (maxX - config.boundaryPadding) + config.boundaryPadding;
        currentY = Math.random() * (maxY - config.boundaryPadding) + config.boundaryPadding;
        updatePosition();
    }

    // 更新位置
    function updatePosition() {
        animal.style.left = `${currentX}px`;
        animal.style.top = `${currentY}px`;
    }

    // 自动移动逻辑
    function autoMove() {
        if (isDragging) return;

        // 边界检测与反弹
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;

        if (currentX <= config.boundaryPadding || currentX >= maxX) {
            velocityX = -velocityX;
        }
        if (currentY <= config.boundaryPadding || currentY >= maxY) {
            velocityY = -velocityY;
        }

        // 更新位置
        currentX += velocityX;
        currentY += velocityY;
        updatePosition();

        requestAnimationFrame(autoMove);
    }

    // 随机改变移动方向
    function randomChangeDirection() {
        if (isDragging) {
            setTimeout(randomChangeDirection, 500);
            return;
        }
        
        // 随机角度改变方向
        const angle = Math.random() * Math.PI * 2;
        velocityX = Math.cos(angle) * config.moveSpeed;
        velocityY = Math.sin(angle) * config.moveSpeed;
        
        setTimeout(randomChangeDirection, config.changeDirInterval);
    }

    // 拖动功能
    animal.addEventListener('mousedown', (e) => {
        isDragging = true;
        isClick = false;
        const rect = animal.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        animal.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // 计算新位置（考虑页面滚动）
        currentX = e.clientX - offsetX + window.scrollX;
        currentY = e.clientY - offsetY + window.scrollY;

        // 限制在边界内
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        currentX = Math.max(config.boundaryPadding, Math.min(currentX, maxX));
        currentY = Math.max(config.boundaryPadding, Math.min(currentY, maxY));

        updatePosition();
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            animal.style.transition = 'transform 0.2s ease';
            setTimeout(() => { isClick = true; }, 100);
        }
    });

    // 点击跳转GitHub
    animal.addEventListener('click', () => {
        if (isClick) {
            const targetUrl = config.githubUrl || config.fallbackUrl;
            window.open(targetUrl, '_blank');
        }
    });

    // 窗口大小改变时调整位置
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
    randomChangeDirection();
})();
