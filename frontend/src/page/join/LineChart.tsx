import React from 'react';
import { Line } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';

interface LineChartProps {
    data: ChartData<'line', number[], unknown>,
    options?: ChartOptions,
}

const LineChart: React.FC<LineChartProps> = ({ data, options }) => {
    return (
        <div>
            <Line data={data} options={options} />
        </div>
    );
};

export default LineChart;