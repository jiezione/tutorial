// 修复后的GitHub仓库识别组件
(function() {
    // 优先先优先读取仓库信息的核心函数（增强版）
    function getGitHubRepoUrl() {
        // 1. 优先读取自动注入的meta标签（最可靠来源）
        const repoMeta = document.querySelector('meta[name="github-repo"]');
        if (repoMeta && repoMeta.content) {
            const repoInfo = repoMeta.content.trim();
            // 验证格式是否为 "用户名/仓库名"
            if (repoInfo.includes('/') && repoInfo.split('/').length === 2) {
                console.log('从meta标签获取仓库信息:', repoInfo);
                return `https://github.com/${repoInfo}`;
            }
        }

        // 2. 备选：扫描页面中的GitHub仓库链接
        const repoRegex = /https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
        const links = document.getElementsByTagName('a');
        for (let link of links) {
            if (repoRegex.test(link.href)) {
                console.log('从页面链接获取仓库信息:', link.href);
                return link.href;
            }
        }

        // 3. 未找到时返回null（便于调试）
        console.error('未找到有效的GitHub仓库信息');
        return null;
    }

    // 配置参数
    const config = {
        repoUrl: getGitHubRepoUrl(),
        animalImage: "https://cdn-icons-png.flaticon.com/128/237/237921.png",
        size: 60,
        moveSpeed: 2.5,
        boundaryPadding: 15
    };

    // 创建样式（保持不变）
    const style = document.createElement('style');
    style.textContent = `
        #github-repo-animal {
            position: fixed;
            z-index: 9999;
            cursor: pointer;
            user-select: none;
        }
        #github-repo-animal img {
            width: ${config.size}px;
            height: ${config.size}px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        .animal-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #24292e;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
        }
        #github-repo-animal:hover .animal-tooltip {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // 创建组件元素
    const animal = document.createElement('div');
    animal.id = 'github-repo-animal';
    
    // 显示提示信息（包含调试信息）
    const displayText = config.repoUrl 
        ? config.repoUrl.replace('https://github.com/', '')
        : '未找到仓库信息';
    animal.innerHTML = `
        <div class="animal-tooltip">${displayText}</div>
        <img src="${config.animalImage}" alt="GitHub仓库组件">
    `;
    document.body.appendChild(animal);

    // 点击跳转逻辑（增强错误处理）
    animal.addEventListener('click', () => {
        if (config.repoUrl) {
            window.open(config.repoUrl, '_blank');
        } else {
            // 调试用：点击时显示错误信息
            alert('无法跳转：未找到有效的GitHub仓库信息\n请检查页面meta标签是否正确');
        }
    });

    // 移动逻辑（保持不变）
    let x = Math.random() * (window.innerWidth - config.size);
    let y = Math.random() * (window.innerHeight - config.size);
    let vx = config.moveSpeed * (Math.random() > 0.5 ? 1 : -1);
    let vy = config.moveSpeed * (Math.random() > 0.5 ? 1 : -1);

    function updatePosition() {
        x += vx;
        y += vy;
        
        // 边界反弹
        if (x < 0 || x > window.innerWidth - config.size) vx = -vx;
        if (y < 0 || y > window.innerHeight - config.size) vy = -vy;
        
        animal.style.left = `${x}px`;
        animal.style.top = `${y}px`;
        requestAnimationFrame(updatePosition);
    }

    // 初始化
    updatePosition();
})();
