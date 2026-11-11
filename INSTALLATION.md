# MineSense Atlas 0.3.2 安装与使用

适用 Windows 10 / 11 x64。安装包包含独立 Python 运行时，无需安装 Python；以当前用户身份安装，不要求管理员权限。此版本为科研实验软件，未进行代码签名。

## 首次使用

1. 运行 `MineSense-Atlas-0.3.2-Setup-x64.exe`，完成安装。
2. 从开始菜单打开 **MineSense Atlas**。软件在本机回环地址启动，并自动打开浏览器。
3. 自行设置本机账号和密码。没有预置账号，账号不会上传。
4. 没有项目数据时，工作台显示明确的空状态；车辆页面仍可查看坐标与布局预设，视觉感知可选择电脑或 USB 摄像头。
5. 需要历史回放时，在“雷达感知 → 设备与标定 → 本机实验数据目录”填入兼容的采集会话目录。若选择的项目目录包含多个会话，请直接选择一个会话。保存后，从开始菜单停止并重新打开软件。

回放功能要求兼容的项目目录结构，且相应的录像、点云文件及关联清单可用。此版本不会自动转换任意第三方数据集，也不会生成示例实验记录。

本版保留浏览器工作台界面，运行服务位于当前电脑。发布包包含通用应用实现代码，不提供算法保密保证；不附带任何论文实验数据、预先计算的研究结果或实际标定记录。相机内参标定求解器未包含在本发行版中，需要在完整标定环境中计算；通用空间/时间标定与记录接口仍可使用。

## 运行与退出

软件仅监听 `127.0.0.1`，未对局域网开放。重复打开会进入已运行实例。关闭浏览器不等于停止后台服务；使用开始菜单 **Stop MineSense Atlas** 停止。正在录制实验时会拒绝停止，请先归档采集。

安装目录为 `%LOCALAPPDATA%\Programs\MineSenseAtlas`；运行时只读。账号、设置、复核记录、研究记录与日志保存在 `%LOCALAPPDATA%\MineSenseAtlas`。升级与卸载保留这些用户数据；需要备份时先停止软件，再完整复制用户数据目录。

忘记密码时，在本机开始菜单选择 **Recover local account**。工具在交互终端内要求输入 RESET 并两次输入新密码；会撤销已有会话，不修改实验记录。只有具备当前 Windows 用户文件访问权的人才能使用此本机恢复功能。

## 可选的实时 YOLOv8m 推理

安装包带摄像头采集与原始预览运行时。为控制体积并避免重新分发模型，未附带 PyTorch、Ultralytics 或模型权重。缺少模型时会明确显示推理不可用，但原始预览仍可运行。

将已有的、已安装 OpenCV、cv2-enumerate-cameras、PyTorch 和 Ultralytics 的 Python 环境及官方预训练 YOLOv8m 权重配置到用户数据目录的 `settings.json`，保留原有字段，例如：

```json
{
  "camera_python": "E:/your-environment/python.exe",
  "yolo_weights": "E:/your-models/yolov8m.pt"
}
```

对应权重旁需有同名 `yolov8m.source.json`，含 `sha256` 字段（值为该权重文件的 SHA-256）。软件验证文件一致性；请自行核对其来自官方 Ultralytics 模型发布。也可使用环境变量 `RADAR_CAMERA_PYTHON` / `RADAR_YOLO_WEIGHTS`。重启后生效。

原雷达实时服务和厂商上位机不包含在包内。使用已有安装的 Livox Viewer 与 CAL Radar App Mgmt，按各自设备驱动与项目连接方式配置。程序中的车辆、云台、空间配准等预设不意味着真实底盘控制和标定已完成。

## 校验与排障

在 PowerShell 中使用 `Get-FileHash .\MineSense-Atlas-0.3.2-Setup-x64.exe -Algorithm SHA256`，与随包校验文件中的值比较。未签名的软件包可能触发 Windows SmartScreen，发布者没有被冒充为已认证签名者。

启动失败查看 `%LOCALAPPDATA%\MineSenseAtlas\server.log`。摄像头无法开启时检查 Windows 摄像头权限、USB 连接和其他软件占用。未连接实验数据时不能播放原始录像或计算历史实验结果。安装包不包含账号库、原始采集数据、复核结论和日志。
