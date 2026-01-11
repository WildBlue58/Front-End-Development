#!/bin/bash

echo "========================================"
echo "  学生成绩提取工具 - 快速启动脚本"
echo "========================================"
echo ""

echo "[1/3] 检查后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "后端依赖安装失败！"
        exit 1
    fi
else
    echo "后端依赖已安装"
fi

echo ""
echo "[2/3] 检查前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "正在安装前端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "前端依赖安装失败！"
        exit 1
    fi
else
    echo "前端依赖已安装"
fi

echo ""
echo "[3/3] 启动服务..."
echo ""
echo "正在启动后端服务（端口 3002）..."
cd ../backend
npm start &
BACKEND_PID=$!

sleep 3

echo "正在启动前端应用（端口 3000）..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  启动完成！"
echo "========================================"
echo ""
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:3002"
echo ""
echo "请在浏览器中打开前端地址开始使用"
echo ""
echo "按 Ctrl+C 停止所有服务"

wait $BACKEND_PID $FRONTEND_PID
