import React, { useEffect } from 'react';

// 声明全局变量 "TradingView", 可能会因为 TypeScript 默认并不知道 "TradingView" 属性存在于全局对象中
declare global {
    interface Window {
        TradingView: any; // 或者根据实际情况指定更具体的类型
    }
}

interface TrandingViewProps {
  biType:String;
}


const TradingViewChart: React.FC<TrandingViewProps> = ({biType}) => {
  const biName = biType.replace('Z','') || 'JUP';
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      new window.TradingView.widget({
        container_id: 'tv_chart_container',
        autosize: true,
        symbol: biName+'USDT',
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        details: true,
        hotlist: true,
        calendar: true,
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [biType]);

  return <div id="tv_chart_container" style={{height:'100%'}}/>;
};

export default TradingViewChart;