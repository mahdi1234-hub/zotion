"use client";

import React, { useState } from "react";
import { useSpreadsheetStore, ChartWidget } from "@/lib/spreadsheet-store";
import { Bar, BarChart, XAxis, Line, LineChart, CartesianGrid, Area, AreaChart, RadialBar, RadialBarChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Plus, X, GripVertical, BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function generateChartConfig(dataKeys: string[]): ChartConfig {
  const config: ChartConfig = {};
  dataKeys.forEach((key, i) => {
    config[key] = {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return config;
}

function parseDataRange(dataRange: string, allData: Record<string, string | number>[]): {
  labelKey: string;
  dataKeys: string[];
} {
  const parts = dataRange.split(":");
  return {
    labelKey: parts[0] || "",
    dataKeys: parts[1]?.split(",") || [],
  };
}

// Glowing Bar Chart component based on Evil Charts
function DashboardBarChart({
  chart,
  data,
}: {
  chart: ChartWidget;
  data: Record<string, string | number>[];
}) {
  const { labelKey, dataKeys } = parseDataRange(chart.dataRange, data);
  const chartConfig = generateChartConfig(dataKeys);
  const [activeProperty, setActiveProperty] = useState<string>("all");

  const CustomGradientBar = (
    props: React.SVGProps<SVGRectElement> & {
      dataKey?: string;
      activeProperty?: string;
    }
  ) => {
    const { fill, x, y, width, height, dataKey, activeProperty: ap, ...rest } = props;
    const radius = 4;
    const isActive = ap === "all" ? true : ap === dataKey;
    return (
      <>
        <rect
          x={x}
          y={y}
          rx={radius}
          width={width}
          height={height}
          stroke="none"
          fill={fill}
          opacity={isActive ? 1 : 0.1}
          filter={isActive && ap !== "all" ? `url(#glow-chart-${dataKey})` : undefined}
        />
        <defs>
          <filter id={`glow-chart-${dataKey}`} x="-200%" y="-200%" width="600%" height="600%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row justify-between">
          <CardTitle className="text-sm">
            {chart.title}
            <Badge variant="outline" className="ml-2 border-none bg-green-500/10 text-green-500">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Active</span>
            </Badge>
          </CardTitle>
          <Select value={activeProperty} onValueChange={setActiveProperty}>
            <SelectTrigger className="!h-6 !px-1.5 text-xs">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectLabel>Properties</SelectLabel>
                <SelectItem className="text-xs" value="all">All</SelectItem>
                {dataKeys.map((key) => (
                  <SelectItem key={key} className="text-xs" value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <CardDescription className="text-xs">Generated from spreadsheet data</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <XAxis
              dataKey={labelKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 8)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            {dataKeys.map((key, i) => (
              <Bar
                key={key}
                stackId="a"
                barSize={8}
                dataKey={key}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={4}
                shape={<CustomGradientBar activeProperty={activeProperty} />}
                {...(i === 0 ? { background: { fill: "currentColor", radius: 4 }, className: "dark:text-[#1A1A1C] text-[#E4E4E7]" } : {})}
                overflow="visible"
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Glowing Line Chart component based on Evil Charts
function DashboardLineChart({
  chart,
  data,
}: {
  chart: ChartWidget;
  data: Record<string, string | number>[];
}) {
  const { labelKey, dataKeys } = parseDataRange(chart.dataRange, data);
  const chartConfig = generateChartConfig(dataKeys);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {chart.title}
          <Badge variant="outline" className="ml-2 border-none bg-green-500/10 text-green-500">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs">Active</span>
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">Generated from spreadsheet data</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={labelKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => String(value).slice(0, 8)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                dataKey={key}
                type="bump"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                dot={false}
                strokeWidth={2}
                filter="url(#rainbow-line-glow)"
              />
            ))}
            <defs>
              <filter id="rainbow-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Animated Highlighted Area Chart based on Evil Charts
function DashboardAreaChart({
  chart,
  data,
}: {
  chart: ChartWidget;
  data: Record<string, string | number>[];
}) {
  const { labelKey, dataKeys } = parseDataRange(chart.dataRange, data);
  const chartConfig = generateChartConfig(dataKeys);
  const [xAxis, setXAxis] = React.useState<number | null>(null);
  const animationConfig = { glowWidth: 300 };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {chart.title}
          <Badge variant="outline" className="ml-2 border-none bg-red-500/10 text-red-500">
            <TrendingDown className="h-3 w-3" />
            <span className="text-xs">Active</span>
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">Generated from spreadsheet data</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            onMouseMove={(e) => setXAxis(e.chartX as number)}
            onMouseLeave={() => setXAxis(null)}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey={labelKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => String(value).slice(0, 8)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="animated-highlighted-mask-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="white" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              {dataKeys.map((key, i) => (
                <linearGradient key={key} id={`animated-highlighted-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
              {xAxis && (
                <mask id="animated-highlighted-mask">
                  <rect
                    x={xAxis - animationConfig.glowWidth / 2}
                    y={0}
                    width={animationConfig.glowWidth}
                    height="100%"
                    fill="url(#animated-highlighted-mask-grad)"
                  />
                </mask>
              )}
            </defs>
            {dataKeys.map((key, i) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#animated-highlighted-grad-${key})`}
                fillOpacity={0.4}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                stackId="a"
                strokeWidth={0.8}
                mask="url(#animated-highlighted-mask)"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Glowing Radial Chart based on Evil Charts
function DashboardRadialChart({
  chart,
  data,
}: {
  chart: ChartWidget;
  data: Record<string, string | number>[];
}) {
  const { labelKey, dataKeys } = parseDataRange(chart.dataRange, data);
  const valueKey = dataKeys[0] || "";
  const [activeItem, setActiveItem] = React.useState<string | null>(null);

  // Transform data for radial chart
  const radialData = data.slice(0, 8).map((item, i) => ({
    name: String(item[labelKey] || `Item ${i + 1}`),
    value: Number(item[valueKey]) || 0,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const chartConfig: ChartConfig = {
    value: { label: valueKey },
  };
  radialData.forEach((item, i) => {
    chartConfig[item.name] = {
      label: item.name,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm">
          {chart.title}
          <Badge variant="outline" className="ml-2 border-none bg-green-500/10 text-green-500">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs">Active</span>
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">Generated from spreadsheet data</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart
            data={radialData}
            innerRadius={30}
            outerRadius={110}
            onMouseMove={(d) => {
              if (d && d.activePayload && d.activePayload[0]) {
                setActiveItem(d.activePayload[0].payload.name);
              }
            }}
            onMouseLeave={() => setActiveItem(null)}
          >
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="name" />} />
            <RadialBar cornerRadius={10} dataKey="value" background className="drop-shadow-lg">
              {radialData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  filter={activeItem === entry.name ? `url(#radial-glow-${index})` : undefined}
                  opacity={activeItem === null || activeItem === entry.name ? 1 : 0.3}
                />
              ))}
            </RadialBar>
            <defs>
              {radialData.map((_, index) => (
                <filter key={index} id={`radial-glow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              ))}
            </defs>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Chart Type Selector for adding new charts
function AddChartDialog({
  onAdd,
  onClose,
  headers,
}: {
  onAdd: (type: "bar" | "line" | "area" | "radial", title: string, labelKey: string, dataKeys: string[]) => void;
  onClose: () => void;
  headers: string[];
}) {
  const [chartType, setChartType] = useState<"bar" | "line" | "area" | "radial">("bar");
  const [title, setTitle] = useState("My Chart");
  const [labelKey, setLabelKey] = useState(headers[0] || "");
  const [selectedDataKeys, setSelectedDataKeys] = useState<string[]>([]);

  const numericHeaders = headers.filter((h) => h !== labelKey);

  const toggleDataKey = (key: string) => {
    setSelectedDataKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[420px] rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-semibold text-[#202124]">Add Chart to Dashboard</h3>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-[#5f6368]">Chart Type</label>
          <div className="grid grid-cols-4 gap-2">
            {([
              { type: "bar" as const, icon: BarChart3, label: "Bar" },
              { type: "line" as const, icon: LineChartIcon, label: "Line" },
              { type: "area" as const, icon: AreaChartIcon, label: "Area" },
              { type: "radial" as const, icon: PieChart, label: "Radial" },
            ]).map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors",
                  chartType === type
                    ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                    : "border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa]"
                )}
                onClick={() => setChartType(type)}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-[#5f6368]">Chart Title</label>
          <input
            className="w-full rounded-md border border-[#dadce0] px-3 py-2 text-sm outline-none focus:border-[#1a73e8]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-[#5f6368]">Label Column (X-Axis)</label>
          <select
            className="w-full rounded-md border border-[#dadce0] px-3 py-2 text-sm outline-none focus:border-[#1a73e8]"
            value={labelKey}
            onChange={(e) => setLabelKey(e.target.value)}
          >
            {headers.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-[#5f6368]">Data Columns</label>
          <div className="flex flex-wrap gap-2">
            {numericHeaders.map((h) => (
              <button
                key={h}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  selectedDataKeys.includes(h)
                    ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                    : "border-[#dadce0] text-[#5f6368] hover:bg-[#f8f9fa]"
                )}
                onClick={() => toggleDataKey(h)}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="rounded-md px-4 py-2 text-sm text-[#5f6368] hover:bg-[#f8f9fa]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1557b0] disabled:opacity-50"
            disabled={!title || !labelKey || selectedDataKeys.length === 0}
            onClick={() => {
              onAdd(chartType, title, labelKey, selectedDataKeys);
              onClose();
            }}
          >
            Add Chart
          </button>
        </div>
      </div>
    </div>
  );
}

export function SpreadsheetDashboard() {
  const { dashboardCharts, addChart, removeChart, getAllData, getHeaders, showDashboard, setShowDashboard } = useSpreadsheetStore();
  const [showAddChart, setShowAddChart] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const data = getAllData();
  const headers = getHeaders();

  if (!showDashboard) return null;

  const handleAddChart = (
    type: "bar" | "line" | "area" | "radial",
    title: string,
    labelKey: string,
    dataKeys: string[]
  ) => {
    addChart({
      type,
      title,
      dataRange: `${labelKey}:${dataKeys.join(",")}`,
      x: 0,
      y: 0,
      width: 400,
      height: 300,
    });
  };

  const renderChart = (chart: ChartWidget) => {
    switch (chart.type) {
      case "bar":
        return <DashboardBarChart chart={chart} data={data} />;
      case "line":
        return <DashboardLineChart chart={chart} data={data} />;
      case "area":
        return <DashboardAreaChart chart={chart} data={data} />;
      case "radial":
        return <DashboardRadialChart chart={chart} data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#f8f9fa]">
      {/* Dashboard header */}
      <div className="flex items-center justify-between border-b border-[#e2e3e3] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#1a73e8]" />
          <h2 className="text-sm font-semibold text-[#202124]">Dashboard</h2>
          <span className="text-xs text-[#5f6368]">({dashboardCharts.length} charts)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 rounded-md bg-[#1a73e8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1557b0]"
            onClick={() => setShowAddChart(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Chart
          </button>
          <button
            className="rounded-md border border-[#dadce0] px-3 py-1.5 text-xs text-[#5f6368] hover:bg-[#f8f9fa]"
            onClick={() => setShowDashboard(false)}
          >
            Back to Sheet
          </button>
        </div>
      </div>

      {/* Charts grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {dashboardCharts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <BarChart3 className="mb-3 h-12 w-12 text-[#dadce0]" />
            <p className="text-sm font-medium text-[#5f6368]">No charts yet</p>
            <p className="mt-1 text-xs text-[#80868b]">
              Add charts from your spreadsheet data to build your dashboard
            </p>
            <button
              className="mt-4 flex items-center gap-1 rounded-md bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1557b0]"
              onClick={() => setShowAddChart(true)}
            >
              <Plus className="h-4 w-4" />
              Add Your First Chart
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {dashboardCharts.map((chart) => (
              <div
                key={chart.id}
                className={cn(
                  "relative rounded-xl transition-shadow",
                  dragId === chart.id ? "shadow-xl ring-2 ring-[#1a73e8]" : "shadow-sm"
                )}
                draggable
                onDragStart={() => setDragId(chart.id)}
                onDragEnd={() => setDragId(null)}
              >
                <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                  <button className="rounded p-1 text-[#80868b] hover:bg-[#f8f9fa] hover:text-[#5f6368] cursor-grab">
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="rounded p-1 text-[#80868b] hover:bg-red-50 hover:text-red-500"
                    onClick={() => removeChart(chart.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {renderChart(chart)}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddChart && (
        <AddChartDialog
          onAdd={handleAddChart}
          onClose={() => setShowAddChart(false)}
          headers={headers}
        />
      )}
    </div>
  );
}
