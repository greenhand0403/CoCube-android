package com.microblocks.mb;

import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 判断设备类型
        if (isTablet()) {
            // 平板：允许自由旋转
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);
        } else {
            // 手机：强制横屏（允许左右横屏旋转）
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        }

        // 设置全屏模式，隐藏导航栏和状态栏
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }

    /**
     * 判断是否为平板设备
     * 方法1: 使用最小屏幕宽度判断（推荐）
     */
    private boolean isTablet() {
        // 平板通常最小宽度 >= 600dp
        return getResources().getConfiguration().smallestScreenWidthDp >= 600;
    }

    /**
     * 判断是否为平板设备
     * 方法2: 使用屏幕尺寸分类（备选）
     */
    private boolean isTabletAlternative() {
        int screenLayout = getResources().getConfiguration().screenLayout;
        screenLayout &= Configuration.SCREENLAYOUT_SIZE_MASK;
        
        return screenLayout == Configuration.SCREENLAYOUT_SIZE_LARGE ||
               screenLayout == Configuration.SCREENLAYOUT_SIZE_XLARGE;
    }
}