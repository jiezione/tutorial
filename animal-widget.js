// 动态创建小动物元素并添加到页面
(function() {
    // 配置参数（可根据需要修改）
    const config = {
        githubUrl: "https://github.com/你的用户名", // 替换为你的GitHub用户主页
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
    `;
    document.head.appendChild(style);

    // 创建小动物元素
    const animal = document.createElement('div');
    animal.id = 'dynamic-animal';
    animal.innerHTML = `<img src="${config.animalImage}" alt="动态小动物">`;
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
            window.open(config.githubUrl, '_blank');
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