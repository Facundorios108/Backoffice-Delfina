import React, { useState, useMemo, useRef } from 'react';
import { STOCK_CATEGORIES } from '../constants';

function AnalyticsScreen({ onClose, transactions, stockItems }) {
    const scrollRef = useRef(null);
    const [analyticsProductType, setAnalyticsProductType] = useState('musculosa');
    const [stockProductType, setStockProductType] = useState('remera');

    const analyticsData = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        const soldByProduct = { musculosa: 0, remera: 0 };

        // Contadores para análisis
        const baseDesignCounts = {
            aceitunas: 0, concha_de_mar: 0, libelula: 0, limon: 0,
            medusa: 0, ojo_negro: 0, pimiento: 0, saturno_azul: 0,
            saturno_dorado: 0, otro: 0
        };
        const baseColorCounts = {
            azul: 0, blanco: 0, chocolate: 0,
            gris_petroleo: 0, negro: 0, verde: 0
        };
        const baseSizeCounts = { s: 0, m: 0, l: 0, xl: 0 };
        const designCountsByProduct = {
            musculosa: { ...baseDesignCounts },
            remera: { ...baseDesignCounts }
        };
        const colorCountsByProduct = {
            musculosa: { ...baseColorCounts },
            remera: { ...baseColorCounts }
        };
        const sizeCountsByProduct = {
            musculosa: { ...baseSizeCounts },
            remera: { ...baseSizeCounts }
        };
        const paymentMethodCounts = { transferencia: 0, efectivo: 0, tarjeta: 0 };
        const paymentMethodIncome = { transferencia: 0, efectivo: 0, tarjeta: 0 };
        const expenseByCategory = {
            musculosas: 0, remeras: 0, merceria: 0, logistica: 0, marketing: 0
        };

        // Análisis mensual (este mes vs mes anterior)
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        let currentMonthIncome = 0;
        let currentMonthExpense = 0;
        let previousMonthIncome = 0;
        let previousMonthExpense = 0;

        transactions.forEach(tx => {
            const amount = parseFloat(tx.amount) || 0;
            const txDate = tx.fullDate ? new Date(tx.fullDate) : new Date();
            const txMonth = txDate.getMonth();
            const txYear = txDate.getFullYear();

            if (tx.type === 'income') {
                totalIncome += amount;
                if (txYear === currentYear && txMonth === currentMonth) {
                    currentMonthIncome += amount;
                } else if (txYear === previousYear && txMonth === previousMonth) {
                    previousMonthIncome += amount;
                }

                // Contar método de pago para ingresos
                const method = tx.paymentMethod || 'transferencia';
                if (paymentMethodIncome.hasOwnProperty(method)) {
                    paymentMethodIncome[method] += amount;
                }
            } else {
                totalExpense += amount;
                if (txYear === currentYear && txMonth === currentMonth) {
                    currentMonthExpense += amount;
                } else if (txYear === previousYear && txMonth === previousMonth) {
                    previousMonthExpense += amount;
                }

                // Gastos por categoría
                if (expenseByCategory.hasOwnProperty(tx.category)) {
                    expenseByCategory[tx.category] += amount;
                }
            }

            // Contar método de pago
            const method = tx.paymentMethod || 'transferencia';
            if (paymentMethodCounts.hasOwnProperty(method)) {
                paymentMethodCounts[method]++;
            }

            // Analizar ventas por tipo de prenda
            if (tx.category === 'online') {
                // Soportar tanto el nuevo formato (products array) como el antiguo (campos individuales)
                const productsArray = tx.products || (tx.productType ? [{
                    productType: tx.productType,
                    musculosaDesign: tx.musculosaDesign,
                    musculosaColor: tx.musculosaColor,
                    musculosaSize: tx.musculosaSize
                }] : []);

                productsArray.forEach(product => {
                    if (!product.productType || !product.musculosaDesign) return;

                    const type = product.productType === 'remera' ? 'remera' : 'musculosa';
                    soldByProduct[type]++;

                    // Diseño
                    const designCounts = designCountsByProduct[type];
                    if (designCounts && designCounts.hasOwnProperty(product.musculosaDesign)) {
                        designCounts[product.musculosaDesign]++;
                    } else if (designCounts) {
                        designCounts.otro++;
                    }

                    // Color
                    const colorCounts = colorCountsByProduct[type];
                    if (product.musculosaColor && colorCounts && colorCounts.hasOwnProperty(product.musculosaColor)) {
                        colorCounts[product.musculosaColor]++;
                    }

                    // Talle
                    const sizeCounts = sizeCountsByProduct[type];
                    if (product.musculosaSize && sizeCounts) {
                        const size = product.musculosaSize.toLowerCase();
                        if (sizeCounts.hasOwnProperty(size)) {
                            sizeCounts[size]++;
                        }
                    }
                });
            } else if (tx.type === 'income') {
                // Lógica histórica para contar ventas presenciales o antiguas
                if (tx.category === 'musculosas') {
                    soldByProduct.musculosa += (tx.quantity ? Number(tx.quantity) : 1);
                } else if (tx.category === 'remeras') {
                    soldByProduct.remera += (tx.quantity ? Number(tx.quantity) : 1);
                } else if (tx.title && tx.title.toLowerCase().includes('venta')) {
                    // Fallback si la categoría no es exacta pero el título menciona "venta" y la prenda
                    const lowerTitle = tx.title.toLowerCase();
                    if (lowerTitle.includes('musculosa')) {
                        soldByProduct.musculosa += (tx.quantity ? Number(tx.quantity) : 1);
                    } else if (lowerTitle.includes('remera')) {
                        soldByProduct.remera += (tx.quantity ? Number(tx.quantity) : 1);
                    }
                }
            }
        });

        const balance = totalIncome - totalExpense;

        return {
            totalIncome, totalExpense, balance,
            soldByProduct, designCountsByProduct, colorCountsByProduct, sizeCountsByProduct,
            paymentMethodCounts, paymentMethodIncome, expenseByCategory,
            currentMonthIncome, currentMonthExpense,
            previousMonthIncome, previousMonthExpense
        };
    }, [transactions]);

    // Calcular datos para gráfico de torta
    const pieData = useMemo(() => {
        const designCounts = analyticsData.designCountsByProduct?.[analyticsProductType] || {};
        const total = Object.values(designCounts).reduce((sum, val) => sum + val, 0);
        if (total === 0) return [];

        const colors = {
            aceitunas: '#22c55e',
            concha_de_mar: '#06b6d4',
            libelula: '#f97316',
            limon: '#eab308',
            medusa: '#8b5cf6',
            ojo_negro: '#1f2937',
            pimiento: '#ef4444',
            saturno_azul: '#3b82f6',
            saturno_dorado: '#fbbf24',
            otro: '#64748b'
        };

        const labels = {
            aceitunas: 'Aceitunas',
            concha_de_mar: 'Concha de mar',
            libelula: 'Libélula',
            limon: 'Limón',
            medusa: 'Medusa',
            ojo_negro: 'Ojo negro',
            pimiento: 'Pimiento',
            saturno_azul: 'Saturno Azul',
            saturno_dorado: 'Saturno Dorado',
            otro: 'Otro'
        };

        let currentAngle = 0;
        const slices = [];

        Object.entries(designCounts).forEach(([design, count]) => {
            if (count > 0) {
                const percentage = (count / total) * 100;
                const angle = (count / total) * 360;
                slices.push({
                    design,
                    label: labels[design],
                    count,
                    percentage,
                    color: colors[design],
                    startAngle: currentAngle,
                    endAngle: currentAngle + angle
                });
                currentAngle += angle;
            }
        });

        return slices;
    }, [analyticsData, analyticsProductType]);

    // Función para crear path de slice de torta
    const createPieSlice = (startAngle, endAngle, radius = 80) => {
        const start = polarToCartesian(100, 100, radius, endAngle);
        const end = polarToCartesian(100, 100, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        return `M 100 100 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
    };

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    // Calcular valor del inventario
    const inventoryValue = useMemo(() => {
        console.log('📊 Recalculando inventoryValue con stockItems:', stockItems.length, 'items');
        let totalUnits = 0;
        const stockByColor = {
            azul: 0, blanco: 0, chocolate: 0,
            gris_petroleo: 0, negro: 0, verde: 0
        };
        const stockByColorAndSize = {};
        const productTypesByColor = {}; // Guardar tipos de prenda por color
        const stockByColorByType = {
            musculosa: { ...stockByColor },
            remera: { ...stockByColor }
        };
        const stockByColorAndSizeByType = {
            musculosa: {},
            remera: {}
        };

        stockItems.forEach(item => {
            console.log('  📦 Procesando item:', item.name, 'Color:', item.category);
            const itemTotal = (item.stock?.s || 0) + (item.stock?.m || 0) +
                (item.stock?.l || 0) + (item.stock?.xl || 0);
            totalUnits += itemTotal;

            // Contar por color
            if (item.category && stockByColor.hasOwnProperty(item.category)) {
                stockByColor[item.category] += itemTotal;

                // Guardar desglose por talle
                if (!stockByColorAndSize[item.category]) {
                    stockByColorAndSize[item.category] = { s: 0, m: 0, l: 0, xl: 0 };
                }
                stockByColorAndSize[item.category].s += (item.stock?.s || 0);
                stockByColorAndSize[item.category].m += (item.stock?.m || 0);
                stockByColorAndSize[item.category].l += (item.stock?.l || 0);
                stockByColorAndSize[item.category].xl += (item.stock?.xl || 0);

                // Guardar tipos de prenda (Musculosa/Remera)
                if (!productTypesByColor[item.category]) {
                    productTypesByColor[item.category] = [];
                }
                const itemName = item.name || '';
                const isMusculosa = itemName.toLowerCase().includes('musculosa');
                const isRemera = itemName.toLowerCase().includes('remera') && !isMusculosa;
                const type = isMusculosa ? 'Musculosa' : isRemera ? 'Remera' : 'Prenda';
                if (!productTypesByColor[item.category].includes(type)) {
                    productTypesByColor[item.category].push(type);
                }

                // Guardar stock por color y talle por tipo de prenda
                const typeKey = isMusculosa ? 'musculosa' : isRemera ? 'remera' : null;
                if (typeKey && stockByColorByType[typeKey] && stockByColorByType[typeKey].hasOwnProperty(item.category)) {
                    stockByColorByType[typeKey][item.category] += itemTotal;
                    if (!stockByColorAndSizeByType[typeKey][item.category]) {
                        stockByColorAndSizeByType[typeKey][item.category] = { s: 0, m: 0, l: 0, xl: 0 };
                    }
                    stockByColorAndSizeByType[typeKey][item.category].s += (item.stock?.s || 0);
                    stockByColorAndSizeByType[typeKey][item.category].m += (item.stock?.m || 0);
                    stockByColorAndSizeByType[typeKey][item.category].l += (item.stock?.l || 0);
                    stockByColorAndSizeByType[typeKey][item.category].xl += (item.stock?.xl || 0);
                }
            } else {
                console.warn('  ⚠️ Color no reconocido o faltante:', item.category);
            }
        });

        console.log('📊 Resultado inventoryValue:', { totalUnits, stockByColor, productTypesByColor });
        const totalValue = totalUnits * 35000;
        return {
            totalUnits,
            totalValue,
            stockByColor,
            stockByColorAndSize,
            productTypesByColor,
            stockByColorByType,
            stockByColorAndSizeByType
        };
    }, [stockItems]);

    return (
        <div className="fixed inset-0 z-50 bg-background-light flex flex-col animate-slide-up">
            <header className="flex items-center justify-between px-6 pt-8 pb-4 bg-background-light/95 backdrop-blur-md sticky top-0 z-20 border-b border-pink-100">
                <button onClick={onClose} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-50 text-text-main transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-text-main text-xl font-bold tracking-tight">Analytics</h2>
                <div className="w-10 h-10"></div>
            </header>

            <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-32">
                {/* Tarjetas principales */}
                <section className="space-y-3">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-100 mb-1">Ingresos Totales</p>
                                <p className="text-3xl font-bold">${analyticsData.totalIncome.toLocaleString()}</p>
                            </div>
                            <span className="material-symbols-outlined text-green-100 !text-[40px]">arrow_downward</span>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-100 mb-1">Egresos Totales</p>
                                <p className="text-3xl font-bold">${analyticsData.totalExpense.toLocaleString()}</p>
                            </div>
                            <span className="material-symbols-outlined text-red-100 !text-[40px]">arrow_upward</span>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-pink-100 mb-1">Balance Neto</p>
                                <p className="text-3xl font-bold">${analyticsData.balance.toLocaleString()}</p>
                            </div>
                            <span className="material-symbols-outlined text-pink-100 !text-[40px]">account_balance_wallet</span>
                        </div>
                    </div>
                </section>

                {/* Total de prendas vendidas */}
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-text-main font-bold text-xl">Prendas Vendidas</h3>
                            <p className="text-text-muted text-sm mt-1">Total histórico</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
                            <span className="text-sm font-semibold text-text-main">Musculosas</span>
                            <span className="text-2xl font-bold text-primary">{analyticsData.soldByProduct.musculosa}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
                            <span className="text-sm font-semibold text-text-main">Remeras</span>
                            <span className="text-2xl font-bold text-primary">{analyticsData.soldByProduct.remera}</span>
                        </div>
                    </div>
                </section>

                {/* Selector de producto para analytics */}
                <section className="bg-white rounded-2xl p-4 shadow-soft border border-pink-100">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-main">Filtrar analíticas por prenda</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setAnalyticsProductType('musculosa')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${analyticsProductType === 'musculosa' ? 'bg-primary text-white' : 'bg-pink-50 text-text-muted'}`}
                            >
                                Musculosas
                            </button>
                            <button
                                onClick={() => setAnalyticsProductType('remera')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${analyticsProductType === 'remera' ? 'bg-primary text-white' : 'bg-pink-50 text-text-muted'}`}
                            >
                                Remeras
                            </button>
                        </div>
                    </div>
                </section>

                {/* Gráfico de torta */}
                {pieData.length > 0 && (
                    <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-100">
                        <h3 className="text-text-main font-bold text-lg mb-4">Distribución por Diseño</h3>
                        <div className="flex items-center justify-center mb-6">
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                {pieData.map((slice, index) => (
                                    <path
                                        key={index}
                                        d={createPieSlice(slice.startAngle, slice.endAngle)}
                                        fill={slice.color}
                                        stroke="white"
                                        strokeWidth="2"
                                    />
                                ))}
                            </svg>
                        </div>
                        <div className="space-y-2">
                            {pieData.map((slice, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div>
                                        <span className="text-sm font-medium text-text-main">{slice.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-text-main">{slice.count}</span>
                                        <span className="text-xs text-text-muted">({slice.percentage.toFixed(1)}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Gráfico de barras */}
                {pieData.length > 0 && (
                    <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-100">
                        <h3 className="text-text-main font-bold text-xl mb-6">Ventas por Diseño</h3>
                        <div className="space-y-4">
                            {pieData.map((slice, index) => {
                                const maxCount = Math.max(...pieData.map(s => s.count));
                                const barWidth = maxCount > 0 ? (slice.count / maxCount) * 100 : 0;
                                return (
                                    <div key={index} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-text-main">{slice.label}</span>
                                            <span className="font-bold text-text-main">{slice.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${barWidth}%`, backgroundColor: slice.color }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Colores más vendidos */}
                {pieData.length > 0 && (
                    <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-100">
                        <h3 className="text-text-main font-bold text-xl mb-6">Colores Más Vendidos</h3>
                        <div className="space-y-4">
                            {Object.entries(analyticsData.colorCountsByProduct?.[analyticsProductType] || {})
                                .filter(([_, count]) => count > 0)
                                .sort((a, b) => b[1] - a[1])
                                .map(([color, count]) => {
                                    const maxCount = Math.max(...Object.values(analyticsData.colorCountsByProduct?.[analyticsProductType] || {}));
                                    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                    const colorLabels = {
                                        azul: 'Azul', blanco: 'Blanco', chocolate: 'Chocolate',
                                        gris_petroleo: 'Gris Petróleo', negro: 'Negro', verde: 'Verde'
                                    };
                                    const colorCodes = {
                                        azul: '#3b82f6', blanco: '#f3f4f6', chocolate: '#7B3F00',
                                        gris_petroleo: '#374151', negro: '#000000', verde: '#22c55e'
                                    };
                                    return (
                                        <div key={color} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded-full ${color === 'blanco' ? 'border border-gray-300' : ''}`} style={{ backgroundColor: colorCodes[color] }}></div>
                                                    <span className="font-medium text-text-main">{colorLabels[color]}</span>
                                                </div>
                                                <span className="font-bold text-text-main">{count}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: colorCodes[color] }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </section>
                )}

                {/* Talles más vendidos */}
                {pieData.length > 0 && (
                    <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-100">
                        <h3 className="text-text-main font-bold text-lg mb-6">Talles Más Vendidos</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {Object.entries(analyticsData.sizeCountsByProduct?.[analyticsProductType] || {}).map(([size, count]) => (
                                <div key={size} className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 text-center border border-primary/20">
                                    <p className="text-2xl font-bold text-primary mb-1">{count}</p>
                                    <p className="text-xs font-medium text-text-muted uppercase">{size}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Métodos de pago */}
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-100">
                    <h3 className="text-text-main font-bold text-xl mb-5">Métodos de Pago</h3>
                    <div className="space-y-4">
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="bg-blue-500 rounded-full p-2 shrink-0">
                                        <span className="material-symbols-outlined text-white !text-[24px]">account_balance</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-blue-600">Transferencia</p>
                                        <p className="text-xs text-blue-500 mt-1 whitespace-nowrap">{analyticsData.paymentMethodCounts.transferencia} transacciones</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <p className="text-lg font-bold text-blue-700 whitespace-nowrap">${analyticsData.paymentMethodIncome.transferencia.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="bg-green-500 rounded-full p-2 shrink-0">
                                        <span className="material-symbols-outlined text-white !text-[24px]">payments</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-green-600">Efectivo</p>
                                        <p className="text-xs text-green-500 mt-1 whitespace-nowrap">{analyticsData.paymentMethodCounts.efectivo} transacciones</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <p className="text-lg font-bold text-green-700 whitespace-nowrap">${analyticsData.paymentMethodIncome.efectivo.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="bg-purple-500 rounded-full p-2 shrink-0">
                                        <span className="material-symbols-outlined text-white !text-[24px]">credit_card</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-purple-600">Tarjeta</p>
                                        <p className="text-xs text-purple-500 mt-1 whitespace-nowrap">{analyticsData.paymentMethodCounts.tarjeta || 0} transacciones</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <p className="text-lg font-bold text-purple-700 whitespace-nowrap">${(analyticsData.paymentMethodIncome.tarjeta || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Distribución de gastos */}
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-100">
                    <h3 className="text-text-main font-bold text-xl mb-6">Distribución de Gastos</h3>
                    <div className="space-y-4">
                        {Object.entries(analyticsData.expenseByCategory)
                            .filter(([_, amount]) => amount > 0)
                            .sort((a, b) => b[1] - a[1])
                            .map(([category, amount]) => {
                                const barWidth = analyticsData.totalExpense > 0 ? (amount / analyticsData.totalExpense) * 100 : 0;
                                const categoryLabels = {
                                    musculosas: 'Musculosas', remeras: 'Remeras', merceria: 'Mercería',
                                    logistica: 'Logística', marketing: 'Marketing'
                                };
                                const categoryColors = {
                                    musculosas: '#f59e0b', remeras: '#10b981', merceria: '#8b5cf6',
                                    logistica: '#06b6d4', marketing: '#ec4899'
                                };
                                return (
                                    <div key={category} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-text-main">{categoryLabels[category]}</span>
                                            <span className="font-bold text-text-main text-base">${amount.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: categoryColors[category] }}></div>
                                        </div>
                                        <p className="text-xs text-text-muted text-right">{barWidth.toFixed(1)}% del total</p>
                                    </div>
                                );
                            })}
                    </div>
                </section>

                {/* Valor del inventario */}
                <section className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-xl text-white">Valor del Inventario</h3>
                            <p className="text-sm text-purple-100 mt-1">{inventoryValue.totalUnits} unidades totales</p>
                        </div>
                        <span className="material-symbols-outlined text-purple-100 !text-[40px]">inventory_2</span>
                    </div>
                    <p className="text-4xl font-bold">${inventoryValue.totalValue.toLocaleString()}</p>
                    <p className="text-xs text-purple-200 mt-2">Precio base: $35,000 por unidad</p>
                </section>

                {/* Stock por color */}
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-100">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-text-main font-bold text-xl">Stock por Color</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setStockProductType('musculosa')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${stockProductType === 'musculosa' ? 'bg-primary text-white' : 'bg-pink-50 text-text-muted'}`}
                            >
                                Musculosas
                            </button>
                            <button
                                onClick={() => setStockProductType('remera')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${stockProductType === 'remera' ? 'bg-primary text-white' : 'bg-pink-50 text-text-muted'}`}
                            >
                                Remeras
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(inventoryValue.stockByColorByType?.[stockProductType] || {})
                            .filter(([_, count]) => count > 0)
                            .sort((a, b) => b[1] - a[1])
                            .map(([color, count]) => {
                                const colorLabels = {
                                    azul: 'Azul', blanco: 'Blanco', chocolate: 'Chocolate',
                                    gris_petroleo: 'Gris Petróleo', negro: 'Negro', verde: 'Verde'
                                };
                                const colorCodes = {
                                    azul: '#3b82f6', blanco: '#f3f4f6', chocolate: '#7B3F00',
                                    gris_petroleo: '#374151', negro: '#000000', verde: '#22c55e'
                                };
                                const sizes = inventoryValue.stockByColorAndSizeByType?.[stockProductType]?.[color] || { s: 0, m: 0, l: 0, xl: 0 };
                                const selectedTypeLabel = stockProductType === 'musculosa' ? 'Musculosa' : 'Remera';
                                return (
                                    <div key={color} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full ${color === 'blanco' ? 'border border-gray-300' : ''}`} style={{ backgroundColor: colorCodes[color] }}></div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-main text-lg">{colorLabels[color]}</span>
                                                    {selectedTypeLabel && (
                                                        <div className="flex gap-1.5 mt-1">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                                                {selectedTypeLabel}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xl font-bold text-primary">{count}</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 mt-3">
                                            <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                                                <p className="text-xs font-medium text-text-muted mb-1">S</p>
                                                <p className="text-base font-bold text-text-main">{sizes.s}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                                                <p className="text-xs font-medium text-text-muted mb-1">M</p>
                                                <p className="text-base font-bold text-text-main">{sizes.m}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                                                <p className="text-xs font-medium text-text-muted mb-1">L</p>
                                                <p className="text-base font-bold text-text-main">{sizes.l}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                                                <p className="text-xs font-medium text-text-muted mb-1">XL</p>
                                                <p className="text-base font-bold text-text-main">{sizes.xl}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </section>

                {/* Comparativa mensual */}
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-100">
                    <h3 className="text-text-main font-bold text-xl mb-5">Comparativa Mensual</h3>
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                            <p className="text-sm font-semibold text-green-600 mb-1">Ingresos</p>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs text-green-600 mb-1">Mes Actual</p>
                                    <p className="text-3xl font-bold text-green-700">${analyticsData.currentMonthIncome.toLocaleString()}</p>
                                </div>
                                {analyticsData.previousMonthIncome > 0 && (
                                    <div className="text-right">
                                        <p className="text-xs text-green-600 mb-1">Mes Anterior</p>
                                        <p className="text-xl font-semibold text-green-600">${analyticsData.previousMonthIncome.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                            {analyticsData.previousMonthIncome > 0 && (
                                <div className={`mt-3 pt-3 border-t border-green-200 flex items-center gap-2 ${analyticsData.currentMonthIncome >= analyticsData.previousMonthIncome ? 'text-green-700' : 'text-red-600'}`}>
                                    <span className="material-symbols-outlined !text-[20px]">{analyticsData.currentMonthIncome >= analyticsData.previousMonthIncome ? 'trending_up' : 'trending_down'}</span>
                                    <span className="text-sm font-bold">
                                        {analyticsData.currentMonthIncome >= analyticsData.previousMonthIncome ? '+' : ''}
                                        {((analyticsData.currentMonthIncome - analyticsData.previousMonthIncome) / analyticsData.previousMonthIncome * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-xs font-medium">({analyticsData.currentMonthIncome >= analyticsData.previousMonthIncome ? '+' : '-'}${Math.abs(analyticsData.currentMonthIncome - analyticsData.previousMonthIncome).toLocaleString()})</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
                            <p className="text-sm font-semibold text-red-600 mb-1">Egresos</p>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs text-red-600 mb-1">Mes Actual</p>
                                    <p className="text-3xl font-bold text-red-700">${analyticsData.currentMonthExpense.toLocaleString()}</p>
                                </div>
                                {analyticsData.previousMonthExpense > 0 && (
                                    <div className="text-right">
                                        <p className="text-xs text-red-600 mb-1">Mes Anterior</p>
                                        <p className="text-xl font-semibold text-red-600">${analyticsData.previousMonthExpense.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                            {analyticsData.previousMonthExpense > 0 && (
                                <div className={`mt-3 pt-3 border-t border-red-200 flex items-center gap-2 ${analyticsData.currentMonthExpense >= analyticsData.previousMonthExpense ? 'text-red-700' : 'text-green-600'}`}>
                                    <span className="material-symbols-outlined !text-[20px]">{analyticsData.currentMonthExpense >= analyticsData.previousMonthExpense ? 'trending_up' : 'trending_down'}</span>
                                    <span className="text-sm font-bold">
                                        {analyticsData.currentMonthExpense >= analyticsData.previousMonthExpense ? '+' : ''}
                                        {((analyticsData.currentMonthExpense - analyticsData.previousMonthExpense) / analyticsData.previousMonthExpense * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-xs font-medium">({analyticsData.currentMonthExpense >= analyticsData.previousMonthExpense ? '+' : '-'}${Math.abs(analyticsData.currentMonthExpense - analyticsData.previousMonthExpense).toLocaleString()})</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {pieData.length === 0 && (
                    <section className="bg-white rounded-2xl p-12 shadow-soft border border-pink-100 text-center">
                        <span className="material-symbols-outlined text-gray-300 !text-[64px] mb-4">bar_chart</span>
                        <p className="text-text-muted font-medium">No hay ventas de {analyticsProductType === 'musculosa' ? 'musculosas' : 'remeras'} registradas</p>
                        <p className="text-text-muted text-sm mt-2">Las estadísticas aparecerán cuando registres ventas online</p>
                    </section>
                )}
            </main>
        </div>
    );
}

export default AnalyticsScreen;
