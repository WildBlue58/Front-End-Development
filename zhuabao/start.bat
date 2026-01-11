@echo off
echo ========================================
echo   学生成绩提取工具 - 快速启动脚本
echo ========================================
echo.

echo [1/3] 检查后端依赖...
cd backend
if not exist "node_modules" (
    echo 正在安装后端依赖...
    call npm install
    if errorlevel 1 (
        echo 后端依赖安装失败！
        pause
        exit /b 1
    )
) else (
    echo 后端依赖已安装
)

echo.
echo [2/3] 检查前端依赖...
cd ..\frontend
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo 前端依赖安装失败！
        pause
        exit /b 1
    )
) else (
    echo 前端依赖已安装
)

echo.
echo [3/3] 启动服务...
echo.
echo 正在启动后端服务（端口 3002）...
start "Zhuabao Backend" cmd /k "cd ..\backend && npm start"

timeout /t 3 /nobreak >nul

echo 正在启动前端应用（端口 3000）...
start "Zhuabao Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo.
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3002
echo.
echo 请在浏览器中打开前端地址开始使用
echo.
echo 按任意键关闭此窗口...
pause >nul
