// 完全自动识别GitHub仓库的动态组件
(function() {
    // 配置参数
    const config = {
        animalImage: "https://cdn-icons-png.flaticon.com/128/237/237921.png",
        size: 60,
        moveSpeed: 2.5,
        boundaryPadding: 15
    };

    // 从页面元数据获取仓库信息（由GitHub Actions自动注入）
    function getRepoInfoFromMeta() {
        const repoMeta = document.querySelector('meta[name="github-repo"]');
        if (repoMeta && repoMeta.content) {
            const [username, repoName] = repoMeta.content.split('/');
            if (username && repoName) {
                return {
                    username: username,
                    repoName: repoName,
                    repoUrl: `https://github.com/${username}/${repoName}`
                };
            }
        }
        return null;
    }

    // 从GitHub Pages环境变量获取（适用于GitHub Actions部署）
    function getRepoInfoFromEnv() {
        // 检查是否存在全局注入的GitHub环境变量
        if (window.GITHUB_REPOSITORY) {
            const [username, repoName] = window.GITHUB_REPOSITORY.split('/');
            if (username && repoName) {
                return {
                    username: username,
                    repoName: repoName,
                    repoUrl: `https://github.com/${username}/${repoName}`
                };
            }
        }
        return null;
    }

    // 从页面链接智能提取（作为fallback）
    function getRepoInfoFromLinks() {
        const repoRegex = /github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
        const links = document.getElementsByTagName('a');
        
        for (let link of links) {
            const match = link.href.match(repoRegex);
            if (match && match[1] && match[2]) {
                // 优先选择带有"source"、"repo"、"repository"等关键词的链接
                const linkText = link.textContent.toLowerCase();
                if (linkText.includes('source') || linkText.includes('repo') || 
                    linkText.includes('repository') || linkText.includes('代码')) {
                    return {
                        username: match[1],
                        repoName: match[2],
                        repoUrl: `https://github.com/${match[1]}/${match[2]}`
                    };
                }
            }
        }
        
        // 如果没有找到带关键词的链接，返回第一个匹配的仓库链接
        for (let link of links) {
            const match = link.href.match(repoRegex);
            if (match && match[1] && match[2]) {
                return {
                    username: match[1],
                    repoName: match[2],
                    repoUrl: `https://github.com/${match[1]}/${match[2]}`
                };
            }
        }
        
        return null;
    }

    // 主识别函数 - 多层级自动识别
    function detectRepoInfo() {
        // 1. 优先使用部署时注入的元数据（最可靠）
        const metaInfo = getRepoInfoFromMeta();
        if (metaInfo) return metaInfo;
        
        // 2. 其次使用环境变量
        const envInfo = getRepoInfoFromEnv();
        if (envInfo) return envInfo;
        
        // 3. 最后从页面链接提取
        const linkInfo = getRepoInfoFromLinks();
        if (linkInfo) return linkInfo;
        
        // 全部失败时返回null
        return null;
    }

    // 执行识别
    const repoInfo = detectRepoInfo();

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
        #auto-github-animal {
            position: fixed;
            z-index: 9999;
            cursor: move;
            user-select: none;
            transition: transform 0.3s ease;
        }
        #auto-github-animal:active {
            cursor: grabbing;
        }
        #auto-github-animal:hover {
            transform: scale(1.15);
        }
        #auto-github-animal img {
            width: ${config.size}px;
            height: ${config.size}px;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
        }
        #auto-github-animal .tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-5px);
            background: #24292e;
            color: white;
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
        }
        #auto-github-animal:hover .tooltip {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        #auto-github-animal .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #24292e transparent transparent transparent;
        }
    `;
    document.head.appendChild(style);

    // 创建小动物元素
    const animal = document.createElement('div');
    animal.id = 'auto-github-animal';
    
    // 设置提示信息
    const tooltipText = repoInfo 
        ? `GitHub: ${repoInfo.username}/${repoInfo.repoName}`
        : 'GitHub 仓库';
    
    animal.innerHTML = `
        <div class="tooltip">${tooltipText}</div>
        <img src="${config.animalImage}" alt="GitHub仓库小动物">
    `;
    document.body.appendChild(animal);

    // 移动和交互逻辑
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let currentX = 0;
    let currentY = 0;
    let velocityX = config.moveSpeed;
    let velocityY = config.moveSpeed;

    // 初始化位置
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

        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;

        // 边界反弹
        if (currentX <= config.boundaryPadding || currentX >= maxX) {
            velocityX = -velocityX;
        }
        if (currentY <= config.boundaryPadding || currentY >= maxY) {
            velocityY = -velocityY;
        }

        // 随机微调方向
        velocityX += (Math.random() - 0.5) * 0.2;
        velocityY += (Math.random() - 0.5) * 0.2;

        // 更新位置
        currentX += velocityX;
        currentY += velocityY;
        updatePosition();

        requestAnimationFrame(autoMove);
    }

    // 拖动功能
    animal.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = animal.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        animal.style.transition = 'none';
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
            animal.style.transition = 'transform 0.3s ease';
        }
    });

    // 点击跳转
    animal.addEventListener('click', () => {
        if (repoInfo && repoInfo.repoUrl) {
            window.open(repoInfo.repoUrl, '_blank');
        } else {
            // 如果所有识别都失败，跳转到GitHub首页
            window.open('https://github.com', '_blank');
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
})();
