// TODO: implement in microblocks-app repo instead
// capacitorBLE.js
import { BleClient } from "@capacitor-community/bluetooth-le";
import './css/capacitorBLE.css';

const MICROBLOCKS_SERVICE_UUID = 'bb37a001-b922-4018-8e74-e14824b3a638'
const MICROBLOCKS_RX_CHAR_UUID = 'bb37a002-b922-4018-8e74-e14824b3a638' // board receive characteristic
const MICROBLOCKS_TX_CHAR_UUID = 'bb37a003-b922-4018-8e74-e14824b3a638' // board transmit characteristic

class CapacitorBLESerial {
    // class variables
    feature_SerialInputBuffers = [];

    constructor() {
        this.device = null;
        this.connected = false;
        this.sendInProgress = false;
        this.bleClient = null;
    }

    async initialize() {
        // Get BleClient from Capacitor
        this.bleClient = BleClient;
        await this.bleClient.initialize();
    }


async scanAndSelectDevice() {
    // 创建对话框
    const dialog = this.createDeviceDialog();
    document.body.appendChild(dialog);

    const foundDevices = {};
    let updateTimer = null;
    let promiseResolve = null;
    let promiseReject = null;

    // 获取当前语言（优先级：浏览器语言 > 系统语言）
    const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    const isZh = lang.startsWith('zh');
    
    const i18n = {
        title: isZh ? '选择蓝牙设备' : 'Select Bluetooth Device',
        scanning: isZh ? '扫描中...' : 'Scanning...',
        unnamed: isZh ? '未命名设备' : 'Unnamed Device',
        noDevices: isZh ? '未找到设备' : 'No devices found'
    };

    // 更新对话框标题
    dialog.querySelector('h3').textContent = i18n.title;

    // 获取信号强度等级（用于CSS类名）
    const getSignalLevel = (rssi, allRssi) => {
        const minRssi = Math.min(...allRssi);
        const maxRssi = Math.max(...allRssi);
        const range = maxRssi - minRssi || 1;
        const normalized = (rssi - minRssi) / range;
        
        const signal_level = ['signal-1', 'signal-2', 'signal-3', 'signal-4'];
        let signal_id = 0;

        if (normalized >= 0.75) signal_id = 3;
        else if (normalized >= 0.5) signal_id = 2;
        else if (normalized >= 0.25) signal_id = 1;
        else signal_id = 0;

        // if devices num less than 4, adjust signal level to avoid all showing same level
        if (allRssi.length < 4) {
            signal_id = Math.min(signal_id + (4 - allRssi.length), 3);
        }

        return signal_level[signal_id];
    };

    // 更新设备列表的函数
    const updateDeviceList = () => {
        const devices = Object.values(foundDevices)
            .sort((a, b) => b.rssi - a.rssi);
        
        const listContainer = dialog.querySelector('.device-list');
        
        if (devices.length === 0) {
            listContainer.innerHTML = `<div class="scanning">${i18n.scanning}</div>`;
        } else {
            const allRssi = devices.map(d => d.rssi);
            listContainer.innerHTML = devices.map((d, i) => {
                const signalLevel = getSignalLevel(d.rssi, allRssi);
                return `
                    <div class="device-item" data-device-id="${d.deviceId}">
                        <span class="device-name">${d.name || i18n.unnamed}</span>
                        <span class="device-signal ${signalLevel}">
                            <span class="signal-bar"></span>
                            <span class="signal-bar"></span>
                            <span class="signal-bar"></span>
                            <span class="signal-bar"></span>
                        </span>
                    </div>
                `;
            }).join('');
        }

        // 绑定点击事件
        listContainer.querySelectorAll('.device-item').forEach(item => {
            item.onclick = () => {
                const deviceId = item.getAttribute('data-device-id');
                const selectedDevice = foundDevices[deviceId];
                dialog.remove();
                clearInterval(updateTimer);
                this.bleClient.stopLEScan();
                promiseResolve(selectedDevice);
            };
        });
    };

    return new Promise((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;

        // 开始扫描
        this.bleClient.requestLEScan(
            { services: [MICROBLOCKS_SERVICE_UUID], allowDuplicates: true }, // 改为 true 允许重复扫描
            (result) => {
                if (result.device && result.rssi !== undefined) {
                    const deviceId = result.device.deviceId;
                    const deviceName = result.device.name;
                    
                    // 如果设备已存在且之前没有名称，现在有名称了，则更新
                    if (foundDevices[deviceId]) {
                        // 更新 RSSI（取较强的信号）
                        if (result.rssi > foundDevices[deviceId].rssi) {
                            foundDevices[deviceId].rssi = result.rssi;
                        }
                        // 如果之前没有名称但现在有了，更新名称
                        if (!foundDevices[deviceId].name && deviceName) {
                            foundDevices[deviceId].name = deviceName;
                        }
                    } else {
                        // 新设备
                        foundDevices[deviceId] = {
                            ...result.device,
                            rssi: result.rssi
                        };
                    }
                }
            }
        ).catch(reject);

        // 每 500ms 更新一次列表
        updateTimer = setInterval(updateDeviceList, 500);

        // 取消按钮
        dialog.querySelector('.cancel-btn').onclick = () => {
            dialog.remove();
            clearInterval(updateTimer);
            this.bleClient.stopLEScan();
            promiseReject(new Error(isZh ? '用户取消选择' : 'User cancelled'));
        };

        // 3 秒后自动停止扫描
        setTimeout(() => {
            clearInterval(updateTimer);
            this.bleClient.stopLEScan();
            // if (Object.keys(foundDevices).length === 0) {
            //     dialog.remove();
            //     promiseReject(new Error(i18n.noDevices));
            // }
        }, 3000);
    });
}

createDeviceDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'ble-device-dialog';
    dialog.innerHTML = `
        <div class="dialog-overlay">
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3></h3>
                    <button class="cancel-btn">✕</button>
                </div>
                <div class="device-list"></div>
            </div>
        </div>
    `;

    return dialog;
}



    async connect() {
        try {
            if (!this.bleClient) await this.initialize();

            // Request device
            this.device = await this.scanAndSelectDevice();

            // Connect to device
            await this.bleClient.connect(this.device.deviceId , (deviceId) => {
                // disconnect callback
                console.log("Disconnected from device: " + deviceId);
                this.disconnect();
            });

            // Start notifications
            await this.bleClient.startNotifications(
                this.device.deviceId,
                MICROBLOCKS_SERVICE_UUID,
                MICROBLOCKS_TX_CHAR_UUID,
                (data) => {
                    const value = new Uint8Array(data.buffer);
                    GP_serialInputBuffers.push(value);
                    this.feature_SerialInputBuffers.push(value);
                }
            );

            this.connected = true;
            this.sendInProgress = false;
            console.log("Capacitor BLE connected");
        } catch (error) {
            console.error('BLE connection error:', error);
            this.disconnect();
        }
    }

    async disconnect() {
        if (this.device) {
            try {
                await this.bleClient.stopNotifications(
                    this.device.deviceId,
                    MICROBLOCKS_SERVICE_UUID,
                    MICROBLOCKS_TX_CHAR_UUID
                );
                await this.bleClient.disconnect(this.device.deviceId);
            } catch (error) {
                console.error('BLE disconnect error:', error);
            }
        }
        this.device = null;
        this.connected = false;
        this.sendInProgress = false;
    }

    isConnected() {
        return this.connected;
    }

    write_data(data) {
        let BLE_PACKET_LEN = 240;
        if (!this.device || !this.connected) return 0;
        if (this.sendInProgress) return 0;

        try {
            this.sendInProgress = true;

            // Split data into chunks if needed
            for (let i = 0; i < data.length; i += BLE_PACKET_LEN) {
                const chunk = data.slice(i, Math.min(i + BLE_PACKET_LEN, data.length));
                this.bleClient.writeWithoutResponse(
                    this.device.deviceId,
                    MICROBLOCKS_SERVICE_UUID,
                    MICROBLOCKS_RX_CHAR_UUID,
                    chunk
                );
            }

            this.sendInProgress = false;
            return data.length;
        } catch (error) {
            console.error('BLE write error:', error);
            this.sendInProgress = false;
            if (!this.isConnected()) {
                this.disconnect();
            }
            return 0;
        }
    }
}
window.CapacitorBLESerial = CapacitorBLESerial;
