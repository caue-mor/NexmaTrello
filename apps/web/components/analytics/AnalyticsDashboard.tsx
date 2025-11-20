"use client";

import { useState, useEffect, useRef } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Table } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface AnalyticsData {
    completedOverTime: { date: string; count: number }[];
    columnDistribution: { name: string; value: number }[];
    priorityDistribution: { name: string; value: number }[];
    metrics: {
        totalCards: number;
        completedTotal: number;
        completionRate: number;
    };
}

export function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState("30");
    const dashboardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, [range]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics?range=${range}`);
            if (res.ok) {
                const jsonData = await res.json();
                setData(jsonData);
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!dashboardRef.current) return;

        try {
            const canvas = await html2canvas(dashboardRef.current);
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`relatorio-nexlist-${range}dias.pdf`);
        } catch (error) {
            console.error("Error exporting PDF:", error);
        }
    };

    const handleExportData = (format: "csv" | "xlsx") => {
        window.open(`/api/reports/export?format=${format}&range=${range}`, "_blank");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6" ref={dashboardRef}>
            {/* Header & Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    Relatórios e Métricas
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Últimos 7 dias</SelectItem>
                            <SelectItem value="30">Últimos 30 dias</SelectItem>
                            <SelectItem value="90">Últimos 90 dias</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1 border-l pl-2 ml-2 border-neutral-200 dark:border-neutral-700">
                        <Button variant="outline" size="icon" onClick={handleExportPDF} title="Exportar PDF">
                            <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleExportData("xlsx")} title="Exportar Excel">
                            <FileSpreadsheet className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleExportData("csv")} title="Exportar CSV">
                            <Table className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Total de Cards"
                    value={data.metrics.totalCards}
                    description="Em todos os quadros"
                />
                <MetricCard
                    title="Cards Concluídos"
                    value={data.metrics.completedTotal}
                    description="Neste período"
                />
                <MetricCard
                    title="Taxa de Conclusão"
                    value={`${data.metrics.completionRate}%`}
                    description="Eficiência geral"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Produtividade Diária</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.completedOverTime}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Cards Concluídos"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição por Coluna</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.columnDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" name="Cards">
                                    {data.columnDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição por Prioridade</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.priorityDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.priorityDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, description }: { title: string; value: string | number; description: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}
