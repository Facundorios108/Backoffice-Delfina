import React, { useState, useMemo, useRef } from 'react';

function FinancialChart({ transactions }) {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    
    // Expandimos a los últimos 30 días para un mejor panorama
    const daysToShow = 30;

    const chartData = useMemo(() => {
        if (!transactions || transactions.length === 0) return null;

        const getLocalMidnight = (dateStr, fallbackTimestamp) => {
            if (dateStr && typeof dateStr === 'string' && dateStr.includes('-')) {
                const [y, m, d] = dateStr.split('-');
                return new Date(y, m - 1, d).getTime();
            }
            return fallbackTimestamp || 0;
        };

        const now = new Date();
        const pastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToShow);

        const sorted = [...transactions].sort((a, b) => {
            const dateA = getLocalMidnight(a.fullDate, a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
            const dateB = getLocalMidnight(b.fullDate, b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
            return dateA - dateB;
        });

        // Generar puntos diarios (uno por día)
        const dailyData = {};
        for (let i = 0; i <= daysToShow; i++) {
            const d = new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate() + i);
            dailyData[d.toLocaleDateString('en-US')] = { net: 0, income: 0, expense: 0 };
        }

        sorted.forEach(tx => {
            const amount = parseFloat(tx.amount);
            const isIncome = tx.type === 'income';
            const dateVal = getLocalMidnight(tx.fullDate, tx.createdAt?.seconds ? tx.createdAt.seconds * 1000 : 0);
            const txDate = new Date(dateVal);
            
            if (dateVal >= pastDate.getTime()) {
                 const dateKey = txDate.toLocaleDateString('en-US');
                 if(dailyData[dateKey]) {
                     if(isIncome) dailyData[dateKey].income += amount;
                     else dailyData[dateKey].expense += amount;
                     dailyData[dateKey].net += isIncome ? amount : -amount;
                 }
            }
        });

        let dataPoints = [];
        for (let i = 0; i <= daysToShow; i++) {
            const d = new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate() + i);
            const key = d.toLocaleDateString('en-US');
            dataPoints.push({
                date: d,
                timestamp: d.getTime(),
                net: dailyData[key].net,
                income: dailyData[key].income,
                expense: dailyData[key].expense
            });
        }

        const viewBoxWidth = 800;
        const viewBoxHeight = 350;
        const paddingX = 40;
        const paddingYTop = 30;
        const paddingYBottom = 60;
        
        const usableWidth = viewBoxWidth - (paddingX * 2);
        const usableHeight = viewBoxHeight - paddingYTop - paddingYBottom;

        const minVal = Math.min(...dataPoints.map(d => d.net));
        const maxVal = Math.max(...dataPoints.map(d => d.net));
        
        // Si maxVal y minVal son idénticos o 0, prevenimos divisiones por cero
        const yRange = (maxVal - minVal) === 0 ? 10 : (maxVal - minVal);
        const graphMinY = minVal - (yRange * 0.1);
        const graphMaxY = maxVal + (yRange * 0.1);
        const effectiveYRange = graphMaxY - graphMinY;
        
        const gridLines = [];
        for (let i = 0; i <= 4; i++) {
            const value = graphMinY + (effectiveYRange * (i / 4));
            const y = viewBoxHeight - paddingYBottom - (usableHeight * (i / 4));
            gridLines.push({ value, y });
        }

        const minDate = dataPoints[0].timestamp;
        const maxDate = dataPoints[dataPoints.length - 1].timestamp;
        const rangeX = maxDate - minDate || 1;

        const points = dataPoints.map(d => {
            const x = paddingX + ((d.timestamp - minDate) / rangeX) * usableWidth;
            const y = viewBoxHeight - paddingYBottom - (((d.net - graphMinY) / effectiveYRange) * usableHeight);
            return { ...d, x, y };
        });

        let linePath = `M ${points[0].x},${points[0].y}`;
        // Curvas más orgánicas
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? 0 : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 === points.length ? i + 1 : i + 2];

            const tension = 0.2;
            const cp1x = p1.x + (p2.x - p0.x) * tension;
            const cp1y = p1.y + (p2.y - p0.y) * tension;
            const cp2x = p2.x - (p3.x - p1.x) * tension;
            const cp2y = p2.y - (p3.y - p1.y) * tension;
            
            linePath += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }

        // Generar path de area desde el zeroY real para que no baje todo si hay negativos
        const zeroY = viewBoxHeight - paddingYBottom - (((0 - graphMinY) / effectiveYRange) * usableHeight);
        const safeZeroY = (isNaN(zeroY) || zeroY < 0 || zeroY > viewBoxHeight) ? viewBoxHeight - paddingYBottom : zeroY;
        
        const areaPath = `M ${points[0].x},${safeZeroY} L ${points[0].x},${points[0].y} ${linePath.substring(2)} L ${points[points.length - 1].x},${safeZeroY} Z`;

        const startDateStr = new Date(pastDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const endDateStr = new Date(now).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        return { 
            linePath, areaPath, points, gridLines, 
            viewBoxWidth, viewBoxHeight, paddingX, paddingYBottom, safeZeroY,
            startDateStr, endDateStr
        };
    }, [transactions, daysToShow]);

    const svgRef = useRef(null);
    const handleMouseMove = (e) => {
        if (!chartData || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const xRate = (e.clientX - rect.left) / rect.width;
        const localX = xRate * chartData.viewBoxWidth;
        
        let closestPoint = chartData.points[0];
        let minDiff = Math.abs(chartData.points[0].x - localX);
        for (let i = 1; i < chartData.points.length; i++) {
            const diff = Math.abs(chartData.points[i].x - localX);
            if (diff < minDiff) {
                minDiff = diff;
                closestPoint = chartData.points[i];
            }
        }
        setHoveredPoint(closestPoint);
    };

    const handleMouseLeave = () => {
        setHoveredPoint(null);
    };

    if (!transactions || transactions.length === 0) {
        return (
            <div className="h-64 w-full flex flex-col items-center justify-center text-text-muted bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">bar_chart</span>
                <p className="text-sm font-medium">Sin datos suficientes</p>
            </div>
        );
    }
    if (!chartData) return null;

    return (
        <div className="relative w-full overflow-visible bg-white rounded-2xl shadow-soft border border-pink-50/50 p-4 mb-2">
            <div className="flex justify-between items-end mb-4 px-2">
                <div>
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5">
                        <span className="material-symbols-outlined !text-[18px] text-primary">insights</span>
                        Movimientos Diarios
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5 ml-6">Ingresos y Egresos (30 días)</p>
                </div>
            </div>

            <div className="relative w-full" style={{ paddingBottom: '45%' }}>
                <svg 
                    ref={svgRef}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair overflow-visible touch-none" 
                    viewBox={`0 0 ${chartData.viewBoxWidth} ${chartData.viewBoxHeight}`}
                    preserveAspectRatio="none"
                    onMouseMove={handleMouseMove}
                    onTouchMove={(e) => handleMouseMove(e.touches[0])}
                    onMouseLeave={handleMouseLeave}
                    onTouchEnd={handleMouseLeave}
                >
                    <defs>
                        <linearGradient id="premiumGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#f4258c" stopOpacity="0.4"></stop>
                            <stop offset="50%" stopColor="#f4258c" stopOpacity="0.1"></stop>
                            <stop offset="100%" stopColor="#f4258c" stopOpacity="0.0"></stop>
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {chartData.gridLines.map((gl, idx) => (
                        <g key={`gridY-${idx}`}>
                            <line 
                                x1={chartData.paddingX} 
                                x2={chartData.viewBoxWidth - chartData.paddingX} 
                                y1={gl.y} 
                                y2={gl.y} 
                                stroke="#f4f4f5" 
                                strokeWidth="1.5" 
                                strokeDasharray="6 6"
                            />
                            <text 
                                x={chartData.paddingX - 10} 
                                y={gl.y + 4} 
                                fill="#a1a1aa" 
                                fontSize="11" 
                                textAnchor="end"
                                fontFamily="Inter, sans-serif"
                                fontWeight="600"
                            >
                                ${Math.round(gl.value).toLocaleString('es-ES')}
                            </text>
                        </g>
                    ))}
                    
                    {/* Línea Base Zero */}
                    {chartData.safeZeroY > 0 && chartData.safeZeroY < chartData.viewBoxHeight && (
                        <line 
                            x1={chartData.paddingX} 
                            x2={chartData.viewBoxWidth - chartData.paddingX} 
                            y1={chartData.safeZeroY} 
                            y2={chartData.safeZeroY} 
                            stroke="#ec4899" 
                            strokeWidth="1" 
                            opacity="0.3"
                        />
                    )}

                    <text x={chartData.points[0].x} y={chartData.viewBoxHeight - 30} fill="#a1a1aa" fontSize="12" textAnchor="start" fontFamily="Inter, sans-serif" fontWeight="600">{chartData.startDateStr}</text>
                    <text x={chartData.points[Math.floor(chartData.points.length / 2)].x} y={chartData.viewBoxHeight - 30} fill="#a1a1aa" fontSize="12" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600">hace 15 días</text>
                    <text x={chartData.points[chartData.points.length - 1].x} y={chartData.viewBoxHeight - 30} fill="#a1a1aa" fontSize="12" textAnchor="end" fontFamily="Inter, sans-serif" fontWeight="600">{chartData.endDateStr}</text>

                    <g className="animate-fade-in-up" strokeLinecap="round" strokeLinejoin="round">
                        <path d={chartData.areaPath} fill="url(#premiumGradient)" stroke="none" />
                        <path d={chartData.linePath} fill="none" stroke="#f4258c" strokeWidth="4" filter="url(#glow)"/>
                        <path d={chartData.linePath} fill="none" stroke="#f4258c" strokeWidth="3" />
                    </g>

                    <circle 
                        cx={chartData.points[chartData.points.length - 1].x} 
                        cy={chartData.points[chartData.points.length - 1].y} 
                        fill="white" 
                        r="5" 
                        stroke="#f4258c" 
                        strokeWidth="3"
                    />

                    {hoveredPoint && (
                        <g>
                            <line 
                                x1={hoveredPoint.x} 
                                x2={hoveredPoint.x} 
                                y1={hoveredPoint.y} 
                                y2={chartData.viewBoxHeight - chartData.paddingYBottom} 
                                stroke="#f4258c" 
                                strokeWidth="1.5" 
                                strokeDasharray="4 4" 
                            />
                            <circle 
                                cx={hoveredPoint.x} 
                                cy={hoveredPoint.y} 
                                fill="#f4258c" 
                                r="6" 
                                stroke="white" 
                                strokeWidth="2.5"
                                className="transition-all duration-300 pointer-events-none drop-shadow-md"
                            />
                        </g>
                    )}
                </svg>

                {hoveredPoint && (
                    <div 
                        className="absolute bg-gray-900/95 text-white rounded-xl shadow-2xl px-4 py-3 pointer-events-none transition-all duration-100 block backdrop-blur-md z-50 border border-white/10"
                        style={{
                            left: `max(15px, min(calc(${(hoveredPoint.x / chartData.viewBoxWidth) * 100}% - 70px), calc(100% - 140px)))`,
                            top: `min(calc(${(hoveredPoint.y / chartData.viewBoxHeight) * 100}% - 80px), calc(100% - 100px))`
                        }}
                    >
                        <p className="text-[11px] text-gray-300 font-bold uppercase tracking-wider mb-2 pb-1 border-b border-white/10">
                            {new Date(hoveredPoint.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                        
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                            {hoveredPoint.income > 0 && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Ingresos</span>
                                    <span className="text-green-400 font-bold">+${hoveredPoint.income.toLocaleString()}</span>
                                </div>
                            )}
                            {hoveredPoint.expense > 0 && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Egresos</span>
                                    <span className="text-red-400 font-bold">-${hoveredPoint.expense.toLocaleString()}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10">
                                <span className="text-xs font-semibold text-gray-200">Total Día</span>
                                <span className={`text-sm font-extrabold ${hoveredPoint.net > 0 ? 'text-green-400' : hoveredPoint.net < 0 ? 'text-red-400' : 'text-white'}`}>
                                    ${hoveredPoint.net.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FinancialChart;
